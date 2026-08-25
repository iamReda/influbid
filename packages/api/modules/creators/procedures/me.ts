import {
	countAnalyticsEvents,
	countSocialClicksByPlatform,
	getAmountToReachRankOne,
	getCreatorProfileByUserId,
	getCreatorRank,
	listAnalyticsTimelineEvents,
	listPaidCreatorBids,
	markCreatorAccountClaimed,
	MIN_BID_CENTS,
} from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

function startOfUtcDay(date: Date) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function periodRange(period: "week" | "month" | "all", joinedAt?: Date | null) {
	const now = new Date();
	if (period === "week") {
		const to = startOfUtcDay(now);
		return { from: addUtcDays(to, -6), to: addUtcDays(to, 1) };
	}
	if (period === "month") {
		const to = startOfUtcDay(now);
		return { from: addUtcDays(to, -29), to: addUtcDays(to, 1) };
	}
	const to = addUtcDays(startOfUtcDay(now), 1);
	const joined = joinedAt ? startOfUtcDay(joinedAt) : addUtcDays(startOfUtcDay(now), -83);
	const minFrom = addUtcDays(startOfUtcDay(now), -83);
	return { from: joined.getTime() < minFrom.getTime() ? minFrom : joined, to };
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function dayLabel(date: Date, period: "week" | "month" | "all") {
	if (period === "week") {
		return WEEKDAY_LABELS[date.getUTCDay()]!;
	}
	return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function buildAnalyticsChart(options: {
	period: "week" | "month" | "all";
	from: Date;
	to: Date;
	events: Array<{ type: string; createdAt: Date }>;
}) {
	const { period, from, to, events } = options;
	const dayMs = 24 * 60 * 60 * 1000;
	const totalDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / dayMs));

	// Week: 7 daily buckets. Month: 30 daily. All: weekly buckets across the window.
	const useWeeklyBuckets = period === "all" && totalDays > 21;
	const bucketCount = useWeeklyBuckets ? Math.ceil(totalDays / 7) : totalDays;
	const bucketSizeDays = useWeeklyBuckets ? 7 : 1;

	const buckets = Array.from({ length: bucketCount }, (_, index) => {
		const start = addUtcDays(from, index * bucketSizeDays);
		const end = addUtcDays(start, bucketSizeDays);
		const label = useWeeklyBuckets
			? `W${index + 1}`
			: dayLabel(start, period === "all" ? "month" : period);
		return { start, end, label, views: 0, clicks: 0 };
	});

	for (const event of events) {
		const at = event.createdAt.getTime();
		if (at < from.getTime() || at >= to.getTime()) {
			continue;
		}
		const offsetDays = Math.floor((at - from.getTime()) / dayMs);
		const index = Math.min(
			bucketCount - 1,
			Math.max(0, useWeeklyBuckets ? Math.floor(offsetDays / 7) : offsetDays),
		);
		const bucket = buckets[index];
		if (!bucket) {
			continue;
		}
		if (event.type === "PROFILE_VIEW") {
			bucket.views += 1;
		} else if (event.type === "SOCIAL_CLICK") {
			bucket.clicks += 1;
		}
	}

	return buckets.map(({ label, views, clicks }) => ({ label, views, clicks }));
}

const PLATFORM_META: Record<string, { name: string; color: string }> = {
	instagram: { name: "Instagram", color: "#E4405F" },
	tiktok: { name: "TikTok", color: "#111111" },
	facebook: { name: "Facebook", color: "#1877F2" },
	twitch: { name: "Twitch", color: "#9146FF" },
	youtube: { name: "YouTube", color: "#FF0000" },
	x: { name: "X", color: "#111111" },
};

export const getMyCreator = protectedProcedure
	.route({
		method: "GET",
		path: "/creators/me",
		tags: ["Creators"],
		summary: "Get the authenticated creator profile and ranks",
	})
	.output(
		z
			.object({
				id: z.string(),
				publicName: z.string(),
				avatarUrl: z.string(),
				description: z.string().nullable(),
				totalBidCents: z.number().int(),
				currency: z.string(),
				joinedAt: z.date(),
				categoryId: z.string(),
				categoryName: z.string(),
				categorySlug: z.string(),
				username: z.string().nullable(),
				generalRank: z.number().int(),
				categoryRank: z.number().int(),
				amountToGeneralOneCents: z.number().int(),
				amountToCategoryOneCents: z.number().int(),
				minIncreaseCents: z.number().int(),
			})
			.nullable(),
	)
	.handler(async ({ context: { user } }) => {
		const creator = await getCreatorProfileByUserId(user.id);
		if (!creator || !creator.isPublished) {
			return null;
		}

		const [generalRank, categoryRank, amountToGeneralOneCents, amountToCategoryOneCents] =
			await Promise.all([
				getCreatorRank({
					creatorId: creator.id,
					totalBidCents: creator.totalBidCents,
					bidReachedAt: creator.bidReachedAt,
				}),
				getCreatorRank({
					creatorId: creator.id,
					totalBidCents: creator.totalBidCents,
					bidReachedAt: creator.bidReachedAt,
					categoryId: creator.categoryId,
				}),
				getAmountToReachRankOne({
					currentTotalBidCents: creator.totalBidCents,
					excludeCreatorId: creator.id,
				}),
				getAmountToReachRankOne({
					currentTotalBidCents: creator.totalBidCents,
					categoryId: creator.categoryId,
					excludeCreatorId: creator.id,
				}),
			]);

		return {
			id: creator.id,
			publicName: creator.publicName,
			avatarUrl: creator.avatarUrl,
			description: creator.description,
			totalBidCents: creator.totalBidCents,
			currency: creator.currency,
			joinedAt: creator.joinedAt,
			categoryId: creator.categoryId,
			categoryName: creator.category.name,
			categorySlug: creator.category.slug,
			username: creator.user.username,
			generalRank,
			categoryRank,
			amountToGeneralOneCents: Math.max(amountToGeneralOneCents, 0),
			amountToCategoryOneCents: Math.max(amountToCategoryOneCents, 0),
			minIncreaseCents: MIN_BID_CENTS,
		};
	});

