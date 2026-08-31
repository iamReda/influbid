import { isIsoCountryCode } from "@repo/utils";

import { detectSocialPlatform, normalizeSocialUrl } from "../../lib/social-url";
import { db } from "../client";
import type { Prisma } from "../generated/client";

export async function getCreatorProfileByUserId(userId: string) {
	return db.creatorProfile.findUnique({
		where: { userId },
		include: {
			category: true,
			user: { select: { id: true, username: true, email: true, businessEmail: true } },
			socialProfiles: {
				where: { deletedAt: null },
				orderBy: { position: "asc" },
			},
		},
	});
}

export async function getCreatorProfileById(id: string) {
	return db.creatorProfile.findUnique({
		where: { id },
		include: {
			category: true,
			user: { select: { id: true, username: true, email: true, businessEmail: true } },
			socialProfiles: {
				where: { deletedAt: null },
				orderBy: { position: "asc" },
			},
		},
	});
}

export async function getPublishedCreatorByUsername(username: string) {
	const normalized = username.toLowerCase();

	return db.creatorProfile.findFirst({
		where: {
			isPublished: true,
			user: { username: normalized },
		},
		include: {
			category: true,
			user: {
				select: { id: true, username: true, email: true, image: true, businessEmail: true },
			},
			socialProfiles: {
				where: { deletedAt: null },
				orderBy: { position: "asc" },
			},
		},
	});
}

export async function isPrimarySocialUrlTaken(normalizedUrl: string, excludeCreatorId?: string) {
	const existing = await db.socialProfile.findFirst({
		where: {
			normalizedUrl,
			position: 0,
			deletedAt: null,
			...(excludeCreatorId ? { creatorId: { not: excludeCreatorId } } : {}),
		},
		select: { id: true },
	});

	return Boolean(existing);
}

export type CreateCreatorProfileInput = {
	userId: string;
	publicName: string;
	avatarUrl: string;
	description?: string | null;
	countryCode?: string | null;
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
	tx: Prisma.TransactionClient = db,
) {
	return tx.creatorProfile.create({
		data: {
			userId: input.userId,
			publicName: input.publicName,
			avatarUrl: input.avatarUrl,
			description: input.description ?? null,
			countryCode: input.countryCode?.trim().toUpperCase() || null,
			categoryId: input.categoryId,
			totalBidCents: input.totalBidCents,
			currency: input.currency ?? "USD",
			joinedAt: input.joinedAt,
			bidReachedAt: input.bidReachedAt,
			isPublished: input.isPublished ?? true,
			socialProfiles: {
				create: input.socialProfiles.map((social) => ({
					platform: social.platform,
					url: social.url,
					normalizedUrl: normalizeSocialUrl(social.url),
					position: social.position,
				})),
			},
		},
		include: {
			category: true,
			socialProfiles: { orderBy: { position: "asc" } },
			user: { select: { id: true, username: true, email: true, businessEmail: true } },
		},
	});
}

export async function markCreatorAccountClaimed(creatorId: string, claimedAt = new Date()) {
	return db.creatorProfile.update({
		where: { id: creatorId },
		data: { accountClaimedAt: claimedAt },
	});
}

export type CompleteCreatorFirstAccessInput = {
	creatorId: string;
	gender: "MAN" | "WOMAN" | "PREFER_NOT_TO_SAY";
	languages: string[];
};

export async function completeCreatorFirstAccessDemographics(
	input: CompleteCreatorFirstAccessInput,
) {
	return db.creatorProfile.update({
		where: { id: input.creatorId },
		data: {
			gender: input.gender,
			languages: input.languages as unknown as Prisma.InputJsonValue,
		},
	});
}

