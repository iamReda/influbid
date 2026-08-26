import { AdminPaymentHistoryList } from "@admin/component/payments/AdminPaymentHistoryList";
import { PageHeader } from "@shared/components/PageHeader";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: t("admin.paymentHistory.title"),
	};
}

export default async function AdminPaymentHistoryPage() {
	const t = await getTranslations("admin.paymentHistory");

	return (
		<div>
			<PageHeader title={t("title")} subtitle={t("description")} />
			<AdminPaymentHistoryList />
		</div>
	);
}
