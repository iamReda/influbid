/** Application path segments that must never be treated as creator usernames. */
export const RESERVED_PUBLIC_SLUGS = new Set([
	"about",
	"account",
	"admin",
	"api",
	"blog",
	"categories",
	"changelog",
	"complete-your-profile",
	"contact",
	"dashboard",
	"docs",
	"legal",
	"login",
	"my-dashboard",
	"my-profile",
	"my-settings",
	"out",
	"payment-history",
	"rank-higher",
	"rules",
	"settings",
	"signup",
	"success",
	"u",
]);

export function isReservedPublicSlug(slug: string) {
	return RESERVED_PUBLIC_SLUGS.has(slug.trim().toLowerCase());
}