export function parseCreatorLanguages(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export type UpdateCreatorProfileInput = {
	userId: string;
	publicName?: string;
	description?: string | null;
	countryCode?: string | null;
	avatarUrl?: string;
	businessEmail?: string | null;
	socialUrls?: string[];
};

async function syncCreatorSocialProfiles(
	tx: Prisma.TransactionClient,
	creatorId: string,
	socialUrls: string[],
) {
	const now = new Date();
	const desired = socialUrls.map((url, position) => ({
		url: url.trim(),
		normalizedUrl: normalizeSocialUrl(url),
		platform: detectSocialPlatform(url) ?? "other",
		position,
	}));

	const existing = await tx.socialProfile.findMany({
		where: { creatorId },
		orderBy: { position: "asc" },
	});

	// Free all positions first (including soft-deleted) so @@unique([creatorId, position]) cannot collide.
	for (const [index, social] of existing.entries()) {
		await tx.socialProfile.update({
			where: { id: social.id },
			data: { position: 10_000 + index },
		});
	}

	const existingByNormalized = new Map(existing.map((social) => [social.normalizedUrl, social]));
	const keptIds = new Set<string>();

	for (const social of desired) {
		const match = existingByNormalized.get(social.normalizedUrl);

		if (match) {
			await tx.socialProfile.update({
				where: { id: match.id },
				data: {
					url: social.url,
					platform: social.platform,
					normalizedUrl: social.normalizedUrl,
					position: social.position,
					deletedAt: null,
					updatedAt: now,
				},
			});
			keptIds.add(match.id);
			continue;
		}

		const created = await tx.socialProfile.create({
			data: {
				creatorId,
				url: social.url,
				platform: social.platform,
				normalizedUrl: social.normalizedUrl,
				position: social.position,
			},
		});
		keptIds.add(created.id);
	}

	let tombstone = 50_000;
	for (const social of existing) {
		if (!keptIds.has(social.id)) {
			await tx.socialProfile.update({
				where: { id: social.id },
				data: {
					deletedAt: social.deletedAt ?? now,
					position: tombstone++,
					updatedAt: now,
				},
			});
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

	return db.$transaction(async (tx) => {
		const profileData: Prisma.CreatorProfileUpdateInput = {};

		if (input.publicName !== undefined) {
			profileData.publicName = input.publicName;
		}
		if (input.description !== undefined) {
			profileData.description = input.description;
		}
		if (input.countryCode !== undefined) {
			profileData.countryCode = input.countryCode;
		}
		if (input.avatarUrl !== undefined) {
			profileData.avatarUrl = input.avatarUrl;
		}

		if (Object.keys(profileData).length > 0) {
			await tx.creatorProfile.update({
				where: { id: creator.id },
				data: profileData,
			});
		}

		if (input.businessEmail !== undefined) {
			await tx.user.update({
				where: { id: input.userId },
				data: { businessEmail: input.businessEmail, updatedAt: new Date() },
			});
		}

		if (input.socialUrls !== undefined) {
			await syncCreatorSocialProfiles(tx, creator.id, input.socialUrls);
		}

		return tx.creatorProfile.findUnique({
			where: { id: creator.id },
			include: {
				category: true,
				user: { select: { id: true, username: true, email: true, businessEmail: true } },
				socialProfiles: {
					where: { deletedAt: null },
					orderBy: { position: "asc" },
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
		countryCode:
			creator.countryCode && isIsoCountryCode(creator.countryCode) ? creator.countryCode : null,
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

	const bids = await db.creatorBid.findMany({
		where: {
			status: "PAID",
			...(options?.type ? { type: options.type } : {}),
			...(since ? { paidAt: { gte: since } } : {}),
			...(options?.publishedOnly
				? {
						creator: { isPublished: true },
					}
				: {}),
		},
		orderBy: { paidAt: "desc" },
		take: limit,
		include: {
			creator: {
				include: {
					user: { select: { username: true } },
					category: { select: { name: true, slug: true } },
				},
			},
		},
	});

	return bids.map((bid) => ({
		id: bid.id,
		amountCents: bid.amountCents,
		type: bid.type,
		paidAt: bid.paidAt,
		creatorId: bid.creatorId,
		publicName: bid.creator.publicName,
		avatarUrl: bid.creator.avatarUrl,
		username: bid.creator.user.username,
		totalBidCents: bid.totalAfterCents ?? bid.creator.totalBidCents,
		bidReachedAt: bid.creator.bidReachedAt,
	}));
}
