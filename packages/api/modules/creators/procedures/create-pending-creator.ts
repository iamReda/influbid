import { ORPCError } from "@orpc/server";
import {
	createPendingCreator,
	detectSocialPlatform,
	getCreatorCategoryById,
	getCreatorProfileByUserId,
	getUserByEmail,
	isPrimarySocialUrlTaken,
	MIN_BID_CENTS,
	normalizeSocialUrl,
} from "@repo/database";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import { pendingSocialProfileSchema } from "../types";

export const createPendingCreatorProcedure = publicProcedure
	.route({
		method: "POST",
		path: "/creators/pending",
		tags: ["Creators"],
		summary: "Create pending creator before payment",
		description: "Validates signup payload and stores PendingCreator until payment succeeds",
	})
	.input(
		z.object({
			email: z.string().email().max(320),
			publicName: z.string().trim().min(1).max(120),
			avatarUrl: z.string().url().max(2048),
			description: z.string().trim().max(160).optional().nullable(),
			categoryId: z.string().min(1),
			socialProfiles: z.array(pendingSocialProfileSchema).min(1).max(10),
			bidAmountCents: z.number().int().min(MIN_BID_CENTS),
			estimatedRank: z.number().int().positive().optional().nullable(),
		}),
	)
	.output(
		z.object({
			id: z.string(),
			expiresAt: z.date(),
		}),
	)
	.handler(async ({ input }) => {
		const category = await getCreatorCategoryById(input.categoryId);
		if (!category?.active) {
			throw new ORPCError("BAD_REQUEST", { message: "Invalid category" });
		}

		const existingUser = await getUserByEmail(input.email.trim().toLowerCase());
		if (existingUser) {
			const existingCreator = await getCreatorProfileByUserId(existingUser.id);
			if (existingCreator) {
				throw new ORPCError("CONFLICT", {
					message: "An account with this email already exists. Sign in to continue.",
				});
			}
		}

		const sorted = [...input.socialProfiles].sort((a, b) => a.position - b.position);
		const primary = sorted[0];
		if (!primary || primary.position !== 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Primary social profile (position 0) is required",
			});
		}

		const positions = new Set(sorted.map((item) => item.position));
		if (positions.size !== sorted.length) {
			throw new ORPCError("BAD_REQUEST", { message: "Duplicate social positions" });
		}

		const normalizedPrimary = normalizeSocialUrl(primary.url);
		if (await isPrimarySocialUrlTaken(normalizedPrimary)) {
			throw new ORPCError("CONFLICT", {
				message: "This primary social profile is already claimed",
			});
		}

		const socialProfiles = sorted.map((item, index) => ({
			platform: item.platform || detectSocialPlatform(item.url) || "other",
			url: item.url.trim(),
			position: item.position ?? index,
		}));

		const pending = await createPendingCreator({
			email: input.email,
			publicName: input.publicName,
			avatarUrl: input.avatarUrl,
			description: input.description,
			categoryId: input.categoryId,
			socialProfiles,
			bidAmountCents: input.bidAmountCents,
			estimatedRank: input.estimatedRank,
		});

		return {
			id: pending.id,
			expiresAt: pending.expiresAt,
		};
	});
