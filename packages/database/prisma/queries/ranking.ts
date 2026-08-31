import { db } from "../client";
import type { Prisma } from "../generated/client";

const publishedWhere: Prisma.CreatorProfileWhereInput = {
	isPublished: true,
};

/** Estimated rank for a prospective bid (before payment). Same totals already held stay ahead. */
export async function estimateRank(options: {
	bidAmountCents: number;
	categoryId?: string;
	excludeCreatorId?: string;
}) {
	const baseWhere: Prisma.CreatorProfileWhereInput = {
		...publishedWhere,
		...(options.categoryId ? { categoryId: options.categoryId } : {}),
		...(options.excludeCreatorId ? { id: { not: options.excludeCreatorId } } : {}),
	};

	const [ahead, tied] = await Promise.all([
		db.creatorProfile.count({
			where: {
				...baseWhere,
				totalBidCents: { gt: options.bidAmountCents },
			},
		}),
		db.creatorProfile.count({
			where: {
				...baseWhere,
				totalBidCents: options.bidAmountCents,
			},
		}),
	]);

	return ahead + tied + 1;
}

/** Authoritative rank for a published creator. */
export async function getCreatorRank(options: {
	creatorId: string;
	totalBidCents: number;
	bidReachedAt: Date;
	categoryId?: string;
}) {
	const ahead = await db.creatorProfile.count({
		where: {
			...publishedWhere,
			...(options.categoryId ? { categoryId: options.categoryId } : {}),
			id: { not: options.creatorId },
			OR: [
				{ totalBidCents: { gt: options.totalBidCents } },
				{
					AND: [
						{ totalBidCents: options.totalBidCents },
						{ bidReachedAt: { lt: options.bidReachedAt } },
					],
				},
			],
		},
	});

	return ahead + 1;
}

export type LeaderboardRow = {
	id: string;
	userId: string;
	rank: number;
	publicName: string;
	avatarUrl: string;
	description: string | null;
	countryCode: string | null;
	totalBidCents: number;
	joinedAt: Date;
	bidReachedAt: Date;
	categoryId: string;
	categoryName: string;
	categorySlug: string;
	username: string | null;
	platforms: string[];
	socials: Array<{ id: string; platform: string }>;
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
		? await db.creatorCategory.findFirst({
				where: { slug: options.categorySlug, active: true },
			})
		: null;

	if (options.categorySlug && !category) {
		return { items: [], total: 0, page, pageSize };
	}

	const where: Prisma.CreatorProfileWhereInput = {
		...publishedWhere,
		...(category ? { categoryId: category.id } : {}),
	};

	const [total, rows] = await Promise.all([
		db.creatorProfile.count({ where }),
		db.creatorProfile.findMany({
			where,
			orderBy: [{ totalBidCents: "desc" }, { bidReachedAt: "asc" }],
			skip,
			take: pageSize,
			include: {
				category: { select: { id: true, name: true, slug: true } },
				user: { select: { id: true, username: true } },
				socialProfiles: {
					where: { deletedAt: null },
					orderBy: { position: "asc" },
					select: { id: true, platform: true },
				},
			},
		}),
	]);

	const creatorIds = rows.map((row) => row.id);
	const eventCounts =
		creatorIds.length === 0
			? []
			: await db.creatorAnalyticsEvent.groupBy({
					by: ["creatorId", "type"],
					where: {
						creatorId: { in: creatorIds },
						type: { in: ["PROFILE_VIEW", "SOCIAL_CLICK"] },
					},
					_count: { _all: true },
				});

	const viewsByCreator = new Map<string, number>();
	const clicksByCreator = new Map<string, number>();
	for (const row of eventCounts) {
		if (row.type === "PROFILE_VIEW") {
			viewsByCreator.set(row.creatorId, row._count._all);
		} else if (row.type === "SOCIAL_CLICK") {
			clicksByCreator.set(row.creatorId, row._count._all);
		}
	}

	const items: LeaderboardRow[] = rows.map((row, index) => ({
		id: row.id,
		userId: row.userId,
		rank: skip + index + 1,
		publicName: row.publicName,
		avatarUrl: row.avatarUrl,
		description: row.description,
		countryCode: row.countryCode,
		totalBidCents: row.totalBidCents,
		joinedAt: row.joinedAt,
		bidReachedAt: row.bidReachedAt,
		categoryId: row.category.id,
		categoryName: row.category.name,
		categorySlug: row.category.slug,
		username: row.user.username,
		platforms: row.socialProfiles.map((social) => social.platform),
		socials: row.socialProfiles.map((social) => ({
			id: social.id,
			platform: social.platform,
		})),
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
	const leader = await db.creatorProfile.findFirst({
		where: {
			...publishedWhere,
			...(options.categoryId ? { categoryId: options.categoryId } : {}),
			...(options.excludeCreatorId ? { id: { not: options.excludeCreatorId } } : {}),
		},
		orderBy: [{ totalBidCents: "desc" }, { bidReachedAt: "asc" }],
		select: { totalBidCents: true },
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
	const leader = await db.creatorProfile.findFirst({
		where: {
			...publishedWhere,
			...(categoryId ? { categoryId } : {}),
		},
		orderBy: [{ totalBidCents: "desc" }, { bidReachedAt: "asc" }],
		select: { totalBidCents: true },
	});

	return leader?.totalBidCents ?? 0;
}
