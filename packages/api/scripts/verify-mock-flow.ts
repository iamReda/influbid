import { resolve } from "node:path";

/**
 * End-to-end mock-payment business flow verification against the local database.
 *
 * Usage:
 *   pnpm --filter @repo/api verify:mock-flow
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: resolve(process.cwd(), "../../.env.local") });
loadEnv({ path: resolve(process.cwd(), "../../.env") });

process.env.MOCK_PAYMENTS ??= "true";
process.env.NODE_ENV = process.env.NODE_ENV === "production" ? "development" : process.env.NODE_ENV;

import {
	countAnalyticsEvents,
	createAnalyticsEvent,
	createPendingCreator,
	db,
	estimateRank,
	getCreatorProfileByUserId,
	getPublishedCreatorByUsername,
	getCreatorRank,
	isPrimarySocialUrlTaken,
	listActiveCreatorCategories,
	listCategoryCards,
	listLeaderboard,
	listPaidCreatorBids,
	listRecentPaidBids,
	markCreatorAccountClaimed,
	MIN_BID_CENTS,
	normalizeSocialUrl,
	updateCreatorProfile,
} from "@repo/database";

import { finalizeBidIncrease } from "../modules/creators/lib/finalize-bid-increase";
import { finalizeCreatorPayment } from "../modules/creators/lib/finalize-creator-payment";
import {
	assertMockPaymentsAllowed,
	isMockPaymentsEnabled,
} from "../modules/creators/lib/mock-payments";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(`ASSERT: ${message}`);
	}
}

async function main() {
	console.log("MOCK_PAYMENTS enabled:", isMockPaymentsEnabled());
	assertMockPaymentsAllowed();

	const categories = await listActiveCreatorCategories();
	assert(categories.length > 0, "categories must be seeded");
	const category = categories[0]!;
	console.log("✓ categories seeded:", categories.length);

	const stamp = Date.now().toString(36);
	const email = `mockflow.${stamp}@example.com`;
	const instagramUrl = `https://instagram.com/mockflow_${stamp}`;
	const tiktokUrl = `https://tiktok.com/@mockflow_${stamp}`;
	const bidAmountCents = MIN_BID_CENTS + 1500;

	const pending = await createPendingCreator({
		email,
		publicName: `Mock Flow ${stamp}`,
		avatarUrl: `avatars/mockflow-${stamp}.png`,
		description: "E2E mock flow creator",
		categoryId: category.id,
		socialProfiles: [
			{ platform: "instagram", url: instagramUrl, position: 0 },
			{ platform: "tiktok", url: tiktokUrl, position: 1 },
		],
		bidAmountCents,
		estimatedRank: 1,
	});
	assert(pending.status === "PENDING_PAYMENT", "pending starts as PENDING_PAYMENT");
	console.log("✓ pending creator created");

	const paymentReference = `mock_${pending.id}_${stamp}`;
	const first = await finalizeCreatorPayment({
		pendingCreatorId: pending.id,
		paymentReference,
		paymentSource: "MOCK",
		providerPaymentId: paymentReference,
	});
	assert(!first.alreadyFinalized, "first finalize is not alreadyFinalized");
	assert(first.creatorId, "creatorId returned");
	assert(first.username, "username allocated");
	console.log("✓ initial payment finalized →", first.username);

	const creator = await getCreatorProfileByUserId(first.userId!);
	assert(creator, "creator profile exists");
	assert(creator.isPublished, "creator published");
	assert(creator.totalBidCents === bidAmountCents, "totalBidCents matches initial bid");
	assert(creator.joinedAt instanceof Date, "joinedAt set");
	assert(creator.accountClaimedAt === null, "accountClaimedAt starts null");
	const joinedAtMs = creator.joinedAt.getTime();
	console.log("✓ joinedAt set, accountClaimedAt null");

	const second = await finalizeCreatorPayment({
		pendingCreatorId: pending.id,
		paymentReference,
		paymentSource: "MOCK",
		providerPaymentId: paymentReference,
	});
	assert(second.alreadyFinalized, "repeat finalize is idempotent");
	assert(second.creatorId === first.creatorId, "idempotent creatorId stable");
	assert(second.username === first.username, "idempotent username stable");
	console.log("✓ finalize idempotency OK");

	const bidsAfterInitial = await listPaidCreatorBids(creator.id);
	assert(bidsAfterInitial.length === 1, "exactly one INITIAL paid bid");
	assert(bidsAfterInitial[0]?.type === "INITIAL", "bid type INITIAL");

	assert(
		await isPrimarySocialUrlTaken(normalizeSocialUrl(instagramUrl)),
		"primary social marked taken",
	);
	console.log("✓ primary social duplicate protection OK");

	const generalRank = await getCreatorRank({
		creatorId: creator.id,
		totalBidCents: creator.totalBidCents,
		bidReachedAt: creator.bidReachedAt,
	});
	const categoryRank = await getCreatorRank({
		creatorId: creator.id,
		totalBidCents: creator.totalBidCents,
		bidReachedAt: creator.bidReachedAt,
		categoryId: creator.categoryId,
	});
	assert(generalRank >= 1, "general rank computed");
	assert(categoryRank >= 1, "category rank computed");

	const leaderboard = await listLeaderboard({ page: 1, pageSize: 50 });
	assert(
		leaderboard.items.some((item) => item.id === creator.id),
		"creator appears on general leaderboard",
	);
	const cards = await listCategoryCards();
	assert(
		cards.some((card) => card.slug === category.slug && card.influencerCount >= 1),
		"category cards include creator category",
	);
	console.log("✓ rankings + categories OK", { generalRank, categoryRank });

	const increaseCents = MIN_BID_CENTS;
	const beforeIncrease = creator.totalBidCents;
	const increaseKey = `increase:${creator.id}:${stamp}`;
	const increase = await finalizeBidIncrease({
		creatorId: creator.id,
		amountCents: increaseCents,
		idempotencyKey: increaseKey,
		paymentSource: "MOCK",
		providerPaymentId: increaseKey,
	});
	assert(!increase.alreadyFinalized, "first increase applied");
	assert(increase.totalBidCents === beforeIncrease + increaseCents, "cumulative total updated");

	const increaseAgain = await finalizeBidIncrease({
		creatorId: creator.id,
		amountCents: increaseCents,
		idempotencyKey: increaseKey,
		paymentSource: "MOCK",
		providerPaymentId: increaseKey,
	});
	assert(increaseAgain.alreadyFinalized, "increase finalize idempotent");
	assert(
		increaseAgain.totalBidCents === increase.totalBidCents,
		"idempotent increase does not double-apply",
	);

	const afterIncrease = await getCreatorProfileByUserId(first.userId!);
	assert(afterIncrease, "creator still exists");
	assert(afterIncrease.joinedAt.getTime() === joinedAtMs, "joinedAt unchanged after increase");
	assert(
		afterIncrease.totalBidCents === beforeIncrease + increaseCents,
		"totalBidCents after increase",
	);
	const estimated = await estimateRank({
		bidAmountCents: afterIncrease.totalBidCents,
		excludeCreatorId: afterIncrease.id,
	});
	assert(estimated >= 1, "estimateRank works after increase");
	console.log("✓ rank-higher cumulative bid OK", {
		totalBidCents: afterIncrease.totalBidCents,
	});

	await createAnalyticsEvent({
		creatorId: creator.id,
		type: "PROFILE_VIEW",
		visitorKeyHash: `visitor_${stamp}`,
	});
	await createAnalyticsEvent({
		creatorId: creator.id,
		type: "PROFILE_VIEW",
		visitorKeyHash: `visitor_${stamp}`,
	});

	const activeSocial = afterIncrease.socialProfiles[0];
	assert(activeSocial, "active social exists");
	await createAnalyticsEvent({
		creatorId: creator.id,
		type: "SOCIAL_CLICK",
		socialProfileId: activeSocial.id,
		platformSnapshot: activeSocial.platform,
		urlSnapshot: activeSocial.url,
		visitorKeyHash: `click_${stamp}`,
	});
	const views = await countAnalyticsEvents({ creatorId: creator.id, type: "PROFILE_VIEW" });
	const clicks = await countAnalyticsEvents({ creatorId: creator.id, type: "SOCIAL_CLICK" });
	assert(views >= 2, "dashboard views count each profile open");
	assert(clicks >= 1, "dashboard clicks count");
	console.log("✓ analytics PROFILE_VIEW + SOCIAL_CLICK OK", { views, clicks });

	const published = await getPublishedCreatorByUsername(first.username!);
	assert(published, "public profile by username");
	assert(published.socialProfiles.length === 2, "two active socials initially");

	await updateCreatorProfile({
		userId: first.userId!,
		publicName: `Mock Flow Updated ${stamp}`,
		description: "Updated description",
		businessEmail: `biz.${stamp}@example.com`,
		socialUrls: [instagramUrl],
	});
	const edited = await getCreatorProfileByUserId(first.userId!);
	assert(edited, "edited creator exists");
	assert(edited.publicName.includes("Updated"), "publicName updated");
	assert(edited.socialProfiles.length === 1, "soft-delete removed tiktok from active list");
	assert(edited.socialProfiles[0]?.url === instagramUrl, "instagram remains primary");
	assert(edited.user.businessEmail === `biz.${stamp}@example.com`, "business email updated");

	const allSocialsIncludingDeleted = await db.socialProfile.findMany({
		where: { creatorId: creator.id },
	});
	assert(
		allSocialsIncludingDeleted.some((social) => social.deletedAt !== null),
		"soft-deleted social row retained",
	);
	console.log("✓ profile edit + social soft-delete OK");

	await markCreatorAccountClaimed(creator.id);
	const claimed = await getCreatorProfileByUserId(first.userId!);
	assert(claimed?.accountClaimedAt, "accountClaimedAt set on claim");
	assert(claimed!.joinedAt.getTime() === joinedAtMs, "joinedAt unchanged after claim");
	console.log("✓ accountClaimedAt OK");

	const recent = await listRecentPaidBids(20);
	assert(
		recent.some((bid) => bid.creatorId === creator.id),
		"recent bids include creator",
	);

	await createPendingCreator({
		email,
		publicName: "Duplicate Email Attempt",
		avatarUrl: `avatars/dup-${stamp}.png`,
		categoryId: category.id,
		socialProfiles: [
			{
				platform: "instagram",
				url: `https://instagram.com/other_${stamp}`,
				position: 0,
			},
		],
		bidAmountCents: MIN_BID_CENTS,
	}).then(async (dupPending) => {
		const dup = await finalizeCreatorPayment({
			pendingCreatorId: dupPending.id,
			paymentReference: `mock_dup_${stamp}`,
			paymentSource: "MOCK",
			providerPaymentId: `mock_dup_${stamp}`,
		});
		assert(dup.alreadyFinalized, "existing email finalize is treated as already finalized");
		assert(dup.creatorId === first.creatorId, "duplicate email reuses existing creator");
	});
	console.log("✓ duplicate email protection OK");

	console.log("\nAll mock-payment business flow checks passed.");
}

main().catch((error) => {
	console.error("\nMock flow verification FAILED");
	console.error(error);
	process.exit(1);
});
