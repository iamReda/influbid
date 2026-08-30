import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should load", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", {
				name: "Claim the #1 spot in the influencer rankings.",
			}),
		).toBeVisible();

		await expect(page.getByRole("navigation")).toBeVisible();
		await expect(page.getByRole("link", { name: /CreatorLand/ }).first()).toBeVisible();
	});
});
