import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({
	createCreatorCategory: vi.fn(),
	deleteCreatorCategory: vi.fn(),
	listAllCreatorCategories: vi.fn(),
	reorderCreatorCategories: vi.fn(),
	updateCreatorCategory: vi.fn(),
}));

vi.mock("@repo/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@repo/database", () => databaseMocks);

import { auth } from "@repo/auth";

import { listCategories } from "./categories";

describe("listCategories", () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin", name: "Admin", email: "admin@admin.com" },
			session: { id: "session-1", userId: "admin-1" },
		} as never);
		databaseMocks.listAllCreatorCategories.mockResolvedValue([
			{
				id: "category-1",
				name: "Fashion",
				slug: "fashion",
				description: null,
				icon: null,
				color: null,
				active: true,
				order: 0,
				_count: { creators: 2, pendingCreators: 1 },
			},
		]);
	});

	it("returns categories for admin", async () => {
		const result = await call(listCategories, undefined, {
			context: { headers: new Headers() },
		});

		expect(result.categories).toEqual([
			expect.objectContaining({
				name: "Fashion",
				slug: "fashion",
				creatorsCount: 2,
				pendingCreatorsCount: 1,
			}),
		]);
	});
});
