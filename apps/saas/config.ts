import type { SaasConfig } from "./types";

export const config = {
	appName: "supastarter for Next.js Demo",
	docsUrl: process.env.NEXT_PUBLIC_DOCS_URL as string | undefined,
	marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL as string | undefined,
	enabledThemes: ["light", "dark"],
	defaultTheme: "light",
	redirectAfterSignIn: "/dashboard",
	redirectAfterLogout: process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3001",
} as const satisfies SaasConfig;
