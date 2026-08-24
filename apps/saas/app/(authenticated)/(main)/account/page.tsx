import { getSession, getUserAccounts } from "@auth/lib/server";
import { config } from "@repo/auth/config";
import { AccountPage } from "@settings/components/account-page";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Account settings",
};

export default async function AccountRoutePage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const userAccounts = await getUserAccounts();
	const userHasPassword =
		config.enablePasswordLogin &&
		userAccounts.some((account) => account.providerId === "credential");

	return <AccountPage userHasPassword={userHasPassword} />;
}
