"use client";

import Button from "@repo/ui/components/influencerbid/button";
import { useMemo, useState } from "react";

import CategoryFilters from "../category-filters";
import InfluencerCard from "./influencer-card";
import { PAGE_SIZE, leaderboardInfluencers } from "./influencers";

const Leaderboard = () => {
	const [activeTag, setActiveTag] = useState("all");
	const [page, setPage] = useState(1);

	const filteredInfluencers = useMemo(() => {
		if (activeTag === "all") {
			return leaderboardInfluencers;
		}

		return leaderboardInfluencers.filter((influencer) => influencer.categorySlug === activeTag);
	}, [activeTag]);

	const totalPages = Math.max(1, Math.ceil(filteredInfluencers.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const pageStart = (currentPage - 1) * PAGE_SIZE;
	const visibleInfluencers = filteredInfluencers.slice(pageStart, pageStart + PAGE_SIZE);

	const handleFilterChange = (value: string) => {
		setActiveTag(value);
		setPage(1);
	};

	return (
		<div className="section mb-28! max-xl:mb-23! max-lg:mb-20! max-md:mb-15!">
			<div className="center">
				<CategoryFilters activeTag={activeTag} onActiveTagChange={handleFilterChange} />

				<div>
					<div className="gap-5 px-5 py-2 text-hairline font-medium text-t-tertiary md:flex hidden items-center tracking-[0.04em] uppercase">
						<div className="w-11 shrink-0 text-center">#</div>
						<div className="min-w-0 flex-1">Influencer</div>
						<div className="w-80 max-lg:w-72 shrink-0 text-right">Current bid (USD)</div>
					</div>

					<div className="gap-2 max-md:gap-3 flex flex-col">
						{visibleInfluencers.map((influencer, index) => (
							<InfluencerCard item={influencer} rank={pageStart + index + 1} key={influencer.id} />
						))}
					</div>
				</div>

				{totalPages > 1 && (
					<div className="mt-8 gap-2 flex flex-wrap items-center justify-center">
						<Button
							className="h-10! px-4!"
							isStroke
							type="button"
							disabled={currentPage <= 1}
							onClick={() => setPage((current) => Math.max(1, current - 1))}
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
									onClick={() => setPage(pageNumber)}
								>
									{pageNumber}
								</Button>
							);
						})}
						<Button
							className="h-10! px-4!"
							isStroke
							type="button"
							disabled={currentPage >= totalPages}
							onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
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
