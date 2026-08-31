"use server";

import {
	assertMockPaymentsAllowed,
	finalizeCreatorPayment,
	isMockPaymentsEnabled,
} from "@repo/api";
import {
	createPendingCreator,
	detectSocialPlatform,
	estimateRank,
	getCreatorCategoryById,
	getCreatorProfileByUserId,
	getCreatorRank,
	getLeadingTotalBidCents,
	getUserByEmail,
	isPrimarySocialUrlTaken,
	listActiveCreatorCategories,
	listCategoryCards,
	listLeaderboard,
	listRecentPaidBids,
	MIN_BID_CENTS,
	normalizeSocialUrl,
} from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { countryCodeSchema } from "@repo/utils";

import type { Platform } from "./bid-form/social-platform-icon";
import { formatRelativeJoinedAt, getPublicAvatarUrl } from "./lib/format";
import { SOCIAL_PLATFORMS } from "./lib/social-url";
import { RECENT_SIGNUPS_WINDOW_HOURS, type RecentBid } from "./recent-bids/recent-bids";

export type CategoryOptionDto = {
	id: string;
	name: string;
	slug: string;
	icon: string | null;
	color: string | null;
	order: number;
};

export type LeaderboardItemDto = {
	id: string;
	rank: number;
	name: string;
	avatar: string;
	description: string;
	categorySlug: string;
	categoryName: string;
	socials: Array<{ id: string; platform: Platform }>;
	profileUrl: string;
	bid: number;
	addedAgo: string;
	clicks: number;
	countryCode: string | null;
};

export type CategoryCardDto = {
	id: string;
	name: string;
	slug: string;
	icon: string | null;
	color: string | null;
	order: number;
	influencerCount: number;
	topCreators: Array<{
		id: string;
		publicName: string;
		avatarUrl: string;
		totalBidCents: number;
		username: string | null;
	}>;
};

function toPlatform(value: string): Platform | null {
	return SOCIAL_PLATFORMS.includes(value as Platform) ? (value as Platform) : null;
}

export async function fetchActiveCategoriesAction(): Promise<CategoryOptionDto[]> {
	const categories = await listActiveCreatorCategories();
	return categories.map((category) => ({
		id: category.id,
		name: category.name,
		slug: category.slug,
		icon: category.icon,
		color: category.color,
		order: category.order,
	}));
}

/**
 * Homepage default bid:
 * - empty board → $5 (min)
 * - otherwise → leading bid in dollars + 1
 */
export async function fetchDefaultBidDollarsAction(): Promise<number> {
	const leadingCents = await getLeadingTotalBidCents();
	if (leadingCents <= 0) {
		return MIN_BID_CENTS / 100;
	}

	return Math.max(MIN_BID_CENTS / 100, Math.round(leadingCents / 100) + 1);
}

export async function fetchLeaderboardAction(input?: {
	categorySlug?: string;
	page?: number;
	pageSize?: number;
}): Promise<{
	items: LeaderboardItemDto[];
	total: number;
	page: number;
	pageSize: number;
}> {
	const result = await listLeaderboard({
		categorySlug: input?.categorySlug,
		page: input?.page ?? 1,
		pageSize: input?.pageSize ?? 40,
	});

	return {
		...result,
		items: result.items.map((item) => ({
			id: item.id,
			rank: item.rank,
			name: item.publicName,
			avatar: getPublicAvatarUrl(item.avatarUrl),
			description: item.description ?? "",
			categorySlug: item.categorySlug,
			categoryName: item.categoryName,
			socials: item.socials
				.map((social) => {
					const platform = toPlatform(social.platform);
					return platform ? { id: social.id, platform } : null;
				})
				.filter((social): social is { id: string; platform: Platform } => social !== null),
			profileUrl: item.username ? `/${item.username}` : "/complete-your-profile",
			bid: Math.round(item.totalBidCents / 100),
			addedAgo: formatRelativeJoinedAt(item.joinedAt),
			clicks: item.profileViewCount + item.socialClickCount,
			countryCode: item.countryCode,
		})),
	};
}

export async function fetchCategoryCardsAction(): Promise<CategoryCardDto[]> {
	const cards = await listCategoryCards();
	return cards.map((card) => ({
		...card,
		topCreators: card.topCreators.map((creator) => ({
			...creator,
			avatarUrl: getPublicAvatarUrl(creator.avatarUrl),
		})),
	}));
}

