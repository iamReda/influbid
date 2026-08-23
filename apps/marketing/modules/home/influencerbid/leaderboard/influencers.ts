import type { Platform } from "@home/influencerbid/bid-form/social-platform-icon";

export type LeaderboardInfluencer = {
	id: string;
	rank: number;
	name: string;
	avatar: string;
	description: string;
	categorySlug: string;
	categoryName: string;
	platforms: Platform[];
	profileUrl: string;
	bid: number;
	addedAgo: string;
	clicks: number;
	verified?: boolean;
};

const avatars = [
	"/images/avatar-1.png",
	"/images/avatar-2.png",
	"/images/avatar-3.png",
	"/images/avatar-4.png",
	"/images/avatar-5.png",
	"/images/avatar.png",
];

const names = [
	"Maya Chen",
	"Alex Carter",
	"Sofia Rivera",
	"Jordan Blake",
	"Lina Park",
	"Noah Ellis",
	"Ava Thompson",
	"Marcus Reed",
	"Elena Vos",
	"Kai Nakamura",
	"Isla Bennett",
	"Omar Hassan",
	"Chloe Martin",
	"Diego Alvarez",
	"Nora Quinn",
	"Leo Andersson",
	"Priya Shah",
	"Ethan Brooks",
	"Amelia Ford",
	"Ryan Cole",
];

const descriptions = [
	"Fashion & lifestyle creator sharing daily fits and city finds.",
	"Beauty reviews, routines, and product drops you actually need.",
	"Competitive gaming streams and weekly tournament highlights.",
	"Strength training tips, mobility work, and meal prep ideas.",
	"Travel diaries from hidden spots and weekend getaways.",
	"Gadgets, apps, and honest tech breakdowns for creators.",
	"Home cooking, restaurant finds, and quick weeknight recipes.",
	"Everyday lifestyle moments with a focus on wellness.",
	"Founder stories, growth tactics, and creator business tips.",
	"Original tracks, studio sessions, and live set recaps.",
];

const categories = [
	{ slug: "fashion", name: "Fashion" },
	{ slug: "beauty-cosmetics", name: "Beauty & Cosmetics" },
	{ slug: "gaming", name: "Gaming" },
	{ slug: "fitness", name: "Fitness" },
	{ slug: "travel", name: "Travel" },
	{ slug: "tech", name: "Tech" },
	{ slug: "food", name: "Food" },
	{ slug: "lifestyle", name: "Lifestyle" },
	{ slug: "business", name: "Business" },
	{ slug: "music", name: "Music" },
];

const platformSets: Platform[][] = [
	["instagram"],
	["tiktok"],
	["instagram", "tiktok"],
	["facebook", "instagram"],
	["twitch", "tiktok"],
	["instagram", "facebook", "tiktok"],
	["twitch"],
	["tiktok", "facebook"],
];

const addedOptions = [
	"3m ago",
	"12m ago",
	"1h ago",
	"3h ago",
	"1d ago",
	"2d ago",
	"5d ago",
	"1w ago",
];

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

/** In-app public profile page (not an external social URL). */
export const APP_PROFILE_PATH = "/my-profile?preview=1";

export const buildPlatformUrl = (name: string, platform: Platform) => {
	const handle = toHandle(name);

	if (platform === "tiktok") {
		return `${profileHosts.tiktok}${handle}`;
	}

	return `${profileHosts[platform]}/${handle}`;
};

export const leaderboardInfluencers: LeaderboardInfluencer[] = Array.from(
	{ length: 52 },
	(_, index) => {
		const rank = index + 1;
		const name = names[index % names.length];
		const category = categories[index % categories.length];
		const platforms = platformSets[index % platformSets.length];
		const baseBid = 4200 - index * 67;

		return {
			id: `influencer-${rank}`,
			rank,
			name: index < names.length ? name : `${name} ${Math.floor(index / names.length) + 1}`,
			avatar: avatars[index % avatars.length],
			description: descriptions[index % descriptions.length],
			categorySlug: category.slug,
			categoryName: category.name,
			platforms,
			profileUrl: APP_PROFILE_PATH,
			bid: Math.max(3, baseBid),
			addedAgo: addedOptions[index % addedOptions.length],
			clicks: 12800 - index * 187,
			verified: index % 3 !== 2,
		};
	},
);

export const PAGE_SIZE = 40;

export const formatBid = (bid: number) => `$${bid.toLocaleString("en-US")}`;

export const formatClicks = (clicks: number) => clicks.toLocaleString("en-US");
