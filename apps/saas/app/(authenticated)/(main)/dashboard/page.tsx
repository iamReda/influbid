import DashboardPage from "@dashboard/components/dashboard-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard",
};

export default function DashboardRoutePage() {
	return <DashboardPage />;
}
