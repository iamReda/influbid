import HomePage from "@home/influencerbid";
import {
	fetchActiveCategoriesAction,
	fetchDefaultBidDollarsAction,
	fetchLeaderboardAction,
	fetchRecentBidsAction,
} from "@home/influencerbid/actions";
import { setRequestLocale } from "next-intl/server";

export default async function Home({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ category?: string | string[] }>;
}) {
	const { locale } = await params;
	const resolvedSearchParams = await searchParams;
	setRequestLocale(locale);

	const categoryParam = resolvedSearchParams.category;
	const categorySlug = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
	const initialCategorySlug = categorySlug?.trim() || "all";

	const [categories, defaultBidDollars, leaderboard, recentBids] = await Promise.all([
		fetchActiveCategoriesAction(),
		fetchDefaultBidDollarsAction(),
		fetchLeaderboardAction({
			categorySlug: initialCategorySlug === "all" ? undefined : initialCategorySlug,
			page: 1,
			pageSize: 40,
		}),
		fetchRecentBidsAction(),
	]);

	return (
		<HomePage
			categories={categories}
			defaultBidDollars={defaultBidDollars}
			leaderboard={leaderboard.items}
			leaderboardTotal={leaderboard.total}
			recentBids={recentBids}
			initialCategorySlug={initialCategorySlug}
		/>
	);
}
