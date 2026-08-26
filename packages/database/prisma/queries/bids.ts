import { db } from "../client";
import type {
	CreatorBidStatus,
	CreatorBidType,
	CreatorPaymentSource,
	Prisma,
} from "../generated/client";

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
	return db.creatorBid.findUnique({
		where: { idempotencyKey },
		include: { creator: true },
	});
}

export async function getCreatorBidByProviderPaymentId(providerPaymentId: string) {
	return db.creatorBid.findUnique({
		where: { providerPaymentId },
		include: { creator: true },
	});
}

export async function createCreatorBid(
	input: CreateCreatorBidInput,
	tx: Prisma.TransactionClient = db,
) {
	return tx.creatorBid.create({
		data: {
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
		},
	});
}

export async function listPaidCreatorBids(creatorId: string) {
	return db.creatorBid.findMany({
		where: {
			creatorId,
			status: "PAID",
		},
		orderBy: { paidAt: "desc" },
	});
}

export async function listCreatorBidsByCreatorId(creatorId: string) {
	return db.creatorBid.findMany({
		where: { creatorId },
		orderBy: { createdAt: "desc" },
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
	const query = options?.query?.trim();

	const where = {
		...(options?.status ? { status: options.status } : {}),
		...(query
			? {
					creator: {
						OR: [
							{ publicName: { contains: query, mode: "insensitive" as const } },
							{ user: { email: { contains: query, mode: "insensitive" as const } } },
							{ user: { username: { contains: query, mode: "insensitive" as const } } },
						],
					},
				}
			: {}),
	};

	const [bids, total] = await Promise.all([
		db.creatorBid.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
			include: {
				creator: {
					select: {
						id: true,
						publicName: true,
						avatarUrl: true,
						user: {
							select: {
								id: true,
								email: true,
								username: true,
							},
						},
					},
				},
			},
		}),
		db.creatorBid.count({ where }),
	]);

	return { bids, total };
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

	return db.$transaction(async (tx) => {
		const creator = await tx.creatorProfile.findUniqueOrThrow({
			where: { id: options.creatorId },
		});

		const newTotal = creator.totalBidCents + options.amountCents;

		const bid = await tx.creatorBid.create({
			data: {
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
			},
		});

		const updatedCreator = await tx.creatorProfile.update({
			where: { id: options.creatorId },
			data: {
				totalBidCents: newTotal,
				bidReachedAt: paidAt,
			},
		});

		return { bid, creator: updatedCreator, alreadyApplied: false as const };
	});
}
