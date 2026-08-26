import { and, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";

import { db } from "../client";
import { creatorAnalyticsEvent, creatorProfile } from "../schema/postgres";

const published = eq(creatorProfile.isPublished, true);

/** Estimated rank for a prospective bid (before payment). Same totals already held stay ahead. */
export async function estimateRank(options: {
	bidAmountCents: number;
	categoryId?: string;
	excludeCreatorId?: string;
}) {
	const baseConditions = [
		published,
		...(options.categoryId ? [eq(creatorProfile.categoryId, options.categoryId)] : []),
		...(options.excludeCreatorId ? [ne(creatorProfile.id, options.excludeCreatorId)] : []),
	];

	const [[aheadRow], [tiedRow]] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(creatorProfile)
			.where(and(...baseConditions, gt(creatorProfile.totalBidCents, options.bidAmountCents))),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(creatorProfile)
			.where(and(...baseConditions, eq(creatorProfile.totalBidCents, options.bidAmountCents))),
	]);

	return (aheadRow?.count ?? 0) + (tiedRow?.count ?? 0) + 1;
}

/** Authoritative rank for a published creator. */
export async function getCreatorRank(options: {
	creatorId: string;
	totalBidCents: number;
	bidReachedAt: Date;
	categoryId?: string;
}) {
	const [aheadRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(creatorProfile)
		.where(
			and(
				published,
				...(options.categoryId ? [eq(creatorProfile.categoryId, options.categoryId)] : []),
				ne(creatorProfile.id, options.creatorId),
				or(
					gt(creatorProfile.totalBidCents, options.totalBidCents),
					and(
						eq(creatorProfile.totalBidCents, options.totalBidCents),
						lt(creatorProfile.bidReachedAt, options.bidReachedAt),
					),
				),
			),
		);

	return (aheadRow?.count ?? 0) + 1;
}

export type LeaderboardRow = {
	id: string;
	userId: string;
	rank: number;
	publicName: string;
	avatarUrl: string;
	description: string | null;
	totalBidCents: number;
	joinedAt: Date;
	bidReachedAt: Date;
	categoryId: string;
	categoryName: string;
	categorySlug: string;
	username: string | null;
	platforms: string[];
	profileViewCount: number;
	socialClickCount: number;
};

export async function listLeaderboard(options: {
	categorySlug?: string;
	page?: number;
	pageSize?: number;
}): Promise<{ items: LeaderboardRow[]; total: number; page: number; pageSize: number }> {
	const page = Math.max(1, options.page ?? 1);
	const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
	const skip = (page - 1) * pageSize;

	const category = options.categorySlug
		? await db.query.creatorCategory.findFirst({
				where: (cat, { and, eq }) => and(eq(cat.slug, options.categorySlug!), eq(cat.active, true)),
			})
		: null;

	if (options.categorySlug && !category) {
		return { items: [], total: 0, page, pageSize };
	}

	const whereConditions = [
		published,
		...(category ? [eq(creatorProfile.categoryId, category.id)] : []),
	];

	const [[totalRow], rows] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(creatorProfile)
			.where(and(...whereConditions)),
		db.query.creatorProfile.findMany({
			where: (profile, { and, eq }) =>
				and(
					eq(profile.isPublished, true),
					...(category ? [eq(profile.categoryId, category.id)] : []),
				),
			orderBy: (profile, { asc, desc }) => [desc(profile.totalBidCents), asc(profile.bidReachedAt)],
			offset: skip,
			limit: pageSize,
			with: {
				category: {
					columns: { id: true, name: true, slug: true },
				},
				user: {
					columns: { id: true, username: true },
				},
				socialProfiles: {
					where: (social, { isNull }) => isNull(social.deletedAt),
					orderBy: (social, { asc }) => [asc(social.position)],
					columns: { platform: true },
				},
			},
		}),
	]);

	const total = totalRow?.count ?? 0;
	const creatorIds = rows.map((row) => row.id);
	const eventCounts =
		creatorIds.length === 0
			? []
			: await db
					.select({
						creatorId: creatorAnalyticsEvent.creatorId,
						type: creatorAnalyticsEvent.type,
						count: sql<number>`count(*)::int`,
					})
					.from(creatorAnalyticsEvent)
					.where(
						and(
							inArray(creatorAnalyticsEvent.creatorId, creatorIds),
							inArray(creatorAnalyticsEvent.type, ["PROFILE_VIEW", "SOCIAL_CLICK"]),
						),
					)
					.groupBy(creatorAnalyticsEvent.creatorId, creatorAnalyticsEvent.type);

	const viewsByCreator = new Map<string, number>();
	const clicksByCreator = new Map<string, number>();
	for (const row of eventCounts) {
		if (row.type === "PROFILE_VIEW") {
			viewsByCreator.set(row.creatorId, row.count);
		} else if (row.type === "SOCIAL_CLICK") {
			clicksByCreator.set(row.creatorId, row.count);
		}
	}

	const items: LeaderboardRow[] = rows.map((row, index) => ({
		id: row.id,
		userId: row.userId,
		rank: skip + index + 1,
		publicName: row.publicName,
		avatarUrl: row.avatarUrl,
		description: row.description,
		totalBidCents: row.totalBidCents,
		joinedAt: row.joinedAt,
		bidReachedAt: row.bidReachedAt,
		categoryId: row.category.id,
		categoryName: row.category.name,
		categorySlug: row.category.slug,
		username: row.user.username,
		platforms: row.socialProfiles.map((social) => social.platform),
		profileViewCount: viewsByCreator.get(row.id) ?? 0,
		socialClickCount: clicksByCreator.get(row.id) ?? 0,
	}));

	return { items, total, page, pageSize };
}

/** Amount (cents) a creator must add to reach #1 general or category. */
export async function getAmountToReachRankOne(options: {
	currentTotalBidCents: number;
	categoryId?: string;
	excludeCreatorId?: string;
}) {
	const leader = await db.query.creatorProfile.findFirst({
		where: (profile, { and, eq, ne }) =>
			and(
				eq(profile.isPublished, true),
				...(options.categoryId ? [eq(profile.categoryId, options.categoryId)] : []),
				...(options.excludeCreatorId ? [ne(profile.id, options.excludeCreatorId)] : []),
			),
		orderBy: (profile, { asc, desc }) => [desc(profile.totalBidCents), asc(profile.bidReachedAt)],
		columns: { totalBidCents: true },
	});

	if (!leader) {
		return 0;
	}

	if (options.currentTotalBidCents > leader.totalBidCents) {
		return 0;
	}

	// Must strictly exceed the current #1 total.
	return leader.totalBidCents - options.currentTotalBidCents + 1;
}

/** Highest published bid total in cents (0 when the board is empty). */
export async function getLeadingTotalBidCents(categoryId?: string) {
	const leader = await db.query.creatorProfile.findFirst({
		where: (profile, { and, eq }) =>
			and(
				eq(profile.isPublished, true),
				...(categoryId ? [eq(profile.categoryId, categoryId)] : []),
			),
		orderBy: (profile, { asc, desc }) => [desc(profile.totalBidCents), asc(profile.bidReachedAt)],
		columns: { totalBidCents: true },
	});

	return leader?.totalBidCents ?? 0;
}
