import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

import { prepareMockAvatars } from "../lib/mock-creators/avatars";
import { cleanupMockCreators } from "../lib/mock-creators/cleanup";
import { mapMockGenderToCreatorGender } from "../lib/mock-creators/demographics";
import {
	buildMockCreatorPlans,
	distributeClicksAcrossSocials,
	distributeEventTimestamps,
	type MockSocialPlan,
} from "../lib/mock-creators/generators";
import { MOCK_IDENTITIES } from "../lib/mock-creators/identities";
import { createRng, MOCK_SEED_KEY } from "../lib/mock-creators/rng";
import { allocateMockUsernames, mockEmailForUsername } from "../lib/mock-creators/usernames";
import { verifyMockSeed } from "../lib/mock-creators/verify";
import { db } from "../prisma/client";
import { listActiveCreatorCategories } from "../prisma/queries/categories";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

loadEnv({ path: path.resolve(repoRoot, ".env.local") });
loadEnv({ path: path.resolve(repoRoot, ".env") });

const EVENT_BATCH_SIZE = 1000;

function visitorHash(seed: string): string {
	return createHash("sha256").update(seed).digest("hex");
}

async function insertAnalyticsBatched(
	rows: Array<{
		creatorId: string;
		type: "PROFILE_VIEW" | "SOCIAL_CLICK";
		socialProfileId?: string | null;
		platformSnapshot?: string | null;
		urlSnapshot?: string | null;
		visitorKeyHash?: string | null;
		createdAt: Date;
	}>,
) {
	for (let i = 0; i < rows.length; i += EVENT_BATCH_SIZE) {
		const chunk = rows.slice(i, i + EVENT_BATCH_SIZE);
		await db.creatorAnalyticsEvent.createMany({ data: chunk });
		console.info(`  analytics batch ${Math.floor(i / EVENT_BATCH_SIZE) + 1}: +${chunk.length}`);
	}
}

