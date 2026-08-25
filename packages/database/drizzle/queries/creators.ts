import { eq } from "drizzle-orm";

import { detectSocialPlatform, normalizeSocialUrl } from "../../lib/social-url";
import { db } from "../client";
import { creatorProfile, socialProfile, user } from "../schema/postgres";

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getCreatorProfileByUserId(userId: string) {
	return (
		(await db.query.creatorProfile.findFirst({
			where: (profile, { eq }) => eq(profile.userId, userId),
			with: {
				category: true,
				user: {
					columns: { id: true, username: true, email: true, businessEmail: true },
				},
				socialProfiles: {
					where: (social, { isNull }) => isNull(social.deletedAt),
					orderBy: (social, { asc }) => [asc(social.position)],
				},
			},
		})) ?? null
	);
}

export async function getCreatorProfileById(id: string) {
	return (
		(await db.query.creatorProfile.findFirst({
			where: (profile, { eq }) => eq(profile.id, id),
			with: {
				category: true,
				user: {
					columns: { id: true, username: true, email: true, businessEmail: true },
				},
				socialProfiles: {
					where: (social, { isNull }) => isNull(social.deletedAt),
					orderBy: (social, { asc }) => [asc(social.position)],
				},
			},
		})) ?? null
	);
}

export async function getPublishedCreatorByUsername(username: string) {
	const normalized = username.toLowerCase();

	const owner = await db.query.user.findFirst({
		where: (u, { eq }) => eq(u.username, normalized),
		columns: { id: true },
	});

	if (!owner) {
		return null;
	}

	return (
		(await db.query.creatorProfile.findFirst({
			where: (profile, { and, eq }) =>
				and(eq(profile.isPublished, true), eq(profile.userId, owner.id)),
			with: {
				category: true,
				user: {
					columns: { id: true, username: true, email: true, businessEmail: true },
				},
				socialProfiles: {
					where: (social, { isNull }) => isNull(social.deletedAt),
					orderBy: (social, { asc }) => [asc(social.position)],
				},
			},
		})) ?? null
	);
}

export async function isPrimarySocialUrlTaken(normalizedUrl: string, excludeCreatorId?: string) {
	const existing = await db.query.socialProfile.findFirst({
		where: (social, { and, eq, isNull, ne }) =>
			and(
				eq(social.normalizedUrl, normalizedUrl),
				eq(social.position, 0),
				isNull(social.deletedAt),
				...(excludeCreatorId ? [ne(social.creatorId, excludeCreatorId)] : []),
			),
		columns: { id: true },
	});

	return Boolean(existing);
}

export type CreateCreatorProfileInput = {
	userId: string;
	publicName: string;
	avatarUrl: string;
	description?: string | null;
	categoryId: string;
	totalBidCents: number;
	currency?: string;
	joinedAt: Date;
	bidReachedAt: Date;
	isPublished?: boolean;
	socialProfiles: Array<{
		platform: string;
		url: string;
		position: number;
	}>;
};

export async function createCreatorProfileWithSocials(
	input: CreateCreatorProfileInput,
	tx: DbClient = db,
) {
	const [created] = await tx
		.insert(creatorProfile)
		.values({
			userId: input.userId,
			publicName: input.publicName,
			avatarUrl: input.avatarUrl,
			description: input.description ?? null,
			categoryId: input.categoryId,
			totalBidCents: input.totalBidCents,
			currency: input.currency ?? "USD",
			joinedAt: input.joinedAt,
			bidReachedAt: input.bidReachedAt,
			isPublished: input.isPublished ?? true,
		})
		.returning({ id: creatorProfile.id });

	if (!created) {
		throw new Error("Failed to create creator profile");
	}

	if (input.socialProfiles.length > 0) {
		await tx.insert(socialProfile).values(
			input.socialProfiles.map((social) => ({
				creatorId: created.id,
				platform: social.platform,
				url: social.url,
				normalizedUrl: normalizeSocialUrl(social.url),
				position: social.position,
			})),
		);
	}

	const profile = await tx.query.creatorProfile.findFirst({
		where: (p, { eq }) => eq(p.id, created.id),
		with: {
			category: true,
			socialProfiles: {
				orderBy: (social, { asc }) => [asc(social.position)],
			},
			user: {
				columns: { id: true, username: true, email: true },
			},
		},
	});

	if (!profile) {
		throw new Error("Failed to load created creator profile");
	}

	return profile;
}

export async function markCreatorAccountClaimed(creatorId: string, claimedAt = new Date()) {
	const [updated] = await db
		.update(creatorProfile)
		.set({ accountClaimedAt: claimedAt, updatedAt: new Date() })
		.where(eq(creatorProfile.id, creatorId))
		.returning();

	if (!updated) {
		throw new Error("Record to update not found.");
	}

	return updated;
}

export type UpdateCreatorProfileInput = {
	userId: string;
	publicName?: string;
	description?: string | null;
	avatarUrl?: string;
	businessEmail?: string | null;
	socialUrls?: string[];
};

