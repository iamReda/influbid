import { expect, test } from "@playwright/test";

test.describe("login page", () => {
	test("should load email/password sign-in with Influbid design", async ({ page }) => {
		await page.goto("/login");

		await expect(page.getByText("Sign in to Influbid")).toBeVisible();
		await expect(page.getByPlaceholder("Enter email")).toBeVisible();
		await expect(page.getByPlaceholder("Enter password")).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Reset it" })).toBeVisible();
		await expect(page.getByText(/Want to sign up/i)).toBeVisible();

		// Public signup / social / passkey entry points stay hidden
		await expect(page.getByRole("button", { name: /passkey/i })).toHaveCount(0);
		await expect(page.getByRole("link", { name: /Create an account/i })).toHaveCount(0);
		await expect(page.getByRole("tab", { name: "Magic link" })).toHaveCount(0);
	});

	test("should navigate to forgot password", async ({ page }) => {
		await page.goto("/login");
		await page.getByRole("link", { name: "Reset it" }).click();
		await expect(page).toHaveURL(/\/forgot-password/);
		await expect(page.getByText("Reset password")).toBeVisible();
		await expect(page.getByRole("button", { name: "Reset password" })).toBeVisible();
	});
});
