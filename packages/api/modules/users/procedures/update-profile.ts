import { ORPCError } from "@orpc/server";
import { toPublicProfile, updateUserProfile } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { publicProfileSchema, updateProfileInputSchema } from "../types";

export const updateProfile = protectedProcedure
	.route({
		method: "PATCH",
		path: "/users/profile",
		tags: ["Users"],
		summary: "Update profile",
		description: "Update the authenticated user's public profile fields",
	})
	.input(updateProfileInputSchema)
	.output(publicProfileSchema)
	.handler(async ({ context: { user }, input }) => {
		const updatedUser = await updateUserProfile({
			id: user.id,
			...input,
		});

		const profile = updatedUser ? toPublicProfile(updatedUser) : null;

		if (!profile) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}

		return profile;
	});