async function syncCreatorSocialProfiles(tx: DbClient, creatorId: string, socialUrls: string[]) {
	const now = new Date();
	const desired = socialUrls.map((url, position) => ({
		url: url.trim(),
		normalizedUrl: normalizeSocialUrl(url),
		platform: detectSocialPlatform(url) ?? "other",
		position,
	}));

	const existing = await tx.query.socialProfile.findMany({
		where: (social, { eq }) => eq(social.creatorId, creatorId),
		orderBy: (social, { asc }) => [asc(social.position)],
	});

	// Free all positions first (including soft-deleted) so @@unique([creatorId, position]) cannot collide.
	for (const [index, social] of existing.entries()) {
		await tx
			.update(socialProfile)
			.set({ position: 10_000 + index, updatedAt: now })
			.where(eq(socialProfile.id, social.id));
	}

	const existingByNormalized = new Map(existing.map((social) => [social.normalizedUrl, social]));
	const keptIds = new Set<string>();

	for (const social of desired) {
		const match = existingByNormalized.get(social.normalizedUrl);

		if (match) {
			await tx
				.update(socialProfile)
				.set({
					url: social.url,
					platform: social.platform,
					normalizedUrl: social.normalizedUrl,
					position: social.position,
					deletedAt: null,
					updatedAt: now,
				})
				.where(eq(socialProfile.id, match.id));
			keptIds.add(match.id);
			continue;
		}

		const [created] = await tx
			.insert(socialProfile)
			.values({
				creatorId,
				url: social.url,
				platform: social.platform,
				normalizedUrl: social.normalizedUrl,
				position: social.position,
			})
			.returning({ id: socialProfile.id });

		if (created) {
			keptIds.add(created.id);
		}
	}

	let tombstone = 50_000;
	for (const social of existing) {
		if (!keptIds.has(social.id)) {
			await tx
				.update(socialProfile)
				.set({
					deletedAt: social.deletedAt ?? now,
					position: tombstone++,
					updatedAt: now,
				})
				.where(eq(socialProfile.id, social.id));
		}
	}
}

export async function updateCreatorProfile(input: UpdateCreatorProfileInput) {
	const creator = await getCreatorProfileByUserId(input.userId);

	if (!creator) {
		return null;
	}

	if (input.socialUrls !== undefined) {
		const primaryNormalized = normalizeSocialUrl(input.socialUrls[0] ?? "");
		if (await isPrimarySocialUrlTaken(primaryNormalized, creator.id)) {
			throw new Error("PRIMARY_SOCIAL_TAKEN");
		}
	}

	return db.transaction(async (tx) => {
		const profileUpdates: Partial<typeof creatorProfile.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (input.publicName !== undefined) {
			profileUpdates.publicName = input.publicName;
		}
		if (input.description !== undefined) {
			profileUpdates.description = input.description;
		}
		if (input.avatarUrl !== undefined) {
			profileUpdates.avatarUrl = input.avatarUrl;
		}

		if (
			input.publicName !== undefined ||
			input.description !== undefined ||
			input.avatarUrl !== undefined
		) {
			await tx.update(creatorProfile).set(profileUpdates).where(eq(creatorProfile.id, creator.id));
		}

		if (input.businessEmail !== undefined) {
			await tx
				.update(user)
				.set({ businessEmail: input.businessEmail, updatedAt: new Date() })
				.where(eq(user.id, input.userId));
		}

		if (input.socialUrls !== undefined) {
			await syncCreatorSocialProfiles(tx, creator.id, input.socialUrls);
		}

		return tx.query.creatorProfile.findFirst({
			where: (p, { eq }) => eq(p.id, creator.id),
			with: {
				category: true,
				user: {
					columns: { id: true, username: true, email: true, businessEmail: true },
				},
				socialProfiles: {
					where: (social, { isNull }) => isNull(social.deletedAt),
					orderBy: (social, { asc }) => [asc(social.position)],
				},
			},
		});
	});
}

export function toCreatorEditProfile(
	creator: NonNullable<Awaited<ReturnType<typeof getCreatorProfileByUserId>>>,
) {
	return {
		username: creator.user.username ?? "",
		publicName: creator.publicName,
		avatarUrl: creator.avatarUrl,
		description: creator.description,
		businessEmail: creator.user.businessEmail,
		socialProfiles: creator.socialProfiles.map((social) => ({
			id: social.id,
			url: social.url,
		})),
	};
}

export async function listRecentPaidBids(
	limit = 10,
	options?: {
		type?: "INITIAL" | "INCREASE";
		sinceHours?: number;
		publishedOnly?: boolean;
	},
) {
	const since =
		options?.sinceHours != null
			? new Date(Date.now() - options.sinceHours * 60 * 60 * 1000)
			: undefined;

	const bids = await db.query.creatorBid.findMany({
		where: (bid, { eq, and, gte }) => {
			const conditions = [eq(bid.status, "PAID")];

			if (options?.type) {
				conditions.push(eq(bid.type, options.type));
			}

			if (since) {
				conditions.push(gte(bid.paidAt, since));
			}

			return and(...conditions);
		},
		orderBy: (bid, { desc }) => [desc(bid.paidAt)],
		limit,
		with: {
			creator: {
				with: {
					user: {
						columns: { username: true },
					},
					category: {
						columns: { name: true, slug: true },
					},
				},
			},
		},
	});

	return bids
		.filter((bid) => !options?.publishedOnly || bid.creator.isPublished)
		.map((bid) => ({
			id: bid.id,
			amountCents: bid.amountCents,
			type: bid.type,
			paidAt: bid.paidAt,
			creatorId: bid.creatorId,
			publicName: bid.creator.publicName,
			avatarUrl: bid.creator.avatarUrl,
			username: bid.creator.user.username,
			totalBidCents: bid.totalAfterCents ?? bid.creator.totalBidCents,
		}));
}
