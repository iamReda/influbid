import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "../client";
import {
	creatorAnalyticsEvent,
	creatorBid,
	creatorCategory,
	creatorProfile,
	user,
} from "../schema/postgres";

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

function toInt(value: number | string | null | undefined) {
	if (value == null) {
		return 0;
	}
	return typeof value === "number" ? value : Number(value);
}

export async function getAdminDashboardSnapshot(range: AdminDashboardRange) {
	const { from, to } = getAdminDashboardRangeBounds(range);

	const paidAtFilter =
		from != null ? and(gte(creatorBid.paidAt, from), lte(creatorBid.paidAt, to)) : undefined;
	const joinedAtFilter =
		from != null
			? and(gte(creatorProfile.joinedAt, from), lte(creatorProfile.joinedAt, to))
			: undefined;
	const analyticsFilter =
		from != null
			? and(gte(creatorAnalyticsEvent.createdAt, from), lte(creatorAnalyticsEvent.createdAt, to))
			: undefined;

	const [
		totalCreatorsRow,
		bidStats,
		newCreatorsRow,
		profileViewsRow,
		socialClicksRow,
		seriesBids,
		latestBids,
		categories,
		topCreators,
		publishedCounts,
	] = await Promise.all([
		db.select({ value: count() }).from(creatorProfile).where(eq(creatorProfile.isPublished, true)),
		db
			.select({
				revenueCents: sql<number>`coalesce(sum(${creatorBid.amountCents}), 0)`,
				transactions: sql<number>`count(*)`,
				averageCents: sql<number>`coalesce(avg(${creatorBid.amountCents}), 0)`,
			})
			.from(creatorBid)
			.where(and(eq(creatorBid.status, "PAID"), paidAtFilter)),
		db
			.select({ value: count() })
			.from(creatorProfile)
			.where(and(eq(creatorProfile.isPublished, true), joinedAtFilter)),
		db
			.select({ value: count() })
			.from(creatorAnalyticsEvent)
			.where(and(eq(creatorAnalyticsEvent.type, "PROFILE_VIEW"), analyticsFilter)),
		db
			.select({ value: count() })
			.from(creatorAnalyticsEvent)
			.where(and(eq(creatorAnalyticsEvent.type, "SOCIAL_CLICK"), analyticsFilter)),
		db
			.select({
				amountCents: creatorBid.amountCents,
				paidAt: creatorBid.paidAt,
				createdAt: creatorBid.createdAt,
				categoryId: creatorProfile.categoryId,
			})
			.from(creatorBid)
			.innerJoin(creatorProfile, eq(creatorBid.creatorId, creatorProfile.id))
			.where(and(eq(creatorBid.status, "PAID"), paidAtFilter)),
		db
			.select({
				id: creatorBid.id,
				type: creatorBid.type,
				status: creatorBid.status,
				amountCents: creatorBid.amountCents,
				totalAfterCents: creatorBid.totalAfterCents,
				paidAt: creatorBid.paidAt,
				creatorId: creatorProfile.id,
				publicName: creatorProfile.publicName,
				avatarUrl: creatorProfile.avatarUrl,
				username: user.username,
				categoryName: creatorCategory.name,
				categorySlug: creatorCategory.slug,
			})
			.from(creatorBid)
			.innerJoin(creatorProfile, eq(creatorBid.creatorId, creatorProfile.id))
			.innerJoin(user, eq(creatorProfile.userId, user.id))
			.innerJoin(creatorCategory, eq(creatorProfile.categoryId, creatorCategory.id))
			.where(eq(creatorBid.status, "PAID"))
			.orderBy(desc(creatorBid.paidAt))
			.limit(10),
		db
			.select({
				id: creatorCategory.id,
				name: creatorCategory.name,
				slug: creatorCategory.slug,
				icon: creatorCategory.icon,
				color: creatorCategory.color,
			})
			.from(creatorCategory)
			.where(eq(creatorCategory.active, true))
			.orderBy(asc(creatorCategory.order), asc(creatorCategory.name)),
		db
			.select({
				id: creatorProfile.id,
				publicName: creatorProfile.publicName,
				avatarUrl: creatorProfile.avatarUrl,
				totalBidCents: creatorProfile.totalBidCents,
				categoryName: creatorCategory.name,
				categorySlug: creatorCategory.slug,
				username: user.username,
			})
			.from(creatorProfile)
			.innerJoin(creatorCategory, eq(creatorProfile.categoryId, creatorCategory.id))
			.innerJoin(user, eq(creatorProfile.userId, user.id))
			.where(eq(creatorProfile.isPublished, true))
			.orderBy(desc(creatorProfile.totalBidCents), asc(creatorProfile.bidReachedAt))
			.limit(10),
		db
			.select({
				categoryId: creatorProfile.categoryId,
				value: count(),
			})
			.from(creatorProfile)
			.where(eq(creatorProfile.isPublished, true))
			.groupBy(creatorProfile.categoryId),
	]);

	const bidTransactions = toInt(bidStats[0]?.transactions);
	const totalBidRevenueCents = toInt(bidStats[0]?.revenueCents);
	const averageBidCents = bidTransactions > 0 ? Math.round(toInt(bidStats[0]?.averageCents)) : 0;
	const profileViews = toInt(profileViewsRow[0]?.value);
	const socialClicks = toInt(socialClicksRow[0]?.value);

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

	if (from) {
		let cursor = startOfUtcDay(from);
		const end = startOfUtcDay(to);
		while (cursor.getTime() <= end.getTime()) {
			ensureBucket(cursor.toISOString().slice(0, 10));
			cursor = addUtcDays(cursor, 1);
		}
	}

	const revenueByCategory = new Map<string, { revenueCents: number; transactions: number }>();
	for (const bid of seriesBids) {
		const at = bid.paidAt ?? bid.createdAt;
		const key = startOfUtcDay(at).toISOString().slice(0, 10);
		const bucket = ensureBucket(key);
		bucket.revenueCents += bid.amountCents;
		bucket.transactions += 1;

		const current = revenueByCategory.get(bid.categoryId) ?? {
			revenueCents: 0,
			transactions: 0,
		};
		current.revenueCents += bid.amountCents;
		current.transactions += 1;
		revenueByCategory.set(bid.categoryId, current);
	}

	const publishedByCategory = new Map(
		publishedCounts.map((row) => [row.categoryId, row.value] as const),
	);

	return {
		range,
		overview: {
			totalCreators: toInt(totalCreatorsRow[0]?.value),
			totalBidRevenueCents,
			bidTransactions,
			averageBidCents,
			newCreators: toInt(newCreatorsRow[0]?.value),
			profileViews,
			socialClicks,
			socialCtrPercent:
				profileViews > 0 ? Math.round((socialClicks / profileViews) * 1000) / 10 : 0,
		},
		revenueSeries: [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date)),
		latestBids: latestBids.map((bid) => ({
			id: bid.id,
			type: bid.type,
			status: bid.status,
			amountCents: bid.amountCents,
			totalAfterCents: bid.totalAfterCents,
			paidAt: bid.paidAt,
			creatorId: bid.creatorId,
			publicName: bid.publicName,
			avatarUrl: bid.avatarUrl,
			username: bid.username,
			categoryName: bid.categoryName,
			categorySlug: bid.categorySlug,
		})),
		categoryPerformance: categories.map((category) => {
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
		}),
		topCreators: topCreators.map((creator, index) => ({
			id: creator.id,
			rank: index + 1,
			publicName: creator.publicName,
			avatarUrl: creator.avatarUrl,
			totalBidCents: creator.totalBidCents,
			categoryName: creator.categoryName,
			categorySlug: creator.categorySlug,
			username: creator.username,
		})),
	};
}
