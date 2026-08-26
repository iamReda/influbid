import { AdminLeaderboardList } from "@admin/component/leaderboard/AdminLeaderboardList";
import { PageHeader } from "@shared/components/PageHeader";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: t("admin.leaderboard.title"),
	};
}

export default async function AdminLeaderboardPage() {
	const t = await getTranslations("admin.leaderboard");

	return (
		<div>
			<PageHeader title={t("title")} subtitle={t("description")} />
			<AdminLeaderboardList />
		</div>
	);
}
