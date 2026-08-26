import { MIN_BID_CENTS } from "../money";
import { normalizeSocialUrl } from "../social-url";
import type { Rng } from "./rng";

export type CategoryRef = { id: string; slug: string; name: string };

export type MockCreatorPlan = {
	index: number;
	username: string;
	email: string;
	publicName: string;
	description: string;
	avatarFilename: string;
	categoryId: string;
	categorySlug: string;
	joinedAt: Date;
	isPublished: boolean;
	accountClaimedAt: Date | null;
	bids: MockBidPlan[];
	totalBidCents: number;
	bidReachedAt: Date;
	socials: MockSocialPlan[];
	softDeletedSocial: MockSocialPlan | null;
	viewCount: number;
	clickCount: number;
};

export type MockBidPlan = {
	type: "INITIAL" | "INCREASE";
	status: "PAID" | "FAILED";
	amountCents: number;
	totalAfterCents: number | null;
	createdAt: Date;
	paidAt: Date | null;
	idempotencyKey: string;
};

export type MockSocialPlan = {
	platform: string;
	url: string;
	normalizedUrl: string;
	position: number;
	deletedAt: Date | null;
};

const MARKETING_PLATFORMS = ["instagram", "tiktok", "facebook", "twitch"] as const;
const EXTRA_PLATFORMS = ["youtube", "x", "pinterest"] as const;

const PLATFORM_URL_BUILDERS: Record<string, (username: string) => string> = {
	instagram: (u) => `https://instagram.com/${u}`,
	tiktok: (u) => `https://tiktok.com/@${u}`,
	facebook: (u) => `https://facebook.com/${u}`,
	twitch: (u) => `https://twitch.tv/${u}`,
	youtube: (u) => `https://youtube.com/@${u}`,
	x: (u) => `https://x.com/${u}`,
	pinterest: (u) => `https://pinterest.com/${u}`,
};

/** Uneven but realistic category counts totaling `total`, each ≥ minPerCategory. */
export function distributeCategoryCounts(
	categoryCount: number,
	total: number,
	minPerCategory: number,
	rng: Rng,
): number[] {
	if (categoryCount * minPerCategory > total) {
		throw new Error("Cannot satisfy minPerCategory with given total");
	}

	const counts = Array.from({ length: categoryCount }, () => minPerCategory);
	let remaining = total - categoryCount * minPerCategory;

	// Weighted leftovers so some categories get more creators
	const weights = Array.from({ length: categoryCount }, () => 0.5 + rng.next());
	const weightSum = weights.reduce((a, b) => a + b, 0);

	for (let i = 0; i < categoryCount; i++) {
		const share = Math.floor((remaining * weights[i]!) / weightSum);
		counts[i]! += share;
	}

	let assigned = counts.reduce((a, b) => a + b, 0);
	let cursor = 0;
	while (assigned < total) {
		counts[cursor % categoryCount]! += 1;
		assigned += 1;
		cursor += 1;
	}

	return rng.shuffle(counts);
}

function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Weighted join dates across ~last 6 months with recent buckets for admin filters. */
export function generateJoinedAt(index: number, total: number, now: Date, rng: Rng): Date {
	const dayStart = new Date(now);
	dayStart.setUTCHours(0, 0, 0, 0);

	// Reserve slots so filters are meaningful
	if (index < 3) {
		// Today
		return addMinutes(
			dayStart,
			rng.int(30, Math.max(60, now.getUTCHours() * 60 + now.getUTCMinutes() - 5)),
		);
	}
	if (index < 10) {
		// Last 7 days (not today)
		return addHours(addDays(dayStart, -rng.int(1, 6)), rng.int(8, 22));
	}
	if (index < 25) {
		// Last 30 days (beyond 7)
		return addHours(addDays(dayStart, -rng.int(8, 29)), rng.int(7, 21));
	}

	// Older: 31–180 days ago
	const daysAgo = rng.int(31, 180);
	return addHours(addDays(dayStart, -daysAgo), rng.int(6, 23));
}

const INCREASE_AMOUNT_OPTIONS: number[] = [
	500, 800, 1200, 1500, 2000, 2500, 3500, 4500, 5000, 8000, 10000, 15000, 20000, 25000, 35000,
];

