import { auth } from "@repo/auth";
import {
	createCreatorBid,
	createCreatorProfileWithSocials,
	createUser,
	getCreatorBidByIdempotencyKey,
	getCreatorProfileByUserId,
	getPendingCreatorById,
	getPendingSocialProfiles,
	getUserByEmail,
	isPrimarySocialUrlTaken,
	MIN_BID_CENTS,
	normalizeSocialUrl,
	updatePendingCreatorStatus,
	updateUser,
} from "@repo/database";
import { logger } from "@repo/logs";
import { getBaseUrl } from "@repo/utils";

export type FinalizeCreatorPaymentInput = {
	pendingCreatorId: string;
	paymentReference: string;
	paymentSource: "MOCK" | "STRIPE";
	providerPaymentId?: string | null;
};

async function alreadyFinalizedResult(options: {
	pendingCreatorId: string;
	userId: string | null;
	creatorId?: string | null;
	username?: string | null;
	email?: string | null;
}) {
	return {
		alreadyFinalized: true as const,
		userId: options.userId,
		creatorId: options.creatorId ?? undefined,
		pendingCreatorId: options.pendingCreatorId,
		username: options.username ?? null,
		email: options.email ?? null,
	};
}

function magicLinkRequestHeaders() {
	const saasBase = getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000);
	return new Headers({
		origin: saasBase,
		referer: `${saasBase}/`,
		"content-type": "application/json",
	});
}

export async function finalizeCreatorPayment(input: FinalizeCreatorPaymentInput) {
	const pending = await getPendingCreatorById(input.pendingCreatorId);

	if (!pending) {
		throw new Error("Pending creator not found");
	}

	const idempotencyKey = `initial:${input.paymentReference}`;
	const existingBid = await getCreatorBidByIdempotencyKey(idempotencyKey);
	if (existingBid?.status === "PAID") {
		const profile = await getCreatorProfileByUserId(existingBid.creator.userId);
		return alreadyFinalizedResult({
			pendingCreatorId: pending.id,
			userId: existingBid.creator.userId,
			creatorId: existingBid.creatorId,
			username: profile?.user.username ?? null,
			email: pending.email,
		});
	}

	if (pending.status === "COMPLETED") {
		const existingUser = await getUserByEmail(pending.email);
		const existingProfile = existingUser ? await getCreatorProfileByUserId(existingUser.id) : null;
		return alreadyFinalizedResult({
			pendingCreatorId: pending.id,
			userId: existingUser?.id ?? null,
			creatorId: existingProfile?.id,
			username: existingProfile?.user.username ?? null,
			email: pending.email,
		});
	}

	if (pending.status === "EXPIRED" || pending.expiresAt.getTime() < Date.now()) {
		throw new Error("Pending creator has expired");
	}

	if (pending.bidAmountCents < MIN_BID_CENTS) {
		throw new Error(`Bid must be at least ${MIN_BID_CENTS} cents`);
	}

	const socialProfiles = getPendingSocialProfiles(pending);
	if (socialProfiles.length < 1 || socialProfiles.length > 10) {
		throw new Error("Social profiles must be between 1 and 10");
	}

	const primary = [...socialProfiles].sort((a, b) => a.position - b.position)[0];
	if (!primary) {
		throw new Error("Primary social profile is required");
	}

	const primaryNormalized = normalizeSocialUrl(primary.url);
	if (await isPrimarySocialUrlTaken(primaryNormalized)) {
		throw new Error("Primary social profile is already claimed");
	}

	const existingUser = await getUserByEmail(pending.email);
	if (existingUser) {
		const existingProfile = await getCreatorProfileByUserId(existingUser.id);
		if (existingProfile) {
			await updatePendingCreatorStatus(pending.id, "COMPLETED", {
				paymentReference: input.paymentReference,
			});
			return alreadyFinalizedResult({
				pendingCreatorId: pending.id,
				userId: existingUser.id,
				creatorId: existingProfile.id,
				username: existingProfile.user.username ?? null,
				email: pending.email,
			});
		}
	}

	const paidAt = new Date();

	await updatePendingCreatorStatus(pending.id, "PROCESSING", {
		paymentReference: input.paymentReference,
	});

	let user = existingUser;

	if (!user) {
		user = await createUser({
			email: pending.email,
			name: pending.publicName,
			role: "user",
			emailVerified: true,
			onboardingComplete: true,
		});
	} else {
		await updateUser({
			id: user.id,
			emailVerified: true,
			onboardingComplete: true,
		});
	}

	await updateUser({
		id: user.id,
		name: pending.publicName,
		image: pending.avatarUrl,
	});

	let creator = await getCreatorProfileByUserId(user.id);

	if (!creator) {
		creator = await createCreatorProfileWithSocials({
			userId: user.id,
			publicName: pending.publicName,
			avatarUrl: pending.avatarUrl,
			description: pending.description,
			categoryId: pending.categoryId,
			totalBidCents: pending.bidAmountCents,
			currency: pending.currency,
			joinedAt: paidAt,
			bidReachedAt: paidAt,
			isPublished: true,
			socialProfiles: socialProfiles.map((social) => ({
				platform: social.platform,
				url: social.url,
				position: social.position,
			})),
		});
	}

	if (!(await getCreatorBidByIdempotencyKey(idempotencyKey))) {
		await createCreatorBid({
			creatorId: creator.id,
			type: "INITIAL",
			status: "PAID",
			amountCents: pending.bidAmountCents,
			currency: pending.currency,
			totalAfterCents: creator.totalBidCents,
			paymentSource: input.paymentSource,
			providerPaymentId: input.providerPaymentId ?? input.paymentReference,
			idempotencyKey,
			paidAt,
		});
	}

	await updatePendingCreatorStatus(pending.id, "COMPLETED", {
		paymentReference: input.paymentReference,
	});

	// Relative paths resolve against Better Auth `baseURL` (SaaS), so the same
	// flow works locally (ports 3000/3001) and on any hosted SaaS domain.
	const callbackURL = "/dashboard";
	const errorCallbackURL = "/login";

	try {
		await auth.api.signInMagicLink({
			body: {
				email: pending.email,
				callbackURL,
				errorCallbackURL,
				name: pending.publicName,
			},
			headers: magicLinkRequestHeaders(),
		});
	} catch (error) {
		logger.error(error, {
			ctx: "finalizeCreatorPayment.signInMagicLink",
			email: pending.email,
			pendingCreatorId: pending.id,
		});
	}

	const refreshed = await getCreatorProfileByUserId(user.id);

	return {
		alreadyFinalized: false as const,
		userId: user.id,
		creatorId: creator.id,
		pendingCreatorId: pending.id,
		username: refreshed?.user.username ?? creator.user.username,
		email: pending.email,
	};
}
