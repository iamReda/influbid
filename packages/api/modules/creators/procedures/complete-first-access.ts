import { ORPCError } from "@orpc/server";
import { auth } from "@repo/auth";
import {
	completeCreatorFirstAccessDemographics,
	getCreatorProfileByUserId,
	markCreatorAccountClaimed,
} from "@repo/database";
import { creatorGenderSchema, languagesSchema, passwordSchema } from "@repo/utils";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const completeFirstAccess = protectedProcedure
	.route({
		method: "POST",
		path: "/creators/me/complete-first-access",
		tags: ["Creators"],
		summary: "Complete first-access onboarding (languages, gender, password)",
	})
	.input(
		z.object({
			gender: creatorGenderSchema,
			languages: languagesSchema,
			password: passwordSchema,
		}),
	)
	.output(
		z.object({
			ok: z.literal(true),
			claimed: z.boolean(),
		}),
	)
	.handler(async ({ input, context: { user, headers } }) => {
		const creator = await getCreatorProfileByUserId(user.id);
		if (!creator) {
			throw new ORPCError("NOT_FOUND", { message: "Creator profile not found" });
		}

		if (creator.accountClaimedAt) {
			return { ok: true as const, claimed: true };
		}

		await completeCreatorFirstAccessDemographics({
			creatorId: creator.id,
			gender: input.gender,
			languages: input.languages,
		});

		const accounts = await auth.api.listUserAccounts({ headers });
		const hasPassword = accounts?.some((account) => account.providerId === "credential");

		if (!hasPassword) {
			try {
				await auth.api.setPassword({
					body: { newPassword: input.password },
					headers,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : "Could not set password";
				if (!/already.?set|PASSWORD_ALREADY_SET/i.test(message)) {
					throw new ORPCError("BAD_REQUEST", { message });
				}
			}
		}

		await markCreatorAccountClaimed(creator.id);

		return { ok: true as const, claimed: true };
	});
