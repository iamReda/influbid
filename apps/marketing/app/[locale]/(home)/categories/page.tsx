import CategoriesPage from "@home/influencerbid/categories";
import { setRequestLocale } from "next-intl/server";

export default async function CategoriesRoutePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <CategoriesPage />;
}
