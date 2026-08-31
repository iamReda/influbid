import type { Platform } from "../bid-form/social-platform-icon";

export const SOCIAL_PLATFORMS: Platform[] = [
	"tiktok",
	"instagram",
	"youtube",
	"x",
	"facebook",
	"twitch",
	"linkedin",
	"snapchat",
	"pinterest",
	"threads",
	"kick",
	"discord",
	"reddit",
	"telegram",
];

const platformSet = new Set<string>(SOCIAL_PLATFORMS);

function detectSocialPlatform(value: string): string | null {
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

export function detectPlatform(value: string): Platform | null {
	const platform = detectSocialPlatform(value.trim());

	if (platform && platformSet.has(platform)) {
		return platform as Platform;
	}

	return null;
}

/** Accepts URLs with or without protocol/www; returns https URL for storage. */
export function toHttpsSocialUrl(value: string): string | null {
	const trimmed = value.trim();

	if (!trimmed) {
		return null;
	}

	try {
		const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);

		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}

		url.protocol = "https:";

		return url.toString();
	} catch {
		return null;
	}
}