const INITIAL_AMOUNT_OPTIONS: number[] = [
	500, 750, 1200, 1500, 2000, 2500, 3500, 4200, 5000, 6800, 7500, 8500, 10000, 12500, 15000,
];

function pickTargetTotalCents(tier: "low" | "mid" | "high" | "elite", rng: Rng): number {
	if (tier === "elite") {
		return rng.int(500_000, 850_000); // $5k–$8.5k
	}
	if (tier === "high") {
		return rng.int(200_000, 499_000); // $2k–$4.99k
	}
	if (tier === "mid") {
		return rng.int(20_000, 149_900); // $200–$1.5k
	}
	return rng.int(2000, 19_900); // $20–$199
}

function buildBidSchedule(
	username: string,
	joinedAt: Date,
	now: Date,
	tier: "low" | "mid" | "high" | "elite",
	rng: Rng,
): { bids: MockBidPlan[]; totalBidCents: number; bidReachedAt: Date } {
	const target = pickTargetTotalCents(tier, rng);
	const increaseCount =
		tier === "elite"
			? rng.int(3, 5)
			: tier === "high"
				? rng.int(2, 4)
				: tier === "mid"
					? rng.int(1, 3)
					: rng.int(0, 1);

	const paidBids: MockBidPlan[] = [];
	let running = 0;

	const initialAmount = Math.max(MIN_BID_CENTS, Math.min(target, rng.pick(INITIAL_AMOUNT_OPTIONS)));
	running = initialAmount;
	const initialPaidAt = addMinutes(joinedAt, rng.int(1, 15));
	paidBids.push({
		type: "INITIAL",
		status: "PAID",
		amountCents: initialAmount,
		totalAfterCents: running,
		createdAt: joinedAt,
		paidAt: initialPaidAt,
		idempotencyKey: `mock:initial:${username}`,
	});

	const remainingIncreases = Math.max(0, Math.min(increaseCount, 5));
	for (let i = 0; i < remainingIncreases && running < target; i++) {
		const left = target - running;
		let amount = rng.pick(INCREASE_AMOUNT_OPTIONS);
		if (amount > left && left >= MIN_BID_CENTS) {
			amount = Math.max(MIN_BID_CENTS, left - (left % 100));
		}
		if (amount < MIN_BID_CENTS) {
			break;
		}
		if (running + amount > target + 50_000) {
			amount = Math.max(MIN_BID_CENTS, left);
		}

		running += amount;
		const prevPaid = paidBids[paidBids.length - 1]!.paidAt!;
		const spanMs = Math.max(60_000, now.getTime() - prevPaid.getTime());
		const offset = Math.floor(rng.next() * spanMs * 0.85) + 60_000;
		const paidAt = new Date(Math.min(now.getTime() - 60_000, prevPaid.getTime() + offset));
		paidBids.push({
			type: "INCREASE",
			status: "PAID",
			amountCents: amount,
			totalAfterCents: running,
			createdAt: addMinutes(paidAt, -rng.int(1, 10)),
			paidAt,
			idempotencyKey: `mock:increase:${username}:${i + 1}`,
		});
	}

	const lastPaid = paidBids[paidBids.length - 1]!;
	return {
		bids: paidBids,
		totalBidCents: running,
		bidReachedAt: lastPaid.paidAt!,
	};
}

function buildSocials(
	username: string,
	joinedAt: Date,
	rng: Rng,
	withSoftDelete: boolean,
): { socials: MockSocialPlan[]; softDeletedSocial: MockSocialPlan | null } {
	const primary = rng.pick([...MARKETING_PLATFORMS]);
	const extrasPool = rng.shuffle([
		...MARKETING_PLATFORMS.filter((p) => p !== primary),
		...EXTRA_PLATFORMS,
	]);
	const extraCount = rng.int(0, 4);
	const platforms: string[] = [primary, ...extrasPool.slice(0, extraCount)];

	const socials: MockSocialPlan[] = platforms.map((platform, position) => {
		const url = PLATFORM_URL_BUILDERS[platform]!(username);
		return {
			platform,
			url,
			normalizedUrl: normalizeSocialUrl(url),
			position,
			deletedAt: null,
		};
	});

	let softDeletedSocial: MockSocialPlan | null = null;
	if (withSoftDelete) {
		const candidates = [...EXTRA_PLATFORMS, "facebook"].filter((p) => !platforms.includes(p));
		const deletedPlatform = candidates.length > 0 ? rng.pick(candidates) : "facebook";
		const deletedUsername = `${username}legacy`;
		const builder = PLATFORM_URL_BUILDERS[deletedPlatform];
		const url = builder ? builder(deletedUsername) : `https://facebook.com/${deletedUsername}`;
		const rawDeletedAt = addDays(joinedAt, rng.int(7, 60));
		const deletedAt =
			rawDeletedAt.getTime() > Date.now()
				? new Date(Math.max(joinedAt.getTime() + 60_000, Date.now() - 86_400_000))
				: rawDeletedAt;
		softDeletedSocial = {
			platform: deletedPlatform,
			url,
			normalizedUrl: normalizeSocialUrl(url),
			position: 50_000,
			deletedAt,
		};
	}

	return { socials, softDeletedSocial };
}

