import { call, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

import { auth } from "@repo/auth";

import { listCategories } from "./categories";

describe("listCategories", () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin", name: "Admin", email: "admin@admin.com" },
			session: { id: "session-1", userId: "admin-1" },
		} as never);
	});

	it("returns categories for admin", async () => {
		try {
			const result = await call(listCategories, undefined, {
				context: { headers: new Headers() },
			});
			expect(result.categories.length).toBeGreaterThan(0);
			expect(result.categories[0]).toMatchObject({
				name: expect.any(String),
				slug: expect.any(String),
			});
		} catch (error) {
			if (error instanceof ORPCError) {
				console.error("ORPCError", error.code, error.message, error.data, error.cause);
			}
			throw error;
		}
	});
});
