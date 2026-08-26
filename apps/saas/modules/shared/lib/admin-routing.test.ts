import { describe, expect, it } from "vitest";

import { getPostAuthRedirectPath, isAdminRestrictedPath, isPlatformAdmin } from "./admin-routing";

describe("isPlatformAdmin", () => {
	it("returns true only for admin role", () => {
		expect(isPlatformAdmin({ role: "admin" })).toBe(true);
		expect(isPlatformAdmin({ role: "user" })).toBe(false);
		expect(isPlatformAdmin(null)).toBe(false);
	});
});

describe("getPostAuthRedirectPath", () => {
	it("sends admins to /admin/dashboard by default", () => {
		expect(getPostAuthRedirectPath({ role: "admin" }, null, "/dashboard")).toBe("/admin/dashboard");
	});

	it("keeps safe admin redirect targets for admins", () => {
		expect(getPostAuthRedirectPath({ role: "admin" }, "/admin/categories")).toBe(
			"/admin/categories",
		);
	});

	it("ignores non-admin redirect targets for admins", () => {
		expect(getPostAuthRedirectPath({ role: "admin" }, "/dashboard")).toBe("/admin/dashboard");
	});

	it("uses the normal fallback for creators", () => {
		expect(getPostAuthRedirectPath({ role: "user" }, null, "/dashboard")).toBe("/dashboard");
	});
});

describe("isAdminRestrictedPath", () => {
	it("blocks creator product routes", () => {
		expect(isAdminRestrictedPath("/dashboard")).toBe(true);
		expect(isAdminRestrictedPath("/payment-history")).toBe(true);
		expect(isAdminRestrictedPath("/rank-higher")).toBe(true);
		expect(isAdminRestrictedPath("/chatbot")).toBe(true);
		expect(isAdminRestrictedPath("/u/jane/edit")).toBe(true);
	});

	it("allows admin and settings routes", () => {
		expect(isAdminRestrictedPath("/admin/dashboard")).toBe(false);
		expect(isAdminRestrictedPath("/admin/leaderboard")).toBe(false);
		expect(isAdminRestrictedPath("/admin/users")).toBe(false);
		expect(isAdminRestrictedPath("/admin/categories")).toBe(false);
		expect(isAdminRestrictedPath("/admin/payment-history")).toBe(false);
		expect(isAdminRestrictedPath("/settings/general")).toBe(false);
	});
});
