import { countAllUsers, getUsers, UserSchema } from "@repo/database";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

const audienceSchema = z.enum(["admins", "influencers"]);
const statusSchema = z.enum(["ALL", "PUBLISHED", "DRAFT", "BANNED"]);

const adminUserSchema = UserSchema.extend({
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	banExpires: z.coerce.date().nullish(),
	creatorProfile: z
		.object({
			joinedAt: z.coerce.date(),
			isPublished: z.boolean(),
			category: z.object({
				name: z.string(),
				slug: z.string(),
			}),
		})
		.nullish(),
});

export const listUsers = adminProcedure
	.route({
		method: "GET",
		path: "/admin/users",
		tags: ["Administration"],
		summary: "List users",
	})
	.input(
		z.object({
			query: z.string().optional(),
			limit: z.number().min(1).max(100).default(10),
			offset: z.number().min(0).default(0),
			audience: audienceSchema.optional(),
			categorySlug: z.string().optional(),
			status: statusSchema.default("ALL"),
		}),
	)
	.output(
		z.object({
			users: z.array(adminUserSchema),
			total: z.number().int().nonnegative(),
		}),
	)
	.handler(async ({ input: { query, limit, offset, audience, categorySlug, status } }) => {
		const users = await getUsers({
			limit,
			offset,
			query,
			audience,
			categorySlug,
			status,
		});

		const total = await countAllUsers({
			query,
			audience,
			categorySlug,
			status,
		});

		return { users, total };
	});
