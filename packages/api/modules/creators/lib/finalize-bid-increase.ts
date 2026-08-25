import {
	applyPaidBidIncrease,
	getCreatorBidByIdempotencyKey,
	getCreatorProfileById,
	MIN_BID_CENTS,
} from "@repo/database";

export type FinalizeBidIncreaseInput = {
	creatorId: string;
	amountCents: number;
	idempotencyKey: string;
	paymentSource: "MOCK" | "STRIPE";
	providerPaymentId?: string | null;
};

export async function finalizeBidIncrease(input: FinalizeBidIncreaseInput) {
	if (input.amountCents < MIN_BID_CENTS) {
		throw new Error(`Increase must be at least ${MIN_BID_CENTS} cents`);
	}

	const existing = await getCreatorBidByIdempotencyKey(input.idempotencyKey);
	if (existing?.status === "PAID") {
		return {
			alreadyFinalized: true as const,
			bidId: existing.id,
			creatorId: existing.creatorId,
			totalBidCents: existing.creator.totalBidCents,
		};
	}

	const creator = await getCreatorProfileById(input.creatorId);
	if (!creator || !creator.isPublished) {
		throw new Error("Creator not found or not active");
	}

	const result = await applyPaidBidIncrease({
		creatorId: input.creatorId,
		amountCents: input.amountCents,
		idempotencyKey: input.idempotencyKey,
		paymentSource: input.paymentSource,
		providerPaymentId: input.providerPaymentId ?? null,
	});

	return {
		alreadyFinalized: result.alreadyApplied,
		bidId: result.bid.id,
		creatorId: result.creator.id,
		totalBidCents: result.creator.totalBidCents,
	};
}
