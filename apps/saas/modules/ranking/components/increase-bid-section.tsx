"use client";

import { config } from "@config";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import About from "@shared/components/about-section";
import { Globe, Lightbulb, Shirt } from "lucide-react";
import { useState } from "react";

const marketingBase = (config.marketingUrl ?? "http://localhost:3001").replace(/\/$/, "");

const LIVE_STATS = {
	bid: 142,
	globalRank: 18,
	categoryRank: 3,
	category: "Fashion",
	suggestedAdd: 18,
};

const getProjectedGlobalRank = (totalBid: number) => {
	const added = Math.max(0, totalBid - LIVE_STATS.bid);
	return Math.max(1, LIVE_STATS.globalRank - Math.floor(added / 9));
};

const getProjectedCategoryRank = (totalBid: number) => {
	const added = Math.max(0, totalBid - LIVE_STATS.bid);
	return Math.max(1, LIVE_STATS.categoryRank - Math.floor(added / 18));
};

const BID_FOR_GLOBAL_1 = LIVE_STATS.bid + Math.max(0, LIVE_STATS.globalRank - 1) * 9;
const BID_FOR_CATEGORY_1 = LIVE_STATS.bid + Math.max(0, LIVE_STATS.categoryRank - 1) * 18;

const IncreaseBidSection = ({ embedded = false }: { embedded?: boolean }) => {
	const [addAmount, setAddAmount] = useState("0");

	const parsedAdd = Number(addAmount);
	const safeAdd =
		addAmount === "" || Number.isNaN(parsedAdd) ? 0 : Math.max(0, Math.round(parsedAdd));
	const newTotal = LIVE_STATS.bid + safeAdd;
	const projectedGlobalRank = getProjectedGlobalRank(newTotal);
	const projectedCategoryRank = getProjectedCategoryRank(newTotal);
	const globalRankGain = Math.max(0, LIVE_STATS.globalRank - projectedGlobalRank);
	const categoryRankGain = Math.max(0, LIVE_STATS.categoryRank - projectedCategoryRank);

	return (
		<About
			hideHeader
			embedded={embedded}
			firstCard={{
				title: "Increase your bid",
				content:
					"Add more to your current bid to move higher in the ranking and gain more visibility.",
				useRocketIcon: true,
				media: (
					<div className="gap-3 bg-b-surface2 p-5 max-md:p-4 relative z-3 flex w-full flex-col rounded-3xl">
						<div className="gap-3 flex items-center justify-between">
							<span className="text-small text-t-primary dark:text-white">Current bid</span>
							<span className="text-button text-t-primary dark:text-white">${LIVE_STATS.bid}</span>
						</div>
						<div className="gap-3 flex items-center justify-between">
							<span className="text-small text-t-primary dark:text-white">Added amount</span>
							<span className="text-button text-t-primary dark:text-white">+${safeAdd}</span>
						</div>
						<div className="bg-stroke1 dark:bg-stroke2 h-px w-full" />
						<div className="gap-3 flex items-center justify-between">
							<span className="text-small text-t-primary dark:text-white">New total</span>
							<span className="text-button text-t-primary dark:text-white">${newTotal}</span>
						</div>
						<div className="mt-1 gap-2.5 grid grid-cols-2">
							<div className="border-stroke1 px-3.5 py-3 dark:border-stroke2 rounded-2xl border-[1.5px]">
								<div className="mb-2 gap-2 flex items-center">
									<span className="size-7 bg-primary1/10 text-t-primary dark:text-white flex shrink-0 items-center justify-center rounded-full">
										<Globe className="size-3.5 stroke-[1.75px]" aria-hidden />
									</span>
									<span className="text-hairline text-t-primary dark:text-white">Global rank</span>
								</div>
								<div className="text-h5 text-t-primary dark:text-white">#{projectedGlobalRank}</div>
								{globalRankGain > 0 ? (
									<div className="mt-1 text-hairline font-medium text-primary2">
										↑ +{globalRankGain} {globalRankGain === 1 ? "position" : "positions"}
									</div>
								) : (
									<div className="mt-1 text-hairline text-t-tertiary">No change yet</div>
								)}
							</div>
							<div className="border-stroke1 px-3.5 py-3 dark:border-stroke2 rounded-2xl border-[1.5px]">
								<div className="mb-2 gap-2 flex items-center">
									<span className="size-7 bg-primary1/10 text-t-primary dark:text-white flex shrink-0 items-center justify-center rounded-full">
										<Shirt className="size-3.5 stroke-[1.75px]" aria-hidden />
									</span>
									<span className="text-hairline text-t-primary dark:text-white">
										{LIVE_STATS.category}
									</span>
								</div>
								<div className="text-h5 text-t-primary dark:text-white">
									#{projectedCategoryRank}
								</div>
								{categoryRankGain > 0 ? (
									<div className="mt-1 text-hairline font-medium text-primary2">
										↑ +{categoryRankGain} {categoryRankGain === 1 ? "position" : "positions"}
									</div>
								) : (
									<div className="mt-1 text-hairline text-t-tertiary">No change yet</div>
								)}
							</div>
						</div>
						<div className="mt-1 gap-2.5 bg-b-surface1 px-3.5 py-3 flex items-center rounded-2xl">
							<Lightbulb
								className="size-4 text-t-primary dark:text-white shrink-0 stroke-[1.75px]"
								aria-hidden
							/>
							<p className="text-small text-t-secondary">
								Claim <span className="text-t-primary font-semibold">#1</span> in{" "}
								<span className="text-t-primary font-semibold">{LIVE_STATS.category}</span> for{" "}
								<span className="text-t-primary font-semibold">${BID_FOR_CATEGORY_1}</span> and{" "}
								<span className="text-t-primary font-semibold">#1</span> in{" "}
								<span className="text-t-primary font-semibold">Global</span> for{" "}
								<span className="text-t-primary font-semibold">${BID_FOR_GLOBAL_1}</span>.
							</p>
						</div>
					</div>
				),
				footer: (
					<div className="gap-5 flex flex-col">
						<Field
							classLabel="bg-b-subtle"
							classInput="bg-white border-[#D0D0D0] text-t-primary placeholder:text-t-secondary dark:bg-transparent dark:border-stroke2"
							label="Add amount"
							value={addAmount}
							onChange={(event) => {
								const next = event.target.value.replace(/[^\d]/g, "");
								setAddAmount(next);
							}}
							name="about-add-amount"
							type="text"
							inputMode="numeric"
							placeholder="0"
							currency="$"
						/>
						<Button className="w-full" isSecondary as="link" href={`${marketingBase}/`}>
							Increase bid
						</Button>
					</div>
				),
			}}
		/>
	);
};

export default IncreaseBidSection;
