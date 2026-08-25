import { listCategoryCards, listLeaderboard } from "@repo/database";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import { categoryCardSchema, leaderboardItemSchema } from "../types";

export const listCategoryCardsProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/creators/category-cards",
		tags: ["Creators"],
		summary: "List category cards with Top 3 and counts",
		description: "Powers the public /categories page",
	})
	.output(z.array(categoryCardSchema))
	.handler(async () => listCategoryCards());

export const listCreatorLeaderboard = publicProcedure
	.route({
		method: "GET",
		path: "/creators/leaderboard",
		tags: ["Creators"],
		summary: "List published creator leaderboard",
		description: "General or category-filtered ranking page",
	})
	.input(
		z.object({
			categorySlug: z.string().optional(),
			page: z.number().int().positive().optional(),
			pageSize: z.number().int().positive().max(100).optional(),
		}),
	)
	.output(
		z.object({
			items: z.array(leaderboardItemSchema),
			total: z.number().int(),
			page: z.number().int(),
			pageSize: z.number().int(),
		}),
	)
	.handler(async ({ input }) => listLeaderboard(input));
