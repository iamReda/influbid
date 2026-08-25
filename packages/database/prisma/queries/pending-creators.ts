import type { PendingSocialProfileInput } from "../../lib/social-url";
import { parsePendingSocialProfiles } from "../../lib/social-url";
import { db } from "../client";
import type { PendingCreatorStatus, Prisma } from "../generated/client";

const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export type CreatePendingCreatorInput = {
	email: string;
	publicName: string;
	avatarUrl: string;
	description?: string | null;
	categoryId: string;
	socialProfiles: PendingSocialProfileInput[];
	bidAmountCents: number;
	currency?: string;
	estimatedRank?: number | null;
	paymentReference?: string | null;
};

export async function createPendingCreator(input: CreatePendingCreatorInput) {
	const now = new Date();

	return db.pendingCreator.create({
		data: {
			email: input.email.trim().toLowerCase(),
			publicName: input.publicName.trim(),
			avatarUrl: input.avatarUrl,
			description: input.description?.trim() || null,
			categoryId: input.categoryId,
			socialProfiles: input.socialProfiles as unknown as Prisma.InputJsonValue,
			bidAmountCents: input.bidAmountCents,
			currency: input.currency ?? "USD",
			estimatedRank: input.estimatedRank ?? null,
			paymentReference: input.paymentReference ?? null,
			status: "PENDING_PAYMENT",
			expiresAt: new Date(now.getTime() + PENDING_TTL_MS),
		},
		include: {
			category: true,
		},
	});
}

export async function getPendingCreatorById(id: string) {
	return db.pendingCreator.findUnique({
		where: { id },
		include: { category: true },
	});
}

export async function getPendingCreatorByPaymentReference(paymentReference: string) {
	return db.pendingCreator.findUnique({
		where: { paymentReference },
		include: { category: true },
	});
}

export async function updatePendingCreatorStatus(
	id: string,
	status: PendingCreatorStatus,
	extra?: { paymentReference?: string },
) {
	return db.pendingCreator.update({
		where: { id },
		data: {
			status,
			...(extra?.paymentReference !== undefined
				? { paymentReference: extra.paymentReference }
				: {}),
		},
		include: { category: true },
	});
}

export function getPendingSocialProfiles(pending: { socialProfiles: unknown }) {
	return parsePendingSocialProfiles(pending.socialProfiles);
}
