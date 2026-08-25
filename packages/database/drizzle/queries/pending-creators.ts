import { eq } from "drizzle-orm";

import type { PendingSocialProfileInput } from "../../lib/social-url";
import { parsePendingSocialProfiles } from "../../lib/social-url";
import { db } from "../client";
import type { PendingCreatorStatus } from "../schema";
import { pendingCreator } from "../schema/postgres";

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

	const [created] = await db
		.insert(pendingCreator)
		.values({
			email: input.email.trim().toLowerCase(),
			publicName: input.publicName.trim(),
			avatarUrl: input.avatarUrl,
			description: input.description?.trim() || null,
			categoryId: input.categoryId,
			socialProfiles: input.socialProfiles,
			bidAmountCents: input.bidAmountCents,
			currency: input.currency ?? "USD",
			estimatedRank: input.estimatedRank ?? null,
			paymentReference: input.paymentReference ?? null,
			status: "PENDING_PAYMENT",
			expiresAt: new Date(now.getTime() + PENDING_TTL_MS),
		})
		.returning({ id: pendingCreator.id });

	if (!created) {
		throw new Error("Failed to create pending creator");
	}

	const pending = await getPendingCreatorById(created.id);
	if (!pending) {
		throw new Error("Failed to load created pending creator");
	}
	return pending;
}

export async function getPendingCreatorById(id: string) {
	return (
		(await db.query.pendingCreator.findFirst({
			where: (pending, { eq }) => eq(pending.id, id),
			with: { category: true },
		})) ?? null
	);
}

export async function getPendingCreatorByPaymentReference(paymentReference: string) {
	return (
		(await db.query.pendingCreator.findFirst({
			where: (pending, { eq }) => eq(pending.paymentReference, paymentReference),
			with: { category: true },
		})) ?? null
	);
}

export async function updatePendingCreatorStatus(
	id: string,
	status: PendingCreatorStatus,
	extra?: { paymentReference?: string },
) {
	const [updated] = await db
		.update(pendingCreator)
		.set({
			status,
			...(extra?.paymentReference !== undefined
				? { paymentReference: extra.paymentReference }
				: {}),
			updatedAt: new Date(),
		})
		.where(eq(pendingCreator.id, id))
		.returning({ id: pendingCreator.id });

	if (!updated) {
		throw new Error("Record to update not found.");
	}

	const pending = await getPendingCreatorById(updated.id);
	if (!pending) {
		throw new Error("Failed to load updated pending creator");
	}
	return pending;
}

export function getPendingSocialProfiles(pending: { socialProfiles: unknown }) {
	return parsePendingSocialProfiles(pending.socialProfiles);
}
