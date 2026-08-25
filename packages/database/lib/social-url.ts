/**
 * Normalize a social profile URL for duplicate detection.
 * Strips protocol, www, trailing slashes, and lowercases host+path.
 */
export function normalizeSocialUrl(rawUrl: string): string {
	const trimmed = rawUrl.trim();
	let url: URL;

	try {
		url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
	} catch {
		return trimmed.toLowerCase().replace(/\/+$/, "");
	}

	const host = url.hostname.replace(/^www\./i, "").toLowerCase();
	const path = url.pathname.replace(/\/+$/, "").toLowerCase();
	const search = url.search.toLowerCase();

	return `${host}${path}${search}`;
}

export function detectSocialPlatform(value: string): string | null {
	const url = value.toLowerCase();

	if (url.includes("tiktok.com")) {
		return "tiktok";
	}
	if (url.includes("instagram.com")) {
		return "instagram";
	}
	if (url.includes("facebook.com") || url.includes("fb.com") || url.includes("fb.me")) {
		return "facebook";
	}
	if (url.includes("twitch.tv")) {
		return "twitch";
	}
	if (url.includes("youtube.com") || url.includes("youtu.be")) {
		return "youtube";
	}
	if (url.includes("twitter.com") || url.includes("x.com")) {
		return "x";
	}
	if (url.includes("linkedin.com")) {
		return "linkedin";
	}
	if (url.includes("snapchat.com")) {
		return "snapchat";
	}
	if (url.includes("pinterest.com") || url.includes("pin.it")) {
		return "pinterest";
	}
	if (url.includes("threads.net")) {
		return "threads";
	}
	if (url.includes("kick.com")) {
		return "kick";
	}
	if (url.includes("discord.com") || url.includes("discord.gg")) {
		return "discord";
	}
	if (url.includes("reddit.com")) {
		return "reddit";
	}
	if (url.includes("t.me") || url.includes("telegram.me") || url.includes("telegram.org")) {
		return "telegram";
	}

	return null;
}

export type PendingSocialProfileInput = {
	platform: string;
	url: string;
	position: number;
};

export function parsePendingSocialProfiles(value: unknown): PendingSocialProfileInput[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item, index) => {
		if (!item || typeof item !== "object") {
			return [];
		}

		const record = item as Record<string, unknown>;
		const url = typeof record.url === "string" ? record.url.trim() : "";
		if (!url) {
			return [];
		}

		const platform =
			typeof record.platform === "string" && record.platform
				? record.platform
				: (detectSocialPlatform(url) ?? "other");
		const position =
			typeof record.position === "number" && Number.isFinite(record.position)
				? record.position
				: index;

		return [{ platform, url, position }];
	});
}
