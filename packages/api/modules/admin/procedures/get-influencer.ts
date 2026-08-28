import { ORPCError } from "@orpc/server";
import {
	countAnalyticsEvents,
	countSocialClicksByPlatform,
	getAdminInfluencerByUserId,
	getCreatorRank,
	listAnalyticsTimelineEvents,
	listCreatorBidsByCreatorId,
	parseCreatorLanguages,
} from "@repo/database";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";
import {
	buildAnalyticsChart,
	periodRange,
	PLATFORM_META,
} from "../../creators/lib/analytics-period";

export const getInfluencer = adminProcedure
	.route({
		method: "GET",
		path: "/admin/users/{userId}/influencer",
		tags: ["Administration"],
		summary: "Get influencer profile, stats, and payment history",
	})
	.input(
		z.object({
			userId: z.string().min(1),
			period: z.enum(["week", "month", "all"]).default("all"),
		}),
	)
	.output(
		z.object({
			user: z.object({
				id: z.string(),
				name: z.string(),
				email: z.string(),
				emailVerified: z.boolean(),
				image: z.string().nullish(),
				username: z.string().nullish(),
				businessEmail: z.string().nullish(),
				banned: z.boolean().nullish(),
				banReason: z.string().nullish(),
				banExpires: z.coerce.date().nullish(),
				createdAt: z.coerce.date(),
			}),
			profile: z.object({
				id: z.string(),
				publicName: z.string(),
				avatarUrl: z.string(),
				description: z.string().nullish(),
				totalBidCents: z.number().int(),
				currency: z.string(),
				joinedAt: z.coerce.date(),
				isPublished: z.boolean(),
				accountClaimedAt: z.coerce.date().nullish(),
				countryCode: z.string().nullish(),
				gender: z.enum(["MAN", "WOMAN", "PREFER_NOT_TO_SAY"]).nullish(),
				languages: z.array(z.string()).nullish(),
				category: z.object({
					id: z.string(),
					name: z.string(),
					slug: z.string(),
					color: z.string().nullish(),
				}),
				socialProfiles: z.array(
					z.object({
						id: z.string(),
						platform: z.string(),
						url: z.string(),
						position: z.number().int(),
					}),
				),
				generalRank: z.number().int(),
				categoryRank: z.number().int(),
			}),
			analytics: z.object({
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
			payments: z.array(
				z.object({
					id: z.string(),
					type: z.enum(["INITIAL", "INCREASE"]),
					status: z.enum(["PENDING", "PAID", "FAILED"]),
					amountCents: z.number().int(),
					currency: z.string(),
					totalAfterCents: z.number().int().nullish(),
					paymentSource: z.enum(["MOCK", "STRIPE"]),
					providerPaymentId: z.string().nullish(),
					createdAt: z.coerce.date(),
					paidAt: z.coerce.date().nullish(),
				}),
			),
		}),
	)
	.handler(async ({ input }) => {
		const influencer = await getAdminInfluencerByUserId(input.userId);
		if (!influencer?.creatorProfile) {
			throw new ORPCError("NOT_FOUND", { message: "Influencer not found" });
		}

		const profile = influencer.creatorProfile;
		const { from, to } = periodRange(input.period, profile.joinedAt);

		const [generalRank, categoryRank, views, clicks, byPlatform, timeline, bids] =
			await Promise.all([
				getCreatorRank({
					creatorId: profile.id,
					totalBidCents: profile.totalBidCents,
					bidReachedAt: profile.bidReachedAt,
				}),
				getCreatorRank({
					creatorId: profile.id,
					totalBidCents: profile.totalBidCents,
					bidReachedAt: profile.bidReachedAt,
					categoryId: profile.category.id,
				}),
				countAnalyticsEvents({
					creatorId: profile.id,
					type: "PROFILE_VIEW",
					from,
					to,
				}),
				countAnalyticsEvents({
					creatorId: profile.id,
					type: "SOCIAL_CLICK",
					from,
					to,
				}),
				countSocialClicksByPlatform({
					creatorId: profile.id,
					from,
					to,
				}),
				listAnalyticsTimelineEvents({
					creatorId: profile.id,
					from,
					to,
				}),
				listCreatorBidsByCreatorId(profile.id),
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

		return {
			user: {
				id: influencer.id,
				name: influencer.name,
				email: influencer.email,
				emailVerified: influencer.emailVerified,
				image: influencer.image,
				username: influencer.username,
				businessEmail: influencer.businessEmail,
				banned: influencer.banned,
				banReason: influencer.banReason,
				banExpires: influencer.banExpires,
				createdAt: influencer.createdAt,
			},
			profile: {
				id: profile.id,
				publicName: profile.publicName,
				avatarUrl: profile.avatarUrl,
				description: profile.description,
				totalBidCents: profile.totalBidCents,
				currency: profile.currency,
				joinedAt: profile.joinedAt,
				isPublished: profile.isPublished,
				accountClaimedAt: profile.accountClaimedAt,
				countryCode: profile.countryCode,
				gender: profile.gender,
				languages: parseCreatorLanguages(profile.languages),
				category: profile.category,
				socialProfiles: profile.socialProfiles,
				generalRank,
				categoryRank,
			},
			analytics: {
				views,
				clicks,
				ctrPercent: views > 0 ? Math.round((clicks / views) * 100) : 0,
				socials,
				chart: buildAnalyticsChart({
					period: input.period,
					from,
					to,
					events: timeline,
				}),
			},
			payments: bids.map((bid) => ({
				id: bid.id,
				type: bid.type,
				status: bid.status,
				amountCents: bid.amountCents,
				currency: bid.currency,
				totalAfterCents: bid.totalAfterCents,
				paymentSource: bid.paymentSource,
				providerPaymentId: bid.providerPaymentId,
				createdAt: bid.createdAt,
				paidAt: bid.paidAt,
			})),
		};
	});
