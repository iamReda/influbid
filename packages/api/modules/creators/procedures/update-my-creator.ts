import { ORPCError } from "@orpc/server";
import {
	getCreatorProfileByUserId,
	toCreatorEditProfile,
	updateCreatorProfile,
} from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { creatorEditProfileSchema, updateMyCreatorInputSchema } from "../types";

export const updateMyCreator = protectedProcedure
	.route({
		method: "PATCH",
		path: "/creators/me",
		tags: ["Creators"],
		summary: "Update the authenticated creator profile",
	})
	.input(updateMyCreatorInputSchema)
	.output(creatorEditProfileSchema)
	.handler(async ({ context: { user }, input }) => {
		try {
			const updated = await updateCreatorProfile({
				userId: user.id,
				...input,
			});

			if (!updated) {
				throw new ORPCError("NOT_FOUND", { message: "Creator profile not found" });
			}

			return toCreatorEditProfile(updated);
		} catch (error) {
			if (error instanceof Error && error.message === "PRIMARY_SOCIAL_TAKEN") {
				throw new ORPCError("CONFLICT", {
					message: "This primary social profile is already claimed.",
				});
			}

			throw error;
		}
	});

export const getMyCreatorForEdit = protectedProcedure
	.route({
		method: "GET",
		path: "/creators/me/edit",
		tags: ["Creators"],
		summary: "Get creator profile fields for the edit form",
	})
	.output(creatorEditProfileSchema.nullable())
	.handler(async ({ context: { user } }) => {
		const creator = await getCreatorProfileByUserId(user.id);

		if (!creator || !creator.isPublished) {
			return null;
		}

		return toCreatorEditProfile(creator);
	});