function analyticsVolume(
	joinedAt: Date,
	now: Date,
	totalBidCents: number,
	rng: Rng,
): { viewCount: number; clickCount: number } {
	const ageDays = Math.max(1, Math.floor((now.getTime() - joinedAt.getTime()) / 86_400_000));
	const bidFactor = Math.min(2.5, 0.6 + totalBidCents / 200_000);

	let viewCount: number;
	if (ageDays <= 7) {
		viewCount = rng.int(40, 180);
	} else if (ageDays <= 30) {
		viewCount = rng.int(120, 350);
	} else if (totalBidCents >= 200_000) {
		viewCount = Math.round(rng.int(400, 800) * bidFactor);
	} else {
		viewCount = Math.round(rng.int(200, 550) * bidFactor);
	}

	viewCount = Math.min(800, Math.max(40, viewCount));
	const clickRatio = 0.12 + rng.next() * 0.22;
	const clickCount = Math.min(250, Math.max(8, Math.round(viewCount * clickRatio)));

	return { viewCount, clickCount };
}

export function buildMockCreatorPlans(options: {
	usernames: string[];
	emails: string[];
	publicNames: string[];
	descriptions: string[];
	avatarFilenames: string[];
	categories: CategoryRef[];
	now: Date;
	rng: Rng;
}): MockCreatorPlan[] {
	const { categories, now, rng } = options;
	const counts = distributeCategoryCounts(categories.length, options.usernames.length, 3, rng);

	const categorySlots: CategoryRef[] = [];
	for (let i = 0; i < categories.length; i++) {
		for (let n = 0; n < counts[i]!; n++) {
			categorySlots.push(categories[i]!);
		}
	}
	const shuffledCategories = rng.shuffle(categorySlots);

	// Tier assignment: a few elites, some high, many mid/low
	const tiers: Array<"low" | "mid" | "high" | "elite"> = options.usernames.map((_, i) => {
		if (i < 3) {
			return "elite";
		}
		if (i < 12) {
			return "high";
		}
		if (i < 55) {
			return "mid";
		}
		return "low";
	});
	const shuffledTiers = rng.shuffle(tiers);

	// Account state: pick unpublished only from categories that still keep ≥3 published
	const indexesByCategory = new Map<string, number[]>();
	for (let i = 0; i < shuffledCategories.length; i++) {
		const slug = shuffledCategories[i]!.slug;
		const list = indexesByCategory.get(slug) ?? [];
		list.push(i);
		indexesByCategory.set(slug, list);
	}
	const unpublishedCandidates: number[] = [];
	for (const indexes of indexesByCategory.values()) {
		if (indexes.length > 3) {
			unpublishedCandidates.push(...indexes.slice(3));
		}
	}
	const unpublishedIndexes = new Set(
		rng.shuffle(unpublishedCandidates).slice(0, Math.min(3, unpublishedCandidates.length)),
	);
	const unclaimedIndexes = new Set(
		rng.shuffle([...Array(100).keys()].filter((i) => !unpublishedIndexes.has(i))).slice(0, 8),
	);
	const softDeleteIndexes = new Set(rng.shuffle([...Array(100).keys()]).slice(0, 5));

	const plans: MockCreatorPlan[] = [];

	for (let i = 0; i < options.usernames.length; i++) {
		const username = options.usernames[i]!;
		const category = shuffledCategories[i]!;
		const joinedAt = generateJoinedAt(i, options.usernames.length, now, rng);
		const tier = shuffledTiers[i]!;
		const { bids, totalBidCents, bidReachedAt } = buildBidSchedule(
			username,
			joinedAt,
			now,
			tier,
			rng,
		);
		const { socials, softDeletedSocial } = buildSocials(
			username,
			joinedAt,
			rng,
			softDeleteIndexes.has(i),
		);
		const { viewCount, clickCount } = analyticsVolume(joinedAt, now, totalBidCents, rng);

		const isPublished = !unpublishedIndexes.has(i);
		const accountClaimedAt = unclaimedIndexes.has(i)
			? null
			: addMinutes(joinedAt, rng.int(20, 24 * 60));

		plans.push({
			index: i,
			username,
			email: options.emails[i]!,
			publicName: options.publicNames[i]!,
			description: options.descriptions[i]!,
			avatarFilename: options.avatarFilenames[i]!,
			categoryId: category.id,
			categorySlug: category.slug,
			joinedAt,
			isPublished,
			accountClaimedAt,
			bids,
			totalBidCents,
			bidReachedAt,
			socials,
			softDeletedSocial,
			viewCount,
			clickCount,
		});
	}

	// Attach a few FAILED increases to random published creators (not affecting totals)
	const failedTargets = rng.shuffle(plans.filter((p) => p.isPublished)).slice(0, 6);
	for (const [fi, plan] of failedTargets.entries()) {
		const afterJoin = addDays(plan.joinedAt, rng.int(1, 20));
		const createdAt = afterJoin.getTime() < now.getTime() ? afterJoin : plan.joinedAt;
		plan.bids.push({
			type: "INCREASE",
			status: "FAILED",
			amountCents: rng.pick([500, 1000, 2500, 5000]),
			totalAfterCents: null,
			createdAt,
			paidAt: null,
			idempotencyKey: `mock:failed:${plan.username}:${fi + 1}`,
		});
	}

	return plans;
}

