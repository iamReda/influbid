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
				color: category.color,
				order: category.order,
				active: true,
			},
			update: {
				name: category.name,
				icon: category.icon,
				color: category.color,
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

export async function listAllCreatorCategories() {
	return db.creatorCategory.findMany({
		orderBy: [{ order: "asc" }, { name: "asc" }],
		include: {
			_count: {
				select: {
					creators: true,
					pendingCreators: true,
				},
			},
		},
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

export async function createCreatorCategory(input: {
	name: string;
	slug: string;
	description?: string | null;
	icon?: string | null;
	color?: string | null;
	active?: boolean;
	order?: number;
}) {
	const maxOrder = await db.creatorCategory.aggregate({
		_max: { order: true },
	});

	return db.creatorCategory.create({
		data: {
			name: input.name,
			slug: input.slug,
			description: input.description ?? null,
			icon: input.icon ?? null,
			color: input.color ?? null,
			active: input.active ?? true,
			order: input.order ?? (maxOrder._max.order ?? 0) + 1,
		},
	});
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
	return db.creatorCategory.update({
		where: { id },
		data: {
			...(input.name !== undefined ? { name: input.name } : {}),
			...(input.slug !== undefined ? { slug: input.slug } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.icon !== undefined ? { icon: input.icon } : {}),
			...(input.color !== undefined ? { color: input.color } : {}),
			...(input.active !== undefined ? { active: input.active } : {}),
			...(input.order !== undefined ? { order: input.order } : {}),
		},
	});
}

export async function deleteCreatorCategory(id: string) {
	const usage = await db.creatorCategory.findUnique({
		where: { id },
		include: {
			_count: {
				select: {
					creators: true,
					pendingCreators: true,
				},
			},
		},
	});

	if (!usage) {
		return { deleted: false as const, reason: "NOT_FOUND" as const };
	}

	if (usage._count.creators > 0 || usage._count.pendingCreators > 0) {
		return { deleted: false as const, reason: "IN_USE" as const, category: usage };
	}

	await db.creatorCategory.delete({ where: { id } });
	return { deleted: true as const, category: usage };
}

export async function reorderCreatorCategories(orderedIds: string[]) {
	await db.$transaction(
		orderedIds.map((id, index) =>
			db.creatorCategory.update({
				where: { id },
				data: { order: index + 1 },
			}),
		),
	);

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
				color: category.color,
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
