import { call, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@repo/database", () => ({
	getAdminDashboardSnapshot: vi.fn(),
}));

import { auth } from "@repo/auth";
import { getAdminDashboardSnapshot } from "@repo/database";

import { getDashboard } from "./get-dashboard";

describe("getDashboard", () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin", name: "Admin", email: "admin@admin.com" },
			session: { id: "session-1", userId: "admin-1" },
		} as never);
		vi.mocked(getAdminDashboardSnapshot).mockResolvedValue({
			range: "30d",
			overview: {
				totalCreators: 2,
				totalBidRevenueCents: 5000,
				bidTransactions: 2,
				averageBidCents: 2500,
				newCreators: 1,
				profileViews: 10,
				socialClicks: 2,
				socialCtrPercent: 20,
			},
			revenueSeries: [{ date: "2026-08-01", revenueCents: 5000, transactions: 2 }],
			activitySeries: [{ date: "2026-08-01", profileViews: 10, socialClicks: 2 }],
			latestBids: [],
			categoryPerformance: [],
			topCreators: [],
		});
	});

	it("returns the dashboard snapshot for admins", async () => {
		const result = await call(
			getDashboard,
			{ range: "30d" },
			{
				context: { headers: new Headers() },
			},
		);

		expect(getAdminDashboardSnapshot).toHaveBeenCalledWith("30d");
		expect(result.overview.totalCreators).toBe(2);
		expect(result.range).toBe("30d");
	});

	it("rejects non-admin users", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user-1", role: "user", name: "User", email: "user@example.com" },
			session: { id: "session-2", userId: "user-1" },
		} as never);

		await expect(
			call(getDashboard, { range: "7d" }, { context: { headers: new Headers() } }),
		).rejects.toBeInstanceOf(ORPCError);
	});
});
