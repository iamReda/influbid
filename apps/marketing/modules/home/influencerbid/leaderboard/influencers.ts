import type { Platform } from "@home/influencerbid/bid-form/social-platform-icon";

import { formatBidDollars, formatClicks } from "../lib/format";

export const PAGE_SIZE = 40;

export const formatBid = formatBidDollars;
export { formatClicks };

/** In-app public profile page (not an external social URL). */
export const APP_PROFILE_PATH = "/my-profile";

const profileHosts: Record<Platform, string> = {
	instagram: "https://instagram.com",
	tiktok: "https://tiktok.com/@",
	facebook: "https://facebook.com",
	twitch: "https://twitch.tv",
};

const toHandle = (name: string) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "")
		.slice(0, 14);

export const buildPlatformUrl = (name: string, platform: Platform) => {
	const handle = toHandle(name);

	if (platform === "tiktok") {
		return `${profileHosts.tiktok}${handle}`;
	}

	return `${profileHosts[platform]}/${handle}`;
};
