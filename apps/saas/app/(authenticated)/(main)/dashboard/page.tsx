import DashboardPage from "@dashboard/components/dashboard-page";
import { getMyAnalytics, getMyCreator } from "@repo/api/modules/creators/procedures/me";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
	title: "Dashboard",
};

export default async function DashboardRoutePage() {
	const headerStore = await headers();
	const queryClient = getServerQueryClient();
	const callContext = { context: { headers: headerStore } };

	const [creator, analytics] = await Promise.all([
		getMyCreator.callable(callContext)(),
		getMyAnalytics.callable(callContext)({ period: "all" }),
	]);

	await Promise.all([
		queryClient.prefetchQuery({
			queryKey: orpc.creators.getMyCreator.queryKey(),
			queryFn: () => creator,
		}),
		queryClient.prefetchQuery({
			queryKey: orpc.creators.getMyAnalytics.queryKey({
				input: { period: "all" },
			}),
			queryFn: () => analytics,
		}),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<DashboardPage />
		</HydrationBoundary>
	);
}
