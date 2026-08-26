import { db } from "../client";
import type { Prisma } from "../generated/client";

export type AdminDashboardRange = "today" | "7d" | "30d" | "all";

function startOfUtcDay(date: Date) {
	const start = new Date(date);
	start.setUTCHours(0, 0, 0, 0);
	return start;
}

function addUtcDays(date: Date, days: number) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

/** Inclusive-from, exclusive-to style upper bound = now (for open-ended "to"). */
export function getAdminDashboardRangeBounds(range: AdminDashboardRange): {
	from: Date | null;
	to: Date;
} {
	const to = new Date();
	if (range === "all") {
		return { from: null, to };
	}

	const todayStart = startOfUtcDay(to);
	if (range === "today") {
		return { from: todayStart, to };
	}
	if (range === "7d") {
		return { from: addUtcDays(todayStart, -6), to };
	}
	return { from: addUtcDays(todayStart, -29), to };
}

function paidBidWhere(from: Date | null, to: Date): Prisma.CreatorBidWhereInput {
	return {
		status: "PAID",
		...(from
			? {
					paidAt: {
						gte: from,
						lte: to,
					},
				}
			: {}),
	};
}

export async function getAdminDashboardOverview(range: AdminDashboardRange) {
	const { from, to } = getAdminDashboardRangeBounds(range);
	const bidWhere = paidBidWhere(from, to);

	const [totalCreators, bidAggregate, newCreators, profileViews, socialClicks] = await Promise.all([
		db.creatorProfile.count({
			where: { isPublished: true },
		}),
		db.creatorBid.aggregate({
			where: bidWhere,
			_sum: { amountCents: true },
			_count: { _all: true },
			_avg: { amountCents: true },
		}),
		db.creatorProfile.count({
			where: {
				isPublished: true,
				...(from
					? {
							joinedAt: {
								gte: from,
								lte: to,
							},
						}
					: {}),
			},
		}),
		db.creatorAnalyticsEvent.count({
			where: {
				type: "PROFILE_VIEW",
				...(from
					? {
							createdAt: {
								gte: from,
								lte: to,
							},
						}
					: {}),
			},
		}),
		db.creatorAnalyticsEvent.count({
			where: {
				type: "SOCIAL_CLICK",
				...(from
					? {
							createdAt: {
								gte: from,
								lte: to,
							},
						}
					: {}),
			},
		}),
	]);

	const bidTransactions = bidAggregate._count._all;
	const totalBidRevenueCents = bidAggregate._sum.amountCents ?? 0;
	const averageBidCents = bidTransactions > 0 ? Math.round(bidAggregate._avg.amountCents ?? 0) : 0;
	const socialCtrPercent =
		profileViews > 0 ? Math.round((socialClicks / profileViews) * 1000) / 10 : 0;

	return {
		totalCreators,
		totalBidRevenueCents,
		bidTransactions,
		averageBidCents,
		newCreators,
		profileViews,
		socialClicks,
		socialCtrPercent,
	};
}

