/**
 * Build a URL slug from a public display name.
 * Spaces and other non-alphanumeric characters become hyphens.
 */
export function slugifyUsernameBase(name: string): string {
	const slug = name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 30);

	return slug || "user";
}

export function withUsernameSuffix(base: string): string {
	const suffix = String(Math.floor(10_000 + Math.random() * 90_000));
	const trimmedBase = base.slice(0, Math.max(1, 30 - suffix.length - 1));
	return `${trimmedBase}-${suffix}`;
}

export function isValidUsernameFormat(username: string): boolean {
	return (
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(username) && username.length >= 3 && username.length <= 36
	);
}
