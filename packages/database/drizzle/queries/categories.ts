import { and, eq, sql } from "drizzle-orm";

import { CREATOR_CATEGORY_SEED } from "../../lib/categories-seed";
import { db } from "../client";
import { creatorCategory, creatorProfile, pendingCreator } from "../schema/postgres";

export async function seedCreatorCategories() {
	for (const category of CREATOR_CATEGORY_SEED) {
		await db
			.insert(creatorCategory)
			.values({
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				color: category.color,
				order: category.order,
				active: true,
			})
			.onConflictDoUpdate({
				target: creatorCategory.slug,
				set: {
					name: category.name,
					icon: category.icon,
					color: category.color,
					order: category.order,
					active: true,
					updatedAt: new Date(),
				},
			});
	}

	return listActiveCreatorCategories();
}

export async function listActiveCreatorCategories() {
	return db.query.creatorCategory.findMany({
		where: (category, { eq }) => eq(category.active, true),
		orderBy: (category, { asc }) => [asc(category.order), asc(category.name)],
	});
}

export async function listAllCreatorCategories() {
	const categories = await db.query.creatorCategory.findMany({
		orderBy: (category, { asc }) => [asc(category.order), asc(category.name)],
	});

	return Promise.all(
		categories.map(async (category) => {
			const [creatorsRow] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(creatorProfile)
				.where(eq(creatorProfile.categoryId, category.id));

			const [pendingRow] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(pendingCreator)
				.where(eq(pendingCreator.categoryId, category.id));

			return {
				...category,
				_count: {
					creators: creatorsRow?.count ?? 0,
					pendingCreators: pendingRow?.count ?? 0,
				},
			};
		}),
	);
}

export async function getCreatorCategoryBySlug(slug: string) {
	return (
		(await db.query.creatorCategory.findFirst({
			where: (category, { and, eq }) => and(eq(category.slug, slug), eq(category.active, true)),
		})) ?? null
	);
}

export async function getCreatorCategoryById(id: string) {
	return (
		(await db.query.creatorCategory.findFirst({
			where: (category, { eq }) => eq(category.id, id),
		})) ?? null
	);
}

export async function createCreatorCategory(input: {
	name: string;
	slug: string;
	description?: string | null;
	icon?: string | null;
	color?: string | null;
	active?: boolean;
	order?: number;
}) {
	const [maxRow] = await db
		.select({ maxOrder: sql<number>`coalesce(max(${creatorCategory.order}), 0)::int` })
		.from(creatorCategory);

	const [created] = await db
		.insert(creatorCategory)
		.values({
			name: input.name,
			slug: input.slug,
			description: input.description ?? null,
			icon: input.icon ?? null,
			color: input.color ?? null,
			active: input.active ?? true,
			order: input.order ?? (maxRow?.maxOrder ?? 0) + 1,
		})
		.returning();

	return created!;
}

export async function updateCreatorCategory(
	id: string,
	input: {
		name?: string;
		slug?: string;
		description?: string | null;
		icon?: string | null;
		color?: string | null;
		active?: boolean;
		order?: number;
	},
) {
	const [updated] = await db
		.update(creatorCategory)
		.set({
			...(input.name !== undefined ? { name: input.name } : {}),
			...(input.slug !== undefined ? { slug: input.slug } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.icon !== undefined ? { icon: input.icon } : {}),
			...(input.color !== undefined ? { color: input.color } : {}),
			...(input.active !== undefined ? { active: input.active } : {}),
			...(input.order !== undefined ? { order: input.order } : {}),
			updatedAt: new Date(),
		})
		.where(eq(creatorCategory.id, id))
		.returning();

	return updated ?? null;
}

export async function deleteCreatorCategory(id: string) {
	const category = await getCreatorCategoryById(id);
	if (!category) {
		return { deleted: false as const, reason: "NOT_FOUND" as const };
	}

	const [creatorsRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(creatorProfile)
		.where(eq(creatorProfile.categoryId, id));

	const [pendingRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(pendingCreator)
		.where(eq(pendingCreator.categoryId, id));

	const creators = creatorsRow?.count ?? 0;
	const pendingCreators = pendingRow?.count ?? 0;

	if (creators > 0 || pendingCreators > 0) {
		return {
			deleted: false as const,
			reason: "IN_USE" as const,
			category: {
				...category,
				_count: { creators, pendingCreators },
			},
		};
	}

	await db.delete(creatorCategory).where(eq(creatorCategory.id, id));
	return {
		deleted: true as const,
		category: {
			...category,
			_count: { creators, pendingCreators },
		},
	};
}

export async function reorderCreatorCategories(orderedIds: string[]) {
	await db.transaction(async (tx) => {
		for (const [index, id] of orderedIds.entries()) {
			await tx
				.update(creatorCategory)
				.set({ order: index + 1, updatedAt: new Date() })
				.where(eq(creatorCategory.id, id));
		}
	});

	return listAllCreatorCategories();
}

export type CategoryCardData = {
	id: string;
	name: string;
	slug: string;
	icon: string | null;
	color: string | null;
	order: number;
	influencerCount: number;
	topCreators: Array<{
		id: string;
		publicName: string;
		avatarUrl: string;
		totalBidCents: number;
		username: string | null;
	}>;
};

export async function listCategoryCards(): Promise<CategoryCardData[]> {
	const categories = await listActiveCreatorCategories();

	return Promise.all(
		categories.map(async (category) => {
			const [countRow] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(creatorProfile)
				.where(
					and(eq(creatorProfile.categoryId, category.id), eq(creatorProfile.isPublished, true)),
				);

			const topCreators = await db.query.creatorProfile.findMany({
				where: (profile, { and, eq }) =>
					and(eq(profile.categoryId, category.id), eq(profile.isPublished, true)),
				orderBy: (profile, { asc, desc }) => [
					desc(profile.totalBidCents),
					asc(profile.bidReachedAt),
				],
				limit: 3,
				columns: {
					id: true,
					publicName: true,
					avatarUrl: true,
					totalBidCents: true,
				},
				with: {
					user: {
						columns: { username: true },
					},
				},
			});

			return {
				id: category.id,
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				color: category.color,
				order: category.order,
				influencerCount: countRow?.count ?? 0,
				topCreators: topCreators.map((creator) => ({
					id: creator.id,
					publicName: creator.publicName,
					avatarUrl: creator.avatarUrl,
					totalBidCents: creator.totalBidCents,
					username: creator.user.username,
				})),
			};
		}),
	);
}
