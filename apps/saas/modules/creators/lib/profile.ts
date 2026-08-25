import { config as storageConfig } from "@repo/storage/config";
import type { Platform } from "@shared/components/social-platform-icon";

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

export const platformLabels: Record<Platform, string> = {
	tiktok: "TikTok",
	instagram: "Instagram",
	facebook: "Facebook",
	twitch: "Twitch",
	youtube: "YouTube",
	x: "X",
	linkedin: "LinkedIn",
	snapchat: "Snapchat",
	pinterest: "Pinterest",
	threads: "Threads",
	kick: "Kick",
	discord: "Discord",
	reddit: "Reddit",
	telegram: "Telegram",
};

export const MAX_SOCIAL_LINKS = 10;
export const MIN_SOCIAL_LINKS = 1;

export function detectPlatform(value: string): Platform | null {
	const url = value.toLowerCase();

	if (url.includes("tiktok.com")) {
		return "tiktok";
	}

	if (url.includes("instagram.com")) {
		return "instagram";
	}

	if (url.includes("youtube.com") || url.includes("youtu.be")) {
		return "youtube";
	}

	if (url.includes("twitter.com") || url.includes("x.com")) {
		return "x";
	}

	if (url.includes("facebook.com") || url.includes("fb.com") || url.includes("fb.me")) {
		return "facebook";
	}

	if (url.includes("twitch.tv")) {
		return "twitch";
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

export function getAvatarSrc(image: string | null | undefined) {
	if (!image) {
		return null;
	}

	if (image.startsWith("http") || image.startsWith("/")) {
		return image;
	}

	return `/image-proxy/${storageConfig.bucketNames.avatars}/${image}`;
}

export function getInitials(name: string) {
	return name
		.split(" ")
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}
