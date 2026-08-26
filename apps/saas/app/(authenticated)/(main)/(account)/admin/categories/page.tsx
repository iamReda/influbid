import { CategoryList } from "@admin/component/categories/CategoryList";
import { PageHeader } from "@shared/components/PageHeader";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: t("admin.categories.title"),
	};
}

export default async function AdminCategoriesPage() {
	const t = await getTranslations("admin.categories");

	return (
		<div>
			<PageHeader title={t("title")} subtitle={t("description")} />
			<CategoryList />
		</div>
	);
}
