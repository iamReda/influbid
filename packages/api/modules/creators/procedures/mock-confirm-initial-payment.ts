import { ORPCError } from "@orpc/server";
import { getPendingCreatorById } from "@repo/database";
import { nanoid } from "nanoid";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import { finalizeCreatorPayment } from "../lib/finalize-creator-payment";
import { assertMockPaymentsAllowed, isMockPaymentsEnabled } from "../lib/mock-payments";

export const getMockPaymentsStatus = publicProcedure
	.route({
		method: "GET",
		path: "/creators/mock-payments/status",
		tags: ["Creators"],
		summary: "Whether mock payments are enabled",
		description: "Used by development UI to show the mock payment path",
	})
	.output(
		z.object({
			enabled: z.boolean(),
		}),
	)
	.handler(async () => ({
		enabled: isMockPaymentsEnabled(),
	}));

export const mockConfirmInitialPayment = publicProcedure
	.route({
		method: "POST",
		path: "/creators/mock-payments/confirm-initial",
		tags: ["Creators"],
		summary: "Simulate successful initial bid payment (dev only)",
		description: "Runs shared finalizeCreatorPayment after a mock payment confirmation",
	})
	.input(
		z.object({
			pendingCreatorId: z.string().min(1),
		}),
	)
	.output(
		z.object({
			alreadyFinalized: z.boolean(),
			userId: z.string().nullable(),
			creatorId: z.string().optional(),
			pendingCreatorId: z.string(),
			username: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input }) => {
		try {
			assertMockPaymentsAllowed();
		} catch {
			throw new ORPCError("FORBIDDEN", { message: "Mock payments are disabled" });
		}

		const pending = await getPendingCreatorById(input.pendingCreatorId);
		if (!pending) {
			throw new ORPCError("NOT_FOUND", { message: "Pending creator not found" });
		}

		const paymentReference = pending.paymentReference ?? `mock_${pending.id}_${nanoid(10)}`;

		try {
			return await finalizeCreatorPayment({
				pendingCreatorId: pending.id,
				paymentReference,
				paymentSource: "MOCK",
				providerPaymentId: paymentReference,
			});
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: error instanceof Error ? error.message : "Payment finalization failed",
			});
		}
	});
