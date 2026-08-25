/**
 * Resolve a stored avatar path to a browser-usable URL.
 * Storage paths are served same-origin via `/image-proxy/...` so Next.js Image
 * does not hit localhost SSRF blocks when optimizing cross-origin SaaS URLs.
 */
export function getPublicAvatarUrl(pathOrUrl: string | null | undefined): string {
	if (!pathOrUrl) {
		return "";
	}

	if (
		pathOrUrl.startsWith("http://") ||
		pathOrUrl.startsWith("https://") ||
		pathOrUrl.startsWith("/images/") ||
		pathOrUrl.startsWith("/image-proxy/") ||
		pathOrUrl.startsWith("blob:")
	) {
		return pathOrUrl;
	}

	const normalized = pathOrUrl.replace(/^\/+/, "");
	const withoutBucket = normalized.startsWith("avatars/")
		? normalized.slice("avatars/".length)
		: normalized;

	return `/image-proxy/avatars/${encodeURIComponent(withoutBucket)}`;
}

export function formatRelativeJoinedAt(joinedAt: Date | string): string {
	const date = typeof joinedAt === "string" ? new Date(joinedAt) : joinedAt;
	const diffMs = Date.now() - date.getTime();
	const minutes = Math.max(0, Math.floor(diffMs / 60_000));

	if (minutes < 60) {
		return `${Math.max(1, minutes)}m ago`;
	}

	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}

	const days = Math.floor(hours / 24);
	if (days < 7) {
		return `${days}d ago`;
	}

	const weeks = Math.floor(days / 7);
	return `${weeks}w ago`;
}

export const formatBidDollars = (dollars: number) => `$${dollars.toLocaleString("en-US")}`;

export const formatBidCents = (cents: number) => formatBidDollars(Math.round(cents / 100));

export const formatClicks = (clicks: number) => clicks.toLocaleString("en-US");

export const formatInfluencerCount = (count: number) =>
	`${count.toLocaleString()} influencer${count === 1 ? "" : "s"}`;