/** Spread N event timestamps between from and to with mild weekday bias. */
export function distributeEventTimestamps(count: number, from: Date, to: Date, rng: Rng): Date[] {
	if (count <= 0) {
		return [];
	}
	const fromMs = from.getTime();
	const toMs = Math.max(fromMs + 1000, to.getTime());
	const span = toMs - fromMs;
	const stamps: Date[] = [];

	for (let i = 0; i < count; i++) {
		// Slight bias toward recent days
		const t = fromMs + span * (1 - (1 - rng.next()) ** 1.35);
		const date = new Date(t);
		// Weekend dampening: shift some weekend events into weekdays
		const dow = date.getUTCDay();
		if ((dow === 0 || dow === 6) && rng.bool(0.35)) {
			date.setUTCDate(date.getUTCDate() - (dow === 0 ? 2 : 1));
		}
		if (date.getTime() < fromMs) {
			date.setTime(fromMs + rng.int(0, Math.min(span, 3_600_000)));
		}
		if (date.getTime() > toMs) {
			date.setTime(toMs - rng.int(1000, 60_000));
		}
		stamps.push(date);
	}

	return stamps.sort((a, b) => a.getTime() - b.getTime());
}

/** Weighted platform click distribution across social profiles (active + soft-deleted). */
export function distributeClicksAcrossSocials(
	clickCount: number,
	socials: MockSocialPlan[],
	rng: Rng,
): number[] {
	if (socials.length === 0) {
		return [];
	}
	const weights = socials.map((social, index) => {
		const platformBoost =
			social.platform === "instagram"
				? 3.2
				: social.platform === "tiktok"
					? 2.4
					: social.platform === "youtube"
						? 1.6
						: social.platform === "twitch"
							? 1.3
							: social.platform === "facebook"
								? 1.1
								: 0.8;
		const primaryBoost = index === 0 && social.deletedAt === null ? 1.4 : 1;
		const deletedPenalty = social.deletedAt ? 0.45 : 1;
		return (0.4 + rng.next()) * platformBoost * primaryBoost * deletedPenalty;
	});
	const sum = weights.reduce((a, b) => a + b, 0);
	const counts = weights.map((w) => Math.floor((clickCount * w) / sum));
	let assigned = counts.reduce((a, b) => a + b, 0);
	let cursor = 0;
	while (assigned < clickCount) {
		counts[cursor % counts.length]! += 1;
		assigned += 1;
		cursor += 1;
	}
	return counts;
}
