import { formatBidDollars } from "../lib/format";

export type RecentBid = {
	id: string;
	rank: number;
	name: string;
	avatar: string;
	bid: number;
	bidAgo: string;
	profileUrl: string;
};

export const RECENT_BIDS_VISIBLE_ROWS = 4;

/** Paid initial signups shown in the homepage recent-bids scroller. */
export const RECENT_SIGNUPS_WINDOW_HOURS = 7 * 24;

export const formatBid = formatBidDollars;
