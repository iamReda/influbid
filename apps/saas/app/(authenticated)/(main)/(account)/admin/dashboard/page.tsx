import { AdminDashboard } from "@admin/component/dashboard/AdminDashboard";
import { PageHeader } from "@shared/components/PageHeader";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: t("admin.dashboard.title"),
	};
}

export default async function AdminDashboardPage() {
	const t = await getTranslations("admin.dashboard");

	return (
		<div>
			<PageHeader title={t("title")} subtitle={t("description")} />
			<AdminDashboard />
		</div>
	);
}
