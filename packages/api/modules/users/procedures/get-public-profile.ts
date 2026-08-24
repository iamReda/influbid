import { ORPCError } from "@orpc/server";
import { getPublicProfileByUsername } from "@repo/database";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import { publicProfileSchema } from "../types";

export const getPublicProfile = publicProcedure
	.route({
		method: "GET",
		path: "/users/public-profile/{username}",
		tags: ["Users"],
		summary: "Get public profile",
		description: "Get a creator public profile by username",
	})
	.input(
		z.object({
			username: z.string().trim().min(1),
		}),
	)
	.output(publicProfileSchema)
	.handler(async ({ input: { username } }) => {
		const profile = await getPublicProfileByUsername(username.toLowerCase());

		if (!profile) {
			throw new ORPCError("NOT_FOUND");
		}

		return profile;
	});
