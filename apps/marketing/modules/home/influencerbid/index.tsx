"use client";

import Layout from "@shared/components/influencerbid/layout";

import type { CategoryOptionDto, LeaderboardItemDto } from "./actions";
import Infos from "./infos";
import Leaderboard from "./leaderboard";
import type { RecentBid } from "./recent-bids/recent-bids";
import Start from "./start";

type HomePageProps = {
	categories: CategoryOptionDto[];
	defaultBidDollars: number;
	leaderboard: LeaderboardItemDto[];
	leaderboardTotal: number;
	recentBids: RecentBid[];
	initialCategorySlug?: string;
};

const HomePage = ({
	categories,
	defaultBidDollars,
	leaderboard,
	leaderboardTotal,
	recentBids,
	initialCategorySlug = "all",
}: HomePageProps) => {
	return (
		<Layout>
			<Start categories={categories} defaultBidDollars={defaultBidDollars} />
			<Leaderboard
				categories={categories}
				items={leaderboard}
				total={leaderboardTotal}
				initialCategorySlug={initialCategorySlug}
			/>
			<Infos recentBids={recentBids} />
		</Layout>
	);
};

export default HomePage;
