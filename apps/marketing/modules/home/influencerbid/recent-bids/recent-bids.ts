import {
	formatBid,
	leaderboardInfluencers,
	type LeaderboardInfluencer,
} from "../leaderboard/influencers";

export type RecentBid = {
	id: string;
	rank: number;
	name: string;
	avatar: string;
	bid: number;
	bidAgo: string;
	profileUrl: string;
};

const recentTimeOptions = [
	"1 hour ago",
	"17 hours ago",
	"20 hours ago",
	"22 hours ago",
	"1 day ago",
	"1 day ago",
	"2 days ago",
	"3 days ago",
	"4 days ago",
	"5 days ago",
];

const recentRankOrder = [1, 15, 16, 18, 8, 24, 6, 12, 3, 9, 21, 4, 11, 7, 19, 2, 14, 5, 10, 13];

const pickInfluencer = (rank: number): LeaderboardInfluencer =>
	leaderboardInfluencers.find((item) => item.rank === rank) ?? leaderboardInfluencers[0];

export const recentBids: RecentBid[] = recentRankOrder.map((rank, index) => {
	const influencer = pickInfluencer(rank);

	return {
		id: `recent-bid-${rank}-${index}`,
		rank,
		name: influencer.name,
		avatar: influencer.avatar,
		bid: influencer.bid,
		bidAgo: recentTimeOptions[index % recentTimeOptions.length],
		profileUrl: influencer.profileUrl,
	};
});

export const RECENT_BIDS_VISIBLE_ROWS = 4;

export { formatBid };
