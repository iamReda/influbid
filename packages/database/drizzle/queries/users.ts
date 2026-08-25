import { slugifyUsernameBase, withUsernameSuffix } from "@repo/utils";
import { eq, ilike, or, sql } from "drizzle-orm";
import type { z } from "zod";

import { toPublicProfile } from "../../lib/profile";
import { db } from "../client";
import { account, user } from "../schema/postgres";
import type { UserUpdateSchema } from "../zod";

export async function getUsers({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return await db.query.user.findMany({
		where: query
			? (user, { ilike, or }) => or(ilike(user.name, `%${query}%`), ilike(user.email, `%${query}%`))
			: undefined,
		limit,
		offset,
	});
}

export async function countAllUsers({ query }: { query?: string }) {
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(user)
		.where(query ? or(ilike(user.name, `%${query}%`), ilike(user.email, `%${query}%`)) : undefined);
	return Number(result[0]?.count ?? 0);
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