export async function listAdminBidRevenueSeries(range: AdminDashboardRange) {
	const { from, to } = getAdminDashboardRangeBounds(range);
	const bids = await db.creatorBid.findMany({
		where: paidBidWhere(from, to),
		select: {
			amountCents: true,
			paidAt: true,
			createdAt: true,
		},
		orderBy: { paidAt: "asc" },
	});

	const buckets = new Map<string, { date: string; revenueCents: number; transactions: number }>();

	const ensureBucket = (key: string) => {
		const existing = buckets.get(key);
		if (existing) {
			return existing;
		}
		const created = { date: key, revenueCents: 0, transactions: 0 };
		buckets.set(key, created);
		return created;
	};

	// Pre-seed empty days for bounded ranges so the chart has a continuous axis.
	if (from) {
		let cursor = startOfUtcDay(from);
		const end = startOfUtcDay(to);
		while (cursor.getTime() <= end.getTime()) {
			ensureBucket(cursor.toISOString().slice(0, 10));
			cursor = addUtcDays(cursor, 1);
		}
	}

	for (const bid of bids) {
		const at = bid.paidAt ?? bid.createdAt;
		const key = startOfUtcDay(at).toISOString().slice(0, 10);
		const bucket = ensureBucket(key);
		bucket.revenueCents += bid.amountCents;
		bucket.transactions += 1;
	}

	return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function listAdminLatestPaidBids(limit = 10) {
	const bids = await db.creatorBid.findMany({
		where: { status: "PAID" },
		orderBy: { paidAt: "desc" },
		take: limit,
		include: {
			creator: {
				select: {
					id: true,
					publicName: true,
					avatarUrl: true,
					category: { select: { name: true, slug: true } },
					user: { select: { username: true } },
				},
			},
		},
	});

	return bids.map((bid) => ({
		id: bid.id,
		type: bid.type,
		status: bid.status,
		amountCents: bid.amountCents,
		totalAfterCents: bid.totalAfterCents,
		paidAt: bid.paidAt,
		creatorId: bid.creator.id,
		publicName: bid.creator.publicName,
		avatarUrl: bid.creator.avatarUrl,
		username: bid.creator.user.username,
		categoryName: bid.creator.category.name,
		categorySlug: bid.creator.category.slug,
	}));
}

export async function listAdminCategoryPerformance(range: AdminDashboardRange) {
	const { from, to } = getAdminDashboardRangeBounds(range);
	const categories = await db.creatorCategory.findMany({
		where: { active: true },
		orderBy: [{ order: "asc" }, { name: "asc" }],
		select: {
			id: true,
			name: true,
			slug: true,
			icon: true,
			color: true,
		},
	});

	if (categories.length === 0) {
		return [];
	}

	const categoryIds = categories.map((category) => category.id);

	const [publishedCounts, paidBids] = await Promise.all([
		db.creatorProfile.groupBy({
			by: ["categoryId"],
			where: {
				isPublished: true,
				categoryId: { in: categoryIds },
			},
			_count: { _all: true },
		}),
		db.creatorBid.findMany({
			where: {
				...paidBidWhere(from, to),
				creator: {
					categoryId: { in: categoryIds },
				},
			},
			select: {
				amountCents: true,
				creator: { select: { categoryId: true } },
			},
		}),
	]);

	const publishedByCategory = new Map(
		publishedCounts.map((row) => [row.categoryId, row._count._all] as const),
	);

	const revenueByCategory = new Map<string, { revenueCents: number; transactions: number }>();
	for (const bid of paidBids) {
		const categoryId = bid.creator.categoryId;
		const current = revenueByCategory.get(categoryId) ?? {
			revenueCents: 0,
			transactions: 0,
		};
		current.revenueCents += bid.amountCents;
		current.transactions += 1;
		revenueByCategory.set(categoryId, current);
	}

	return categories.map((category) => {
		const revenue = revenueByCategory.get(category.id) ?? {
			revenueCents: 0,
			transactions: 0,
		};
		return {
			id: category.id,
			name: category.name,
			slug: category.slug,
			icon: category.icon,
			color: category.color,
			publishedCreators: publishedByCategory.get(category.id) ?? 0,
			totalPaidRevenueCents: revenue.revenueCents,
			averageBidCents:
				revenue.transactions > 0 ? Math.round(revenue.revenueCents / revenue.transactions) : 0,
		};
	});
}

export async function getAdminDashboardSnapshot(range: AdminDashboardRange) {
	const [overview, revenueSeries, latestBids, categoryPerformance, topCreators] = await Promise.all(
		[
			getAdminDashboardOverview(range),
			listAdminBidRevenueSeries(range),
			listAdminLatestPaidBids(10),
			listAdminCategoryPerformance(range),
			db.creatorProfile.findMany({
				where: { isPublished: true },
				orderBy: [{ totalBidCents: "desc" }, { bidReachedAt: "asc" }],
				take: 10,
				select: {
					id: true,
					publicName: true,
					avatarUrl: true,
					totalBidCents: true,
					category: { select: { name: true, slug: true } },
					user: { select: { username: true } },
				},
			}),
		],
	);

	return {
		range,
		overview,
		revenueSeries,
		latestBids,
		categoryPerformance,
		topCreators: topCreators.map((creator, index) => ({
			id: creator.id,
			rank: index + 1,
			publicName: creator.publicName,
			avatarUrl: creator.avatarUrl,
			totalBidCents: creator.totalBidCents,
			categoryName: creator.category.name,
			categorySlug: creator.category.slug,
			username: creator.user.username,
		})),
	};
}
