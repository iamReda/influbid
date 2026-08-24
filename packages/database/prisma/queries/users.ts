import { slugifyUsernameBase, withUsernameSuffix } from "@repo/utils";
import type { z } from "zod";

import { toPublicProfile, type PublicProfile } from "../../lib/profile";
import { db } from "../client";
import type { UserSchema } from "../zod";

export type { PublicProfile };
export { parseSocialLinks, toPublicProfile } from "../../lib/profile";

export async function getUsers({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return await db.user.findMany({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							email: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				}
			: undefined,
		take: limit,
		skip: offset,
	});
}

export async function countAllUsers({ query }: { query?: string }) {
	return await db.user.count({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							email: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				}
			: undefined,
	});
}

export async function getUserById(id: string) {
	return await db.user.findUnique({
		where: {
			id,
		},
	});
}

export async function getUserByEmail(email: string) {
	return await db.user.findUnique({
		where: {
			email,
		},
	});
}

export async function getUserByUsername(username: string) {
	return await db.user.findUnique({
		where: {
			username,
		},
	});
}

export async function getPublicProfileByUsername(username: string) {
	const user = await db.user.findUnique({
		where: {
			username,
		},
		select: {
			username: true,
			name: true,
			image: true,
			email: true,
			bio: true,
			businessEmail: true,
			socialLinks: true,
		},
	});

	if (!user) {
		return null;
	}

	return toPublicProfile(user);
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
	return await db.user.update({
		where: {
			id,
		},
		data: {
			...(name !== undefined ? { name } : {}),
			...(bio !== undefined ? { bio } : {}),
			...(businessEmail !== undefined ? { businessEmail } : {}),
			...(socialLinks !== undefined ? { socialLinks } : {}),
			updatedAt: new Date(),
		},
		select: {
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
}

export async function isUsernameTaken(username: string, excludeUserId?: string) {
	const existing = await db.user.findUnique({
		where: { username },
		select: { id: true },
	});

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

	return withUsernameSuffix(`${base}-${Date.now().toString(36)}`);
}

export async function ensureUserUsername(userId: string, name: string) {
	const user = await getUserById(userId);
	if (!user) {
		return null;
	}

	if (user.username) {
		return user;
	}

	const username = await allocateUniqueUsername(name, userId);
	return await updateUser({ id: userId, username });
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

	return await db.user.create({
		data: {
			email,
			name,
			username,
			role,
			emailVerified,
			onboardingComplete,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function getAccountById(id: string) {
	return await db.account.findUnique({
		where: {
			id,
		},
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
	return await db.account.create({
		data: {
			userId,
			accountId,
			providerId,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function updateUser(user: Partial<z.infer<typeof UserSchema>> & { id: string }) {
	const { id, socialLinks, ...data } = user;

	return await db.user.update({
		where: {
			id,
		},
		data: {
			...data,
			...(socialLinks !== undefined ? { socialLinks: socialLinks as string[] } : {}),
		},
	});
}
