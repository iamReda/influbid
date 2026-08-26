import { OrganizationList } from "@admin/component/organizations/OrganizationList";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("admin.organizations");

	return {
		title: t("title"),
	};
}

export default async function AdminOrganizationsPage() {
	const t = await getTranslations("admin.organizations");

	return (
		<div>
			<PageHeader title={t("title")} />
			<OrganizationList />
		</div>
	);
}
