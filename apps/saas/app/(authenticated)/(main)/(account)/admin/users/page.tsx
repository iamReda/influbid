import { UserList } from "@admin/component/users/UserList";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("admin.users");

	return {
		title: t("title"),
	};
}

export default async function AdminUserPage() {
	const t = await getTranslations("admin.users");

	return (
		<div>
			<PageHeader title={t("title")} subtitle={t("description")} />
			<UserList />
		</div>
	);
}
