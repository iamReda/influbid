import { getOrganizationList, getSession } from "@auth/lib/server";
import { listPurchases } from "@repo/api/modules/payments/procedures/list-purchases";
import { config as authConfig } from "@repo/auth/config";
import { getCreatorProfileByUserId } from "@repo/database";
import { config as paymentsConfig } from "@repo/payments/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { isAdminRestrictedPath, isPlatformAdmin } from "@shared/lib/admin-routing";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function MainLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const headerStore = await headers();
	const pathname = headerStore.get("x-pathname") ?? "";

	if (isPlatformAdmin(session.user) && isAdminRestrictedPath(pathname)) {
		redirect("/admin/users");
	}

	if (
		authConfig.users.enableOnboarding &&
		!session.user.onboardingComplete &&
		!isPlatformAdmin(session.user)
	) {
		redirect("/onboarding");
	}

	const creatorProfile = await getCreatorProfileByUserId(session.user.id);
	if (
		creatorProfile &&
		creatorProfile.accountClaimedAt === null &&
		!isPlatformAdmin(session.user)
	) {
		redirect("/complete-account");
	}

	const organizations = await getOrganizationList();

	if (authConfig.organizations.enable && authConfig.organizations.requireOrganization) {
		const organization =
			organizations.find((org) => org.id === session?.session.activeOrganizationId) ||
			organizations[0];

		if (!organization) {
			redirect("/new-organization");
		}
	}

	if (paymentsConfig.requireActiveSubscription && !isPlatformAdmin(session.user)) {
		const organizationId = authConfig.organizations.enable
			? session?.session.activeOrganizationId || organizations?.at(0)?.id
			: undefined;

		const purchases = await listPurchases.callable({
			context: { headers: headerStore },
		})({
			organizationId,
		});

		const { activePlan } = createPurchasesHelper(purchases);

		if (!activePlan) {
			redirect("/choose-plan");
		}
	}

	return children;
}
