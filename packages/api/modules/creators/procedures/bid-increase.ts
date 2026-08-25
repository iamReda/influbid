import { ORPCError } from "@orpc/server";
import { estimateRank, getCreatorProfileByUserId, MIN_BID_CENTS } from "@repo/database";
import { nanoid } from "nanoid";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { finalizeBidIncrease } from "../lib/finalize-bid-increase";
import { assertMockPaymentsAllowed } from "../lib/mock-payments";

export const estimateMyBidIncrease = protectedProcedure
	.route({
		method: "GET",
		path: "/creators/me/estimate-increase",
		tags: ["Creators"],
		summary: "Estimate ranks after adding an incremental bid amount",
	})
	.input(
		z.object({
			addedAmountCents: z.number().int().min(0),
		}),
	)
	.output(
		z.object({
			previewTotalCents: z.number().int(),
			generalRank: z.number().int(),
			categoryRank: z.number().int(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const creator = await getCreatorProfileByUserId(user.id);
		if (!creator?.isPublished) {
			throw new ORPCError("NOT_FOUND", { message: "Creator profile not found" });
		}

		const previewTotalCents = creator.totalBidCents + input.addedAmountCents;
		const [generalRank, categoryRank] = await Promise.all([
			estimateRank({
				bidAmountCents: previewTotalCents,
				excludeCreatorId: creator.id,
			}),
			estimateRank({
				bidAmountCents: previewTotalCents,
				categoryId: creator.categoryId,
				excludeCreatorId: creator.id,
			}),
		]);

		return { previewTotalCents, generalRank, categoryRank };
	});

export const mockConfirmBidIncrease = protectedProcedure
	.route({
		method: "POST",
		path: "/creators/mock-payments/confirm-increase",
		tags: ["Creators"],
		summary: "Simulate successful bid increase payment (dev only)",
	})
	.input(
		z.object({
			addedAmountCents: z.number().int().min(MIN_BID_CENTS),
		}),
	)
	.output(
		z.object({
			alreadyFinalized: z.boolean(),
			bidId: z.string(),
			creatorId: z.string(),
			totalBidCents: z.number().int(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		try {
			assertMockPaymentsAllowed();
		} catch {
			throw new ORPCError("FORBIDDEN", { message: "Mock payments are disabled" });
		}

		const creator = await getCreatorProfileByUserId(user.id);
		if (!creator?.isPublished) {
			throw new ORPCError("NOT_FOUND", { message: "Creator profile not found" });
		}

		const idempotencyKey = `increase:${creator.id}:${nanoid()}`;

		try {
			return await finalizeBidIncrease({
				creatorId: creator.id,
				amountCents: input.addedAmountCents,
				idempotencyKey,
				paymentSource: "MOCK",
				providerPaymentId: idempotencyKey,
			});
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: error instanceof Error ? error.message : "Bid increase failed",
			});
		}
	});
