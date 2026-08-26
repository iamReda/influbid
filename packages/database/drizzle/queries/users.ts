import { slugifyUsernameBase, withUsernameSuffix } from "@repo/utils";
import { and, count, desc, eq, gt, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import type { z } from "zod";

import { toPublicProfile } from "../../lib/profile";
import { db } from "../client";
import { account, creatorCategory, creatorProfile, user } from "../schema/postgres";
import type { UserUpdateSchema } from "../zod";

export type AdminUsersAudience = "admins" | "influencers";
export type AdminUsersStatus = "ALL" | "PUBLISHED" | "DRAFT" | "BANNED";

type AdminUsersListOptions = {
	limit: number;
	offset: number;
	query?: string;
	audience?: AdminUsersAudience;
	categorySlug?: string;
	status?: AdminUsersStatus;
};

function buildSearchCondition(query?: string): SQL | undefined {
	if (!query) {
		return undefined;
	}

	return or(
		ilike(user.name, `%${query}%`),
		ilike(user.email, `%${query}%`),
		ilike(user.username, `%${query}%`),
	);
}

function buildAudienceConditions({
	audience,
	categorySlug,
	status = "ALL",
}: Pick<AdminUsersListOptions, "audience" | "categorySlug" | "status">): SQL[] {
	const conditions: SQL[] = [];

	if (audience === "admins") {
		conditions.push(eq(user.role, "admin"));
		return conditions;
	}

	if (audience === "influencers") {
		conditions.push(sql`${creatorProfile.id} is not null`);

		if (status === "PUBLISHED") {
			conditions.push(eq(creatorProfile.isPublished, true));
		}
		if (status === "DRAFT") {
			conditions.push(eq(creatorProfile.isPublished, false));
		}
		if (status === "BANNED") {
			const now = new Date();
			conditions.push(eq(user.banned, true));
			conditions.push(or(isNull(user.banExpires), gt(user.banExpires, now))!);
		}
		if (categorySlug) {
			conditions.push(eq(creatorCategory.slug, categorySlug));
		}
	}

	return conditions;
}

export async function getUsers({
	limit,
	offset,
	query,
	audience,
	categorySlug,
	status = "ALL",
}: AdminUsersListOptions) {
	const searchCondition = buildSearchCondition(query);
	const audienceConditions = buildAudienceConditions({ audience, categorySlug, status });
	const where = and(searchCondition, ...audienceConditions);

	if (audience === "influencers") {
		const rows = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				image: user.image,
				username: user.username,
				bio: user.bio,
				businessEmail: user.businessEmail,
				socialLinks: user.socialLinks,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				role: user.role,
				banned: user.banned,
				banReason: user.banReason,
				banExpires: user.banExpires,
				onboardingComplete: user.onboardingComplete,
				paymentsCustomerId: user.paymentsCustomerId,
				locale: user.locale,
				twoFactorEnabled: user.twoFactorEnabled,
				lastActiveOrganizationId: user.lastActiveOrganizationId,
				joinedAt: creatorProfile.joinedAt,
				isPublished: creatorProfile.isPublished,
				categoryName: creatorCategory.name,
				categorySlug: creatorCategory.slug,
			})
			.from(user)
			.innerJoin(creatorProfile, eq(creatorProfile.userId, user.id))
			.innerJoin(creatorCategory, eq(creatorCategory.id, creatorProfile.categoryId))
			.where(where)
			.orderBy(desc(user.createdAt))
			.limit(limit)
			.offset(offset);

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			emailVerified: row.emailVerified,
			image: row.image,
			username: row.username,
			bio: row.bio,
			businessEmail: row.businessEmail,
			socialLinks: row.socialLinks,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			role: row.role,
			banned: row.banned,
			banReason: row.banReason,
			banExpires: row.banExpires,
			onboardingComplete: row.onboardingComplete,
			paymentsCustomerId: row.paymentsCustomerId,
			locale: row.locale,
			twoFactorEnabled: row.twoFactorEnabled,
			lastActiveOrganizationId: row.lastActiveOrganizationId,
			creatorProfile: {
				joinedAt: row.joinedAt,
				isPublished: row.isPublished,
				category: {
					name: row.categoryName,
					slug: row.categorySlug,
				},
			},
		}));
	}

	return await db.query.user.findMany({
		where: () => where,
		limit,
		offset,
		orderBy: [desc(user.createdAt)],
	});
}

