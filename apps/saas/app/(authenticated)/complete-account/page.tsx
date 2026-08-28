import { getSession } from "@auth/lib/server";
import { CompleteAccountForm } from "@creators/components/complete-account/CompleteAccountForm";
import { getCreatorProfileByUserId } from "@repo/database";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations("completeAccount");

	return {
		title: t("title"),
	};
}

export default async function CompleteAccountPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const creator = await getCreatorProfileByUserId(session.user.id);

	if (!creator) {
		redirect("/dashboard");
	}

	if (creator.accountClaimedAt) {
		redirect("/dashboard");
	}

	return (
		<AuthWrapper>
			<CompleteAccountForm />
		</AuthWrapper>
	);
}
