import { estimateRank, getCreatorCategoryById, listActiveCreatorCategories } from "@repo/database";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import { categorySchema } from "../types";

export const listCategories = publicProcedure
	.route({
		method: "GET",
		path: "/creators/categories",
		tags: ["Creators"],
		summary: "List active creator categories",
		description: "Returns active categories ordered for signup and filters",
	})
	.output(z.array(categorySchema))
	.handler(async () => {
		const categories = await listActiveCreatorCategories();

		return categories.map((category) => ({
			id: category.id,
			name: category.name,
			slug: category.slug,
			icon: category.icon,
			order: category.order,
		}));
	});

export const estimateCreatorRank = publicProcedure
	.route({
		method: "GET",
		path: "/creators/estimate-rank",
		tags: ["Creators"],
		summary: "Estimate leaderboard rank for a bid amount",
		description: "Pre-payment rank estimate for homepage and rank-higher previews",
	})
	.input(
		z.object({
			bidAmountCents: z.number().int().positive(),
			categoryId: z.string().optional(),
			excludeCreatorId: z.string().optional(),
		}),
	)
	.output(
		z.object({
			generalRank: z.number().int().positive(),
			categoryRank: z.number().int().positive().nullable(),
		}),
	)
	.handler(async ({ input }) => {
		if (input.categoryId) {
			const category = await getCreatorCategoryById(input.categoryId);
			if (!category?.active) {
				return {
					generalRank: await estimateRank({
						bidAmountCents: input.bidAmountCents,
						excludeCreatorId: input.excludeCreatorId,
					}),
					categoryRank: null,
				};
			}
		}

		const [generalRank, categoryRank] = await Promise.all([
			estimateRank({
				bidAmountCents: input.bidAmountCents,
				excludeCreatorId: input.excludeCreatorId,
			}),
			input.categoryId
				? estimateRank({
						bidAmountCents: input.bidAmountCents,
						categoryId: input.categoryId,
						excludeCreatorId: input.excludeCreatorId,
					})
				: Promise.resolve(null),
		]);

		return { generalRank, categoryRank };
	});