async function main() {
	console.info("=== seed-mock-creators ===");
	console.info(`Seed key: ${MOCK_SEED_KEY}`);

	const categories = await listActiveCreatorCategories();
	if (categories.length === 0) {
		throw new Error(
			"No active CreatorCategory rows found. Run: pnpm --filter @repo/database seed:categories",
		);
	}
	console.info(`Active categories: ${categories.length}`);

	const cleaned = await cleanupMockCreators();
	console.info(
		`Cleaned prior mock data: ${cleaned.deletedUsers} users, ${cleaned.deletedPending} pending`,
	);

	const rng = createRng(MOCK_SEED_KEY);
	const usernames = allocateMockUsernames(MOCK_IDENTITIES.map((i) => i.publicName));
	const emails = usernames.map(mockEmailForUsername);
	const genders = MOCK_IDENTITIES.map((i) => i.gender);

	console.info("Preparing gender-matched avatars…");
	const avatarFilenames = await prepareMockAvatars({ genders, repoRoot });

	const now = new Date();
	const plans = buildMockCreatorPlans({
		usernames,
		emails,
		publicNames: MOCK_IDENTITIES.map((i) => i.publicName),
		descriptions: MOCK_IDENTITIES.map((i) => i.description),
		avatarFilenames,
		countryCodes: MOCK_IDENTITIES.map((i) => i.countryCode),
		genders: MOCK_IDENTITIES.map((i) => mapMockGenderToCreatorGender(i.gender)),
		languages: MOCK_IDENTITIES.map((i) => [...i.languages]),
		categories: categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
		now,
		rng,
	});

	console.info(`Inserting ${plans.length} creators…`);
	const analyticsRows: Array<{
		creatorId: string;
		type: "PROFILE_VIEW" | "SOCIAL_CLICK";
		socialProfileId?: string | null;
		platformSnapshot?: string | null;
		urlSnapshot?: string | null;
		visitorKeyHash?: string | null;
		createdAt: Date;
	}> = [];

	for (const [planIndex, plan] of plans.entries()) {
		const user = await db.user.create({
			data: {
				name: plan.publicName,
				email: plan.email,
				emailVerified: true,
				image: plan.avatarFilename,
				username: plan.username,
				// Powers the public "Contact for Business" button on creator profiles
				businessEmail: `biz.${plan.username}@example.com`,
				role: "user",
				onboardingComplete: true,
				createdAt: plan.joinedAt,
				updatedAt: plan.joinedAt,
			},
		});

		const allSocials: MockSocialPlan[] = [
			...plan.socials,
			...(plan.softDeletedSocial ? [plan.softDeletedSocial] : []),
		];

		const creator = await db.creatorProfile.create({
			data: {
				userId: user.id,
				publicName: plan.publicName,
				avatarUrl: plan.avatarFilename,
				description: plan.description,
				countryCode: plan.countryCode,
				gender: plan.gender,
				languages: plan.languages,
				categoryId: plan.categoryId,
				totalBidCents: plan.totalBidCents,
				currency: "USD",
				joinedAt: plan.joinedAt,
				bidReachedAt: plan.bidReachedAt,
				accountClaimedAt: plan.accountClaimedAt,
				isPublished: plan.isPublished,
				createdAt: plan.joinedAt,
				updatedAt: plan.bidReachedAt,
				socialProfiles: {
					create: allSocials.map((social) => ({
						platform: social.platform,
						url: social.url,
						normalizedUrl: social.normalizedUrl,
						position: social.position,
						deletedAt: social.deletedAt,
						createdAt: plan.joinedAt,
						updatedAt: social.deletedAt ?? plan.joinedAt,
					})),
				},
			},
			include: {
				socialProfiles: true,
			},
		});

		await db.creatorBid.createMany({
			data: plan.bids.map((bid) => ({
				creatorId: creator.id,
				type: bid.type,
				status: bid.status,
				amountCents: bid.amountCents,
				currency: "USD",
				totalAfterCents: bid.totalAfterCents,
				paymentSource: "MOCK" as const,
				providerPaymentId: `mock-pay:${bid.idempotencyKey}`,
				idempotencyKey: bid.idempotencyKey,
				createdAt: bid.createdAt,
				paidAt: bid.paidAt,
			})),
		});

		const socialByKey = new Map(
			creator.socialProfiles.map((s) => [`${s.platform}:${s.normalizedUrl}`, s]),
		);
		const orderedSocials = allSocials.map((planSocial) => {
			const key = `${planSocial.platform}:${planSocial.normalizedUrl}`;
			const row = socialByKey.get(key);
			if (!row) {
				throw new Error(`Missing social row for ${plan.username} ${key}`);
			}
			return { plan: planSocial, row };
		});

		const viewStamps = distributeEventTimestamps(plan.viewCount, plan.joinedAt, now, rng);
		for (const [vi, createdAt] of viewStamps.entries()) {
			analyticsRows.push({
				creatorId: creator.id,
				type: "PROFILE_VIEW",
				visitorKeyHash: visitorHash(`${plan.username}:view:${vi}`),
				createdAt,
			});
		}

		const clickCounts = distributeClicksAcrossSocials(
			plan.clickCount,
			orderedSocials.map((s) => s.plan),
			rng,
		);
		for (const [si, social] of orderedSocials.entries()) {
			const n = clickCounts[si] ?? 0;
			if (n <= 0) {
				continue;
			}
			const clickTo = social.plan.deletedAt ?? now;
			const from = plan.joinedAt;
			const to = clickTo.getTime() > from.getTime() ? clickTo : now;
			const clickStamps = distributeEventTimestamps(n, from, to, rng);
			for (const [ci, createdAt] of clickStamps.entries()) {
				analyticsRows.push({
					creatorId: creator.id,
					type: "SOCIAL_CLICK",
					socialProfileId: social.row.id,
					platformSnapshot: social.plan.platform,
					urlSnapshot: social.plan.url,
					visitorKeyHash: visitorHash(`${plan.username}:click:${si}:${ci}`),
					createdAt,
				});
			}
		}

		if ((planIndex + 1) % 20 === 0 || planIndex === plans.length - 1) {
			console.info(`  creators ${planIndex + 1}/${plans.length}`);
		}
	}

	console.info(`Inserting ${analyticsRows.length} analytics events…`);
	await insertAnalyticsBatched(analyticsRows);

	console.info("Running consistency checks…");
	await verifyMockSeed();

	const published = plans.filter((p) => p.isPublished).length;
	const claimed = plans.filter((p) => p.accountClaimedAt).length;
	const paidBids = plans.reduce(
		(sum, p) => sum + p.bids.filter((b) => b.status === "PAID").length,
		0,
	);
	const failedBids = plans.reduce(
		(sum, p) => sum + p.bids.filter((b) => b.status === "FAILED").length,
		0,
	);

	console.info("=== seed-mock-creators complete ===");
	console.info(`Creators: ${plans.length} (${published} published, ${claimed} claimed)`);
	console.info(`Paid bids: ${paidBids}, Failed bids: ${failedBids}`);
	console.info(`Analytics events: ${analyticsRows.length}`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
