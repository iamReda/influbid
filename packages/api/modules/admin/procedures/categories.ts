import { ORPCError } from "@orpc/server";
import {
	createCreatorCategory,
	deleteCreatorCategory,
	listAllCreatorCategories,
	reorderCreatorCategories,
	updateCreatorCategory,
} from "@repo/database";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

const hexColorSchema = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #RRGGBB")
	.nullable()
	.optional();

const categoryOutputSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	description: z.string().nullable(),
	icon: z.string().nullable(),
	color: z.string().nullable(),
	active: z.boolean(),
	order: z.number().int(),
	creatorsCount: z.number().int().nonnegative(),
	pendingCreatorsCount: z.number().int().nonnegative(),
});

function mapCategory(category: Awaited<ReturnType<typeof listAllCreatorCategories>>[number]) {
	return {
		id: category.id,
		name: category.name,
		slug: category.slug,
		description: category.description ?? null,
		icon: category.icon ?? null,
		color: category.color ?? null,
		active: category.active,
		order: category.order,
		creatorsCount: category._count.creators,
		pendingCreatorsCount: category._count.pendingCreators,
	};
}

function slugifyCategoryName(name: string) {
	return (
		name
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 64) || "category"
	);
}

export const listCategories = adminProcedure
	.route({
		method: "GET",
		path: "/admin/categories",
		tags: ["Administration"],
		summary: "List all creator categories",
	})
	.output(z.object({ categories: z.array(categoryOutputSchema) }))
	.handler(async () => {
		const categories = await listAllCreatorCategories();
		return { categories: categories.map(mapCategory) };
	});

export const createCategory = adminProcedure
	.route({
		method: "POST",
		path: "/admin/categories",
		tags: ["Administration"],
		summary: "Create a creator category",
	})
	.input(
		z.object({
			name: z.string().trim().min(1).max(80),
			slug: z
				.string()
				.trim()
				.min(1)
				.max(64)
				.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
				.optional(),
			description: z.string().trim().max(500).nullable().optional(),
			icon: z.string().trim().min(1).max(64).nullable().optional(),
			color: hexColorSchema,
			active: z.boolean().optional(),
		}),
	)
	.output(categoryOutputSchema)
	.handler(async ({ input }) => {
		const slug = input.slug ?? slugifyCategoryName(input.name);

		try {
			const created = await createCreatorCategory({
				name: input.name,
				slug,
				description: input.description ?? null,
				icon: input.icon ?? null,
				color: input.color ?? null,
				active: input.active ?? true,
			});

			return {
				id: created.id,
				name: created.name,
				slug: created.slug,
				description: created.description ?? null,
				icon: created.icon ?? null,
				color: created.color ?? null,
				active: created.active,
				order: created.order,
				creatorsCount: 0,
				pendingCreatorsCount: 0,
			};
		} catch {
			throw new ORPCError("CONFLICT", {
				message: "A category with this slug already exists.",
			});
		}
	});

export const updateCategory = adminProcedure
	.route({
		method: "PATCH",
		path: "/admin/categories/{id}",
		tags: ["Administration"],
		summary: "Update a creator category",
	})
	.input(
		z.object({
			id: z.string().min(1),
			name: z.string().trim().min(1).max(80).optional(),
			slug: z
				.string()
				.trim()
				.min(1)
				.max(64)
				.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
				.optional(),
			description: z.string().trim().max(500).nullable().optional(),
			icon: z.string().trim().min(1).max(64).nullable().optional(),
			color: hexColorSchema,
			active: z.boolean().optional(),
		}),
	)
	.output(categoryOutputSchema)
	.handler(async ({ input }) => {
		const { id, ...data } = input;

		try {
			const updated = await updateCreatorCategory(id, data);
			const categories = await listAllCreatorCategories();
			const withCounts = categories.find((category) => category.id === updated.id);
			if (!withCounts) {
				throw new ORPCError("NOT_FOUND");
			}
			return mapCategory(withCounts);
		} catch (error) {
			if (error instanceof ORPCError) {
				throw error;
			}
			throw new ORPCError("CONFLICT", {
				message: "Could not update category. Slug may already be in use.",
			});
		}
	});

export const deleteCategory = adminProcedure
	.route({
		method: "DELETE",
		path: "/admin/categories/{id}",
		tags: ["Administration"],
		summary: "Delete a creator category",
	})
	.input(z.object({ id: z.string().min(1) }))
	.output(z.object({ deleted: z.boolean() }))
	.handler(async ({ input: { id } }) => {
		const result = await deleteCreatorCategory(id);

		if (result.reason === "NOT_FOUND") {
			throw new ORPCError("NOT_FOUND");
		}

		if (result.reason === "IN_USE") {
			throw new ORPCError("CONFLICT", {
				message: "Category is in use by creators and cannot be deleted.",
			});
		}

		return { deleted: true };
	});

export const reorderCategories = adminProcedure
	.route({
		method: "POST",
		path: "/admin/categories/reorder",
		tags: ["Administration"],
		summary: "Reorder creator categories",
	})
	.input(
		z.object({
			orderedIds: z.array(z.string().min(1)).min(1),
		}),
	)
	.output(z.object({ categories: z.array(categoryOutputSchema) }))
	.handler(async ({ input: { orderedIds } }) => {
		const categories = await reorderCreatorCategories(orderedIds);
		return { categories: categories.map(mapCategory) };
	});
