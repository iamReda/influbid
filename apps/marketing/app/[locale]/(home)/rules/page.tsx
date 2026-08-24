import RulesPage from "@home/influencerbid/rules-page";
import { setRequestLocale } from "next-intl/server";

export default async function RulesRoutePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <RulesPage />;
}