export async function fetchRecentBidsAction(limit = 20): Promise<RecentBid[]> {
	const bids = await listRecentPaidBids(limit, {
		type: "INITIAL",
		sinceHours: RECENT_SIGNUPS_WINDOW_HOURS,
		publishedOnly: true,
	});

	const ranks = await Promise.all(
		bids.map((bid) =>
			getCreatorRank({
				creatorId: bid.creatorId,
				totalBidCents: bid.totalBidCents,
				bidReachedAt: bid.bidReachedAt,
			}),
		),
	);

	return bids.map((bid, index) => ({
		id: bid.id,
		rank: ranks[index] ?? 1,
		name: bid.publicName,
		avatar: getPublicAvatarUrl(bid.avatarUrl),
		bid: Math.round((bid.totalBidCents ?? bid.amountCents) / 100),
		bidAgo: bid.paidAt ? formatRelativeJoinedAt(bid.paidAt) : "just now",
		profileUrl: bid.username ? `/${bid.username}` : "/",
	}));
}

export async function estimateSignupRankAction(input: {
	bidAmountCents: number;
	categoryId?: string;
}) {
	if (input.bidAmountCents < MIN_BID_CENTS) {
		return { generalRank: 1, categoryRank: input.categoryId ? 1 : null };
	}

	const [generalRank, categoryRank] = await Promise.all([
		estimateRank({ bidAmountCents: input.bidAmountCents }),
		input.categoryId
			? estimateRank({
					bidAmountCents: input.bidAmountCents,
					categoryId: input.categoryId,
				})
			: Promise.resolve(null),
	]);

	return { generalRank, categoryRank };
}

export async function createPendingAvatarUploadUrlAction() {
	const path = `pending-${crypto.randomUUID()}.png`;
	const signedUploadUrl = await getSignedUploadUrl(path, { bucket: "avatars" });
	return { signedUploadUrl, path };
}

function isValidHttpUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export async function submitCompleteProfileAction(input: {
	email: string;
	publicName: string;
	avatarPath: string;
	description?: string | null;
	countryCode: string;
	categoryId: string;
	bidAmountCents: number;
	estimatedRank?: number | null;
	socialUrls: string[];
}) {
	const email = input.email.trim().toLowerCase();
	const publicName = input.publicName.trim();
	const socialUrls = input.socialUrls.map((url) => url.trim()).filter(Boolean);
	const countryParsed = countryCodeSchema.safeParse(input.countryCode);

	if (!email || !publicName || !input.avatarPath) {
		return { ok: false as const, error: "Avatar, public name, and email are required." };
	}

	if (!countryParsed.success) {
		return { ok: false as const, error: "Country is required." };
	}

	const countryCode = countryParsed.data;

	if (input.bidAmountCents < MIN_BID_CENTS) {
		return { ok: false as const, error: `Minimum bid is $${MIN_BID_CENTS / 100}.` };
	}

	if (socialUrls.length < 1 || socialUrls.length > 10) {
		return { ok: false as const, error: "Provide between 1 and 10 social profiles." };
	}

	if (!socialUrls.every(isValidHttpUrl)) {
		return { ok: false as const, error: "Enter valid social profile URLs." };
	}

	const category = await getCreatorCategoryById(input.categoryId);
	if (!category?.active) {
		return { ok: false as const, error: "Invalid category." };
	}

	const existingUser = await getUserByEmail(email);
	if (existingUser) {
		const existingCreator = await getCreatorProfileByUserId(existingUser.id);
		if (existingCreator) {
			return {
				ok: false as const,
				error: "An account with this email already exists. Sign in to continue.",
			};
		}
	}

	const primaryNormalized = normalizeSocialUrl(socialUrls[0]!);
	if (await isPrimarySocialUrlTaken(primaryNormalized)) {
		return {
			ok: false as const,
			error: "This primary social profile is already claimed.",
		};
	}

	if (!isMockPaymentsEnabled()) {
		return {
			ok: false as const,
			error: "Payments are not configured yet. Enable MOCK_PAYMENTS for local development.",
		};
	}

	try {
		assertMockPaymentsAllowed();
	} catch {
		return { ok: false as const, error: "Mock payments are disabled." };
	}

	const socialProfiles = socialUrls.map((url, index) => ({
		platform: detectSocialPlatform(url) ?? "other",
		url,
		position: index,
	}));

	const pending = await createPendingCreator({
		email,
		publicName,
		avatarUrl: input.avatarPath,
		description: input.description?.trim() || null,
		countryCode,
		categoryId: input.categoryId,
		socialProfiles,
		bidAmountCents: input.bidAmountCents,
		estimatedRank: input.estimatedRank ?? null,
	});

	const paymentReference = `mock_${pending.id}_${crypto.randomUUID().slice(0, 10)}`;

	const result = await finalizeCreatorPayment({
		pendingCreatorId: pending.id,
		paymentReference,
		paymentSource: "MOCK",
		providerPaymentId: paymentReference,
	});

	return {
		ok: true as const,
		username: result.username ?? null,
		email: result.email ?? email,
		creatorId: result.creatorId,
		alreadyFinalized: result.alreadyFinalized,
	};
}
