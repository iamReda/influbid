import { ORPCError } from "@orpc/server";
import { auth } from "@repo/auth";
import { createUser, createUserAccount, getUserByEmail } from "@repo/database";
import { passwordSchema } from "@repo/utils";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

export const createAdmin = adminProcedure
	.route({
		method: "POST",
		path: "/admin/users/admins",
		tags: ["Administration"],
		summary: "Create a new admin account",
	})
	.input(
		z.object({
			name: z.string().trim().min(1).max(100),
			email: z.email(),
			password: passwordSchema,
		}),
	)
	.output(
		z.object({
			id: z.string(),
			name: z.string(),
			email: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		const email = input.email.trim().toLowerCase();
		const existing = await getUserByEmail(email);

		if (existing) {
			throw new ORPCError("CONFLICT", {
				message: "A user with this email already exists.",
			});
		}

		const authContext = await auth.$context;
		const hashedPassword = await authContext.password.hash(input.password);

		const adminUser = await createUser({
			email,
			name: input.name.trim(),
			role: "admin",
			emailVerified: true,
			onboardingComplete: true,
		});

		if (!adminUser) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Could not create admin user.",
			});
		}

		await createUserAccount({
			userId: adminUser.id,
			providerId: "credential",
			accountId: adminUser.id,
			hashedPassword,
		});

		return {
			id: adminUser.id,
			name: adminUser.name,
			email: adminUser.email,
		};
	});
