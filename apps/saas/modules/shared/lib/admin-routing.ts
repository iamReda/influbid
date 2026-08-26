import { getSafeRedirectPath, normalizeInternalPath } from "./redirect";

const ADMIN_HOME = "/admin/dashboard";

/** Authenticated product routes reserved for creators (not platform admins). */
const ADMIN_RESTRICTED_PREFIXES = [
	"/dashboard",
	"/payment-history",
	"/rank-higher",
	"/my-profile",
	"/my-settings",
	"/account",
	"/chatbot",
	"/success",
	"/choose-plan",
	"/new-organization",
] as const;

export function isPlatformAdmin(user: { role?: string | null } | null | undefined): boolean {
	return user?.role === "admin";
}

export function getPostAuthRedirectPath(
	user: { role?: string | null } | null | undefined,
	redirectTo?: string | null,
	fallback = "/dashboard",
): string {
	if (isPlatformAdmin(user)) {
		const safe = normalizeInternalPath(redirectTo);
		if (safe?.startsWith("/admin")) {
			return safe;
		}
		return ADMIN_HOME;
	}

	return getSafeRedirectPath(redirectTo, fallback);
}

export function isAdminRestrictedPath(pathname: string): boolean {
	const path = pathname.split("?")[0] ?? pathname;

	if (path.startsWith("/admin") || path.startsWith("/settings") || path.startsWith("/onboarding")) {
		return false;
	}

	if (
		ADMIN_RESTRICTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
	) {
		return true;
	}

	// Profile edit routes: /u/:username/edit or rewritten /:username/edit
	if (/^\/u\/[^/]+\/edit\/?$/.test(path) || /^\/[^/]+\/edit\/?$/.test(path)) {
		return true;
	}

	return false;
}