export async function countAllUsers({
	query,
	audience,
	categorySlug,
	status = "ALL",
}: Omit<AdminUsersListOptions, "limit" | "offset">) {
	const searchCondition = buildSearchCondition(query);
	const audienceConditions = buildAudienceConditions({ audience, categorySlug, status });
	const where = and(searchCondition, ...audienceConditions);

	if (audience === "influencers") {
		const result = await db
			.select({ value: count() })
			.from(user)
			.innerJoin(creatorProfile, eq(creatorProfile.userId, user.id))
			.innerJoin(creatorCategory, eq(creatorCategory.id, creatorProfile.categoryId))
			.where(where);
		return Number(result[0]?.value ?? 0);
	}

	const result = await db.select({ value: count() }).from(user).where(where);
	return Number(result[0]?.value ?? 0);
}

export async function getUserById(id: string) {
	return await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, id),
	});
}

export async function getUserByEmail(email: string) {
	return await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.email, email),
	});
}

export async function getUserByUsername(username: string) {
	return await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.username, username),
	});
}

export async function getPublicProfileByUsername(username: string) {
	const profileUser = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.username, username),
		columns: {
			username: true,
			name: true,
			image: true,
			email: true,
			bio: true,
			businessEmail: true,
			socialLinks: true,
		},
	});

	if (!profileUser) {
		return null;
	}

	return toPublicProfile(profileUser);
}

export async function updateUserProfile({
	id,
	name,
	bio,
	businessEmail,
	socialLinks,
}: {
	id: string;
	name?: string;
	bio?: string | null;
	businessEmail?: string | null;
	socialLinks?: string[];
}) {
	await db
		.update(user)
		.set({
			...(name !== undefined ? { name } : {}),
			...(bio !== undefined ? { bio } : {}),
			...(businessEmail !== undefined ? { businessEmail } : {}),
			...(socialLinks !== undefined ? { socialLinks } : {}),
			updatedAt: new Date(),
		})
		.where(eq(user.id, id));

	const updatedUser = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, id),
		columns: {
			id: true,
			username: true,
			name: true,
			image: true,
			email: true,
			bio: true,
			businessEmail: true,
			socialLinks: true,
		},
	});

	return updatedUser;
}

export async function isUsernameTaken(username: string, excludeUserId?: string) {
	const reserved = new Set([
		"about",
		"account",
		"admin",
		"api",
		"blog",
		"categories",
		"changelog",
		"complete-your-profile",
		"contact",
		"dashboard",
		"docs",
		"legal",
		"login",
		"my-dashboard",
		"my-profile",
		"my-settings",
		"out",
		"payment-history",
		"rank-higher",
		"rules",
		"settings",
		"signup",
		"success",
		"u",
		"user",
	]);
	if (reserved.has(username.toLowerCase())) {
		return true;
	}

	const existing = await getUserByUsername(username);
	if (!existing) {
		return false;
	}
	return excludeUserId ? existing.id !== excludeUserId : true;
}

export async function allocateUniqueUsername(name: string, excludeUserId?: string) {
	const base = slugifyUsernameBase(name);

	if (!(await isUsernameTaken(base, excludeUserId))) {
		return base;
	}

	for (let attempt = 0; attempt < 20; attempt++) {
		const candidate = withUsernameSuffix(base);
		if (!(await isUsernameTaken(candidate, excludeUserId))) {
			return candidate;
		}
	}

	return withUsernameSuffix(base);
}

export async function ensureUserUsername(userId: string, name: string) {
	const existing = await getUserById(userId);
	if (!existing) {
		return null;
	}
	if (existing.username) {
		return existing;
	}
	const username = await allocateUniqueUsername(name, userId);
	await updateUser({ id: userId, username });
	return getUserById(userId);
}

export async function createUser({
	email,
	name,
	role,
	emailVerified,
	onboardingComplete,
}: {
	email: string;
	name: string;
	role: "admin" | "user";
	emailVerified: boolean;
	onboardingComplete: boolean;
}) {
	const username = await allocateUniqueUsername(name);

	const [{ id }] = await db
		.insert(user)
		.values({
			email,
			name,
			username,
			role,
			emailVerified,
			onboardingComplete,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning({
			id: user.id,
		});

	const newUser = await getUserById(id);

	return newUser;
}

export async function getAccountById(id: string) {
	return await db.query.account.findFirst({
		where: (account, { eq }) => eq(account.id, id),
	});
}

export async function createUserAccount({
	userId,
	providerId,
	accountId,
	hashedPassword,
}: {
	userId: string;
	providerId: string;
	accountId: string;
	hashedPassword?: string;
}) {
	const [{ id }] = await db
		.insert(account)
		.values({
			userId,
			accountId,
			providerId,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: hashedPassword,
		})
		.returning({
			id: account.id,
		});

	const newAccount = await getAccountById(id);

	return newAccount;
}

export async function updateUser(updatedUser: z.infer<typeof UserUpdateSchema>) {
	return db.update(user).set(updatedUser).where(eq(user.id, updatedUser.id));
}
