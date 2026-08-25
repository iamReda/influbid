import { SessionProvider } from "@auth/components/SessionProvider";
import { sessionQueryKey } from "@auth/lib/api";
import { getOrganizationList, getSession } from "@auth/lib/server";
import { ActiveOrganizationProvider } from "@organizations/components/ActiveOrganizationProvider";
import { organizationListQueryKey } from "@organizations/lib/api";
import { listPurchases } from "@payments/lib/server";
import { config as authConfig } from "@repo/auth/config";
import {
	ensureUserUsername,
	getCreatorProfileByUserId,
	getOrganizationMembership,
	markCreatorAccountClaimed,
} from "@repo/database";
import { config as paymentsConfig } from "@repo/payments/config";
import { ConfirmationAlertProvider } from "@shared/components/ConfirmationAlertProvider";
import { PermixProvider } from "@shared/components/PermixProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { setupPermissions, permix } from "@shared/lib/permix";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthenticatedLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	let sessionUser = session.user;

	if (!sessionUser.username) {
		const updated = await ensureUserUsername(sessionUser.id, sessionUser.name ?? "user");
		if (updated?.username) {
			sessionUser = { ...sessionUser, username: updated.username };
		}
	}

	const creatorProfile = await getCreatorProfileByUserId(sessionUser.id);
	if (creatorProfile && creatorProfile.accountClaimedAt === null) {
		await markCreatorAccountClaimed(creatorProfile.id);
	}

	let membershipRole: string | null = null;

	if (session.session.activeOrganizationId) {
		const membership = await getOrganizationMembership(
			session.session.activeOrganizationId,
			sessionUser.id,
		);
		membershipRole = membership?.role ?? null;
	}

	setupPermissions({
		user: sessionUser,
		membershipRole,
	});

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => ({
			...session,
			user: sessionUser,
		}),
	});

	if (authConfig.organizations.enable) {
		await queryClient.prefetchQuery({
			queryKey: organizationListQueryKey,
			queryFn: getOrganizationList,
		});
	}

	if (paymentsConfig.billingAttachedTo === "user") {
		await queryClient.prefetchQuery({
			queryKey: orpc.payments.listPurchases.queryKey({
				input: {},
			}),
			queryFn: () => listPurchases(),
		});
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SessionProvider>
				<PermixProvider state={permix.dehydrate()}>
					<ActiveOrganizationProvider>
						<ConfirmationAlertProvider>{children}</ConfirmationAlertProvider>
					</ActiveOrganizationProvider>
				</PermixProvider>
			</SessionProvider>
		</HydrationBoundary>
	);
}
