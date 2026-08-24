import CompleteYourProfilePage from "@home/influencerbid/complete-your-profile";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
	title: "Complete your profile",
};

export default async function CompleteYourProfileRoutePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <CompleteYourProfilePage />;
}
