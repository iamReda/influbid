import { slugifyUsernameBase } from "@repo/utils";

const RESERVED_USERNAMES = new Set([
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
	"user",
]);

/** Allocate unique usernames deterministically (mayachen, mayachen2, …). */
export function allocateMockUsernames(publicNames: string[]): string[] {
	const used = new Set<string>();
	const result: string[] = [];

	for (const name of publicNames) {
		const base = slugifyUsernameBase(name);
		let candidate = base;
		let suffix = 2;

		while (used.has(candidate) || RESERVED_USERNAMES.has(candidate) || candidate.length < 3) {
			const padded = String(suffix);
			const trimmedBase = base.slice(0, Math.max(1, 30 - padded.length));
			candidate = `${trimmedBase}${padded}`;
			suffix += 1;
		}

		used.add(candidate);
		result.push(candidate);
	}

	return result;
}

export function mockEmailForUsername(username: string): string {
	return `${username}@example.com`;
}
