"use client";

import Button from "@repo/ui/components/influencerbid/button";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Fragment } from "react";

import {
	fetchLeaderboardAction,
	type CategoryOptionDto,
	type LeaderboardItemDto,
} from "../actions";
import CategoryFilters from "../category-filters";
import InfluencerCard, { LeaderboardTopTenDivider } from "./influencer-card";
import { PAGE_SIZE } from "./influencers";

type LeaderboardProps = {
	categories: CategoryOptionDto[];
	items: LeaderboardItemDto[];
	total: number;
	initialCategorySlug?: string;
};

const Leaderboard = ({
	categories,
	items: initialItems,
	total: initialTotal,
	initialCategorySlug = "all",
}: LeaderboardProps) => {
	const router = useRouter();
	const [activeTag, setActiveTag] = useState(initialCategorySlug);
	const [page, setPage] = useState(1);
	const [items, setItems] = useState(initialItems);
	const [total, setTotal] = useState(initialTotal);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setActiveTag(initialCategorySlug);
		setItems(initialItems);
		setTotal(initialTotal);
		setPage(1);
	}, [initialCategorySlug, initialItems, initialTotal]);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);

	const visibleInfluencers = useMemo(() => items, [items]);

	const loadPage = (nextTag: string, nextPage: number) => {
		startTransition(async () => {
			const result = await fetchLeaderboardAction({
				categorySlug: nextTag === "all" ? undefined : nextTag,
				page: nextPage,
				pageSize: PAGE_SIZE,
			});
			setItems(result.items);
			setTotal(result.total);
			setPage(result.page);
		});
	};

	const handleFilterChange = (value: string) => {
		setActiveTag(value);
		setPage(1);
		const url = value === "all" ? "/" : `/?category=${encodeURIComponent(value)}`;
		router.replace(url, { scroll: false });
		loadPage(value, 1);
	};

	return (
		<div className="section mb-28! max-xl:mb-23! max-lg:mb-20! max-md:mb-15!">
			<div className="center">
				<CategoryFilters
					categories={categories}
					activeTag={activeTag}
					onActiveTagChange={handleFilterChange}
				/>

				<div className={isPending ? "opacity-70 transition-opacity" : ""}>
					<div className="gap-5 px-5 py-2 text-hairline font-medium text-t-tertiary md:flex hidden items-center tracking-[0.04em] uppercase">
						<div className="w-11 shrink-0 text-center">#</div>
						<div className="min-w-0 flex-1">Influencer</div>
						<div className="w-80 max-lg:w-72 shrink-0 text-right">Current bid (USD)</div>
					</div>

					<div className="gap-2 max-md:gap-3 flex flex-col">
						{visibleInfluencers.length > 0 ? (
							visibleInfluencers.map((influencer) => (
								<Fragment key={influencer.id}>
									{influencer.rank === 11 && <LeaderboardTopTenDivider />}
									<InfluencerCard item={influencer} rank={influencer.rank} />
								</Fragment>
							))
						) : (
							<p className="bg-b-surface2 p-8 text-body text-t-secondary rounded-4xl text-center">
								No creators in this ranking yet. Be the first to claim a spot.
							</p>
						)}
					</div>
				</div>

				{totalPages > 1 && (
					<div className="mt-8 gap-2 flex flex-wrap items-center justify-center">
						<Button
							className="h-10! px-4!"
							isStroke
							type="button"
							disabled={currentPage <= 1 || isPending}
							onClick={() => loadPage(activeTag, currentPage - 1)}
						>
							Previous
						</Button>
						{Array.from({ length: totalPages }, (_, index) => {
							const pageNumber = index + 1;

							return (
								<Button
									key={pageNumber}
									className="h-10! w-10! px-0!"
									isSecondary={pageNumber === currentPage}
									isStroke={pageNumber !== currentPage}
									type="button"
									disabled={isPending}
									onClick={() => loadPage(activeTag, pageNumber)}
								>
									{pageNumber}
								</Button>
							);
						})}
						<Button
							className="h-10! px-4!"
							isStroke
							type="button"
							disabled={currentPage >= totalPages || isPending}
							onClick={() => loadPage(activeTag, currentPage + 1)}
						>
							Next
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Leaderboard;