export const getMyAnalytics = protectedProcedure
	.route({
		method: "GET",
		path: "/creators/me/analytics",
		tags: ["Creators"],
		summary: "Get creator analytics for a date period",
	})
	.input(
		z.object({
			period: z.enum(["week", "month", "all"]).default("all"),
		}),
	)
	.output(
		z.object({
			views: z.number().int(),
			clicks: z.number().int(),
			ctrPercent: z.number(),
			socials: z.array(
				z.object({
					platform: z.string(),
					name: z.string(),
					clicks: z.number().int(),
					percent: z.number().int(),
					color: z.string(),
				}),
			),
			chart: z.array(
				z.object({
					label: z.string(),
					views: z.number().int(),
					clicks: z.number().int(),
				}),
			),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const creator = await getCreatorProfileByUserId(user.id);
		if (!creator) {
			return { views: 0, clicks: 0, ctrPercent: 0, socials: [], chart: [] };
		}

		const { from, to } = periodRange(input.period, creator.joinedAt);
		const [views, clicks, byPlatform, timeline] = await Promise.all([
			countAnalyticsEvents({
				creatorId: creator.id,
				type: "PROFILE_VIEW",
				from,
				to,
			}),
			countAnalyticsEvents({
				creatorId: creator.id,
				type: "SOCIAL_CLICK",
				from,
				to,
			}),
			countSocialClicksByPlatform({
				creatorId: creator.id,
				from,
				to,
			}),
			listAnalyticsTimelineEvents({
				creatorId: creator.id,
				from,
				to,
			}),
		]);

		const socials = byPlatform
			.map((row) => {
				const meta = PLATFORM_META[row.platform] ?? {
					name: row.platform,
					color: "#64748b",
				};
				return {
					platform: row.platform,
					name: meta.name,
					clicks: row.clicks,
					percent: clicks > 0 ? Math.round((row.clicks / clicks) * 100) : 0,
					color: meta.color,
				};
			})
			.sort((a, b) => b.clicks - a.clicks);

		const chart = buildAnalyticsChart({
			period: input.period,
			from,
			to,
			events: timeline,
		});

		return {
			views,
			clicks,
			ctrPercent: views > 0 ? Math.round((clicks / views) * 100) : 0,
			socials,
			chart,
		};
	});

export const listMyBids = protectedProcedure
	.route({
		method: "GET",
		path: "/creators/me/bids",
		tags: ["Creators"],
		summary: "List paid bid history for the authenticated creator",
	})
	.output(
		z.array(
			z.object({
				id: z.string(),
				type: z.enum(["INITIAL", "INCREASE"]),
				amountCents: z.number().int(),
				paidAt: z.date().nullable(),
			}),
		),
	)
	.handler(async ({ context: { user } }) => {
		const creator = await getCreatorProfileByUserId(user.id);
		if (!creator) {
			return [];
		}

		const bids = await listPaidCreatorBids(creator.id);
		return bids.map((bid) => ({
			id: bid.id,
			type: bid.type,
			amountCents: bid.amountCents,
			paidAt: bid.paidAt,
		}));
	});

export const markAccountClaimed = protectedProcedure
	.route({
		method: "POST",
		path: "/creators/me/claim",
		tags: ["Creators"],
		summary: "Mark creator account as claimed on first access",
	})
	.output(z.object({ claimed: z.boolean() }))
	.handler(async ({ context: { user } }) => {
		const creator = await getCreatorProfileByUserId(user.id);
		if (!creator) {
			return { claimed: false };
		}
		if (creator.accountClaimedAt) {
			return { claimed: true };
		}
		await markCreatorAccountClaimed(creator.id);
		return { claimed: true };
	});
