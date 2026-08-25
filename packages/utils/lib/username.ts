/**
 * Build a URL slug from a public display name.
 * Lowercase letters/digits only — spaces and punctuation are removed
 * (e.g. "Julien Dupont" → "juliendupont").
 */
export function slugifyUsernameBase(name: string): string {
	const slug = name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "")
		.slice(0, 30);

	return slug || "user";
}

/** Append a random 5-digit suffix when the base username is already taken. */
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
