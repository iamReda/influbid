import type { Platform } from "@home/influencerbid/bid-form/social-platform-icon";

import { formatBidDollars, formatClicks } from "../lib/format";

export const PAGE_SIZE = 40;

export const formatBid = formatBidDollars;
export { formatClicks };

/** In-app public profile page (not an external social URL). */
export const APP_PROFILE_PATH = "/my-profile";

const profileHosts: Partial<Record<Platform, string>> = {
	instagram: "https://instagram.com",
	tiktok: "https://tiktok.com/@",
	facebook: "https://facebook.com",
	twitch: "https://twitch.tv",
	youtube: "https://youtube.com/@",
	x: "https://x.com",
	linkedin: "https://linkedin.com/in",
	snapchat: "https://snapchat.com/add",
	pinterest: "https://pinterest.com",
	threads: "https://threads.net/@",
	kick: "https://kick.com",
	discord: "https://discord.com/users",
	reddit: "https://reddit.com/user",
	telegram: "https://t.me",
};

const toHandle = (name: string) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "")
		.slice(0, 14);

export const buildPlatformUrl = (name: string, platform: Platform) => {
	const handle = toHandle(name);
	const base = profileHosts[platform] ?? "https://example.com";

	if (platform === "tiktok" || platform === "youtube" || platform === "threads") {
		return `${base}${handle}`;
	}

	return `${base}/${handle}`;
};
