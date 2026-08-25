import { seedCreatorCategories } from "../prisma/queries/categories";

async function main() {
	const categories = await seedCreatorCategories();
	console.info(`Seeded ${categories.length} creator categories.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
