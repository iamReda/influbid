import AboutPage from "@home/influencerbid/about-page";
import { setRequestLocale } from "next-intl/server";

export default async function AboutRoutePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <AboutPage />;
}
