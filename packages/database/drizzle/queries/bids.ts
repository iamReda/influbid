import { eq } from "drizzle-orm";

import { db } from "../client";
import type { CreatorBidStatus, CreatorBidType, CreatorPaymentSource } from "../schema";
import { creatorBid, creatorProfile } from "../schema/postgres";

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CreateCreatorBidInput = {
	creatorId: string;
	type: CreatorBidType;
	status: CreatorBidStatus;
	amountCents: number;
	currency?: string;
	totalAfterCents?: number | null;
	paymentSource: CreatorPaymentSource;
	providerPaymentId?: string | null;
	idempotencyKey: string;
	paidAt?: Date | null;
};

export async function getCreatorBidByIdempotencyKey(idempotencyKey: string) {
	return (
		(await db.query.creatorBid.findFirst({
			where: (bid, { eq }) => eq(bid.idempotencyKey, idempotencyKey),
			with: { creator: true },
		})) ?? null
	);
}

export async function getCreatorBidByProviderPaymentId(providerPaymentId: string) {
	return (
		(await db.query.creatorBid.findFirst({
			where: (bid, { eq }) => eq(bid.providerPaymentId, providerPaymentId),
			with: { creator: true },
		})) ?? null
	);
}

export async function createCreatorBid(input: CreateCreatorBidInput, tx: DbClient = db) {
	const [bid] = await tx
		.insert(creatorBid)
		.values({
			creatorId: input.creatorId,
			type: input.type,
			status: input.status,
			amountCents: input.amountCents,
			currency: input.currency ?? "USD",
			totalAfterCents: input.totalAfterCents ?? null,
			paymentSource: input.paymentSource,
			providerPaymentId: input.providerPaymentId ?? null,
			idempotencyKey: input.idempotencyKey,
			paidAt: input.paidAt ?? null,
		})
		.returning();

	if (!bid) {
		throw new Error("Failed to create creator bid");
	}

	return bid;
}

export async function listPaidCreatorBids(creatorId: string) {
	return db.query.creatorBid.findMany({
		where: (bid, { and, eq }) => and(eq(bid.creatorId, creatorId), eq(bid.status, "PAID")),
		orderBy: (bid, { desc }) => [desc(bid.paidAt)],
	});
}

export async function listCreatorBidsByCreatorId(creatorId: string) {
	return db.query.creatorBid.findMany({
		where: (bid, { eq }) => eq(bid.creatorId, creatorId),
		orderBy: (bid, { desc }) => [desc(bid.createdAt)],
	});
}

export async function listAllCreatorBids(options?: {
	limit?: number;
	offset?: number;
	status?: CreatorBidStatus;
	query?: string;
}) {
	const limit = options?.limit ?? 50;
	const offset = options?.offset ?? 0;
	const query = options?.query?.trim().toLowerCase();

	const bids = await db.query.creatorBid.findMany({
		where: options?.status ? (bid, { eq }) => eq(bid.status, options.status!) : undefined,
		orderBy: (bid, { desc }) => [desc(bid.createdAt)],
		with: {
			creator: {
				columns: {
					id: true,
					publicName: true,
					avatarUrl: true,
				},
				with: {
					user: {
						columns: {
							id: true,
							email: true,
							username: true,
						},
					},
				},
			},
		},
	});

	const filtered = query
		? bids.filter((bid) => {
				const name = bid.creator.publicName.toLowerCase();
				const email = bid.creator.user.email.toLowerCase();
				const username = (bid.creator.user.username ?? "").toLowerCase();
				return name.includes(query) || email.includes(query) || username.includes(query);
			})
		: bids;

	return {
		bids: filtered.slice(offset, offset + limit),
		total: filtered.length,
	};
}

/**
 * Atomically apply a paid bid increase.
 * Idempotent when called with an existing idempotencyKey that is already PAID.
 */
export async function applyPaidBidIncrease(options: {
	creatorId: string;
	amountCents: number;
	idempotencyKey: string;
	paymentSource: CreatorPaymentSource;
	providerPaymentId?: string | null;
	paidAt?: Date;
}) {
	const existing = await getCreatorBidByIdempotencyKey(options.idempotencyKey);
	if (existing?.status === "PAID") {
		return { bid: existing, creator: existing.creator, alreadyApplied: true as const };
	}

	const paidAt = options.paidAt ?? new Date();

	return db.transaction(async (tx) => {
		const creator = await tx.query.creatorProfile.findFirst({
			where: (profile, { eq }) => eq(profile.id, options.creatorId),
		});

		if (!creator) {
			throw new Error("No CreatorProfile found");
		}

		const newTotal = creator.totalBidCents + options.amountCents;

		const [bid] = await tx
			.insert(creatorBid)
			.values({
				creatorId: options.creatorId,
				type: "INCREASE",
				status: "PAID",
				amountCents: options.amountCents,
				currency: creator.currency,
				totalAfterCents: newTotal,
				paymentSource: options.paymentSource,
				providerPaymentId: options.providerPaymentId ?? null,
				idempotencyKey: options.idempotencyKey,
				paidAt,
			})
			.returning();

		if (!bid) {
			throw new Error("Failed to create creator bid");
		}

		const [updatedCreator] = await tx
			.update(creatorProfile)
			.set({
				totalBidCents: newTotal,
				bidReachedAt: paidAt,
				updatedAt: new Date(),
			})
			.where(eq(creatorProfile.id, options.creatorId))
			.returning();

		if (!updatedCreator) {
			throw new Error("Failed to update creator profile");
		}

		return { bid, creator: updatedCreator, alreadyApplied: false as const };
	});
}
