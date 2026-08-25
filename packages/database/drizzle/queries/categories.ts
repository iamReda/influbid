import { and, eq, sql } from "drizzle-orm";

import { CREATOR_CATEGORY_SEED } from "../../lib/categories-seed";
import { db } from "../client";
import { creatorCategory, creatorProfile } from "../schema/postgres";

export async function seedCreatorCategories() {
	for (const category of CREATOR_CATEGORY_SEED) {
		await db
			.insert(creatorCategory)
			.values({
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				order: category.order,
				active: true,
			})
			.onConflictDoUpdate({
				target: creatorCategory.slug,
				set: {
					name: category.name,
					icon: category.icon,
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

export type CategoryCardData = {
	id: string;
	name: string;
	slug: string;
	icon: string | null;
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
