import { AdminInfluencerProfile } from "@admin/component/users/AdminInfluencerProfile";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: t("admin.influencerProfile.title"),
	};
}

export default async function AdminInfluencerProfilePage({
	params,
}: {
	params: Promise<{ userId: string }>;
}) {
	const { userId } = await params;

	return <AdminInfluencerProfile userId={userId} />;
}
