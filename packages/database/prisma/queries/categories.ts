import { CREATOR_CATEGORY_SEED } from "../../lib/categories-seed";
import { db } from "../client";

export async function seedCreatorCategories() {
	for (const category of CREATOR_CATEGORY_SEED) {
		await db.creatorCategory.upsert({
			where: { slug: category.slug },
			create: {
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				order: category.order,
				active: true,
			},
			update: {
				name: category.name,
				icon: category.icon,
				order: category.order,
				active: true,
			},
		});
	}

	return listActiveCreatorCategories();
}

export async function listActiveCreatorCategories() {
	return db.creatorCategory.findMany({
		where: { active: true },
		orderBy: [{ order: "asc" }, { name: "asc" }],
	});
}

export async function getCreatorCategoryBySlug(slug: string) {
	return db.creatorCategory.findFirst({
		where: { slug, active: true },
	});
}

export async function getCreatorCategoryById(id: string) {
	return db.creatorCategory.findUnique({
		where: { id },
	});
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
			const [influencerCount, topCreators] = await Promise.all([
				db.creatorProfile.count({
					where: {
						categoryId: category.id,
						isPublished: true,
					},
				}),
				db.creatorProfile.findMany({
					where: {
						categoryId: category.id,
						isPublished: true,
					},
					orderBy: [{ totalBidCents: "desc" }, { bidReachedAt: "asc" }],
					take: 3,
					select: {
						id: true,
						publicName: true,
						avatarUrl: true,
						totalBidCents: true,
						user: { select: { username: true } },
					},
				}),
			]);

			return {
				id: category.id,
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				order: category.order,
				influencerCount,
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
