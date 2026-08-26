import { listAllCreatorBids } from "@repo/database";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

export const listPaymentHistory = adminProcedure
	.route({
		method: "GET",
		path: "/admin/payment-history",
		tags: ["Administration"],
		summary: "List all creator bid payments",
	})
	.input(
		z.object({
			query: z.string().optional(),
			limit: z.number().min(1).max(100).default(25),
			offset: z.number().min(0).default(0),
			status: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
		}),
	)
	.output(
		z.object({
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
					influencer: z.object({
						id: z.string(),
						publicName: z.string(),
						avatarUrl: z.string(),
						email: z.string(),
						username: z.string().nullish(),
					}),
				}),
			),
			total: z.number().int().nonnegative(),
		}),
	)
	.handler(async ({ input }) => {
		const { bids, total } = await listAllCreatorBids({
			limit: input.limit,
			offset: input.offset,
			status: input.status,
			query: input.query,
		});

		return {
			total,
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
				influencer: {
					id: bid.creator.id,
					publicName: bid.creator.publicName,
					avatarUrl: bid.creator.avatarUrl,
					email: bid.creator.user.email,
					username: bid.creator.user.username,
				},
			})),
		};
	});
