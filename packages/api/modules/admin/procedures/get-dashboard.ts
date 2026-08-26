import { getAdminDashboardSnapshot } from "@repo/database";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

const rangeSchema = z.enum(["today", "7d", "30d", "all"]);

export const getDashboard = adminProcedure
	.route({
		method: "GET",
		path: "/admin/dashboard",
		tags: ["Administration"],
		summary: "Get admin dashboard snapshot",
	})
	.input(
		z.object({
			range: rangeSchema.default("30d"),
		}),
	)
	.output(
		z.object({
			range: rangeSchema,
			overview: z.object({
				totalCreators: z.number().int().nonnegative(),
				totalBidRevenueCents: z.number().int().nonnegative(),
				bidTransactions: z.number().int().nonnegative(),
				averageBidCents: z.number().int().nonnegative(),
				newCreators: z.number().int().nonnegative(),
				profileViews: z.number().int().nonnegative(),
				socialClicks: z.number().int().nonnegative(),
				socialCtrPercent: z.number().nonnegative(),
			}),
			revenueSeries: z.array(
				z.object({
					date: z.string(),
					revenueCents: z.number().int().nonnegative(),
					transactions: z.number().int().nonnegative(),
				}),
			),
			latestBids: z.array(
				z.object({
					id: z.string(),
					type: z.enum(["INITIAL", "INCREASE"]),
					status: z.enum(["PENDING", "PAID", "FAILED"]),
					amountCents: z.number().int(),
					totalAfterCents: z.number().int().nullish(),
					paidAt: z.coerce.date().nullish(),
					creatorId: z.string(),
					publicName: z.string(),
					avatarUrl: z.string(),
					username: z.string().nullish(),
					categoryName: z.string(),
					categorySlug: z.string(),
				}),
			),
			categoryPerformance: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					slug: z.string(),
					icon: z.string().nullish(),
					color: z.string().nullish(),
					publishedCreators: z.number().int().nonnegative(),
					totalPaidRevenueCents: z.number().int().nonnegative(),
					averageBidCents: z.number().int().nonnegative(),
				}),
			),
			topCreators: z.array(
				z.object({
					id: z.string(),
					rank: z.number().int().positive(),
					publicName: z.string(),
					avatarUrl: z.string(),
					totalBidCents: z.number().int().nonnegative(),
					categoryName: z.string(),
					categorySlug: z.string(),
					username: z.string().nullish(),
				}),
			),
		}),
	)
	.handler(async ({ input }) => {
		return getAdminDashboardSnapshot(input.range);
	});
