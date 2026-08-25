import { expect, test } from "@playwright/test";

test.describe("payment success page", () => {
	test("shows the signup email and access instructions", async ({ page }) => {
		await page.goto("/success?email=creator%40example.com");

		await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
		await expect(
			page.getByText(
				"Your profile is now live. Check your inbox at creator@example.com and click the secure link we sent you to access your dashboard.",
			),
		).toBeVisible();
	});
});
