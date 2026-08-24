import type { AuthConfig } from "./types";

export const config = {
	enableSignup: false,
	enableMagicLink: false,
	enableSocialLogin: false,
	enablePasskeys: false,
	enablePasswordLogin: true,
	enableTwoFactor: true,
	sessionCookieMaxAge: 60 * 60 * 24 * 30,
	users: {
		enableOnboarding: true,
	},
	organizations: {
		enable: false,
		hideOrganization: true,
		enableUsersToCreateOrganizations: false,
		requireOrganization: false,
		forbiddenOrganizationSlugs: [
			"new-organization",
			"admin",
			"settings",
			"ai-demo",
			"organization-invitation",
			"chatbot",
			"dashboard",
			"my-dashboard",
			"rank-higher",
			"increase-bid",
			"payment-history",
			"profile",
			"my-profile",
			"my-settings",
			"account",
			"manage-plan",
		],
	},
} as const satisfies AuthConfig;
