"use client";

import Image from "@repo/ui/components/influencerbid/image";
import { useState } from "react";

import type { CategoryOptionDto } from "./actions";
import BidForm from "./bid-form";

type StartProps = {
	categories: CategoryOptionDto[];
	defaultBidDollars: number;
};

const Start = ({ categories, defaultBidDollars }: StartProps) => {
	const [claimRank, setClaimRank] = useState(1);

	return (
		<div className="section section-lines mb-12! max-xl:mb-10! max-lg:mb-8! max-md:mb-6! pt-6 max-md:pt-4 before:-top-38! before:-bottom-21! after:-top-38! after:-bottom-21! max-lg:before:-top-23.5! max-lg:before:-bottom-4! max-lg:after:-top-23.5! max-lg:after:-bottom-4! max-md:before:hidden max-md:after:hidden">
			<div className="before:top-0 before:left-0 before:right-0 after:bottom-0 after:left-0 after:right-0 max-md:before:hidden max-md:after:hidden relative before:absolute before:h-[1.5px] before:bg-linear-(--gradient-horizontal) after:absolute after:h-[1.5px] after:bg-linear-(--gradient-horizontal)">
				<div className="center">
					<div className="p-1.5 border-stroke-subtle rounded-5xl relative overflow-hidden border-[1.5px]">
						<div className="w-253 h-253 max-lg:w-222 max-lg:h-222 max-md:top-65 max-md:translate-y-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
							<Image
								className="object-contain"
								src="/images/start-gradient.png"
								fill
								alt=""
								sizes="(max-width: 1023px) 100vw, 50vw"
								priority
							/>
						</div>
						<div className="px-18 pt-20 pb-18 bg-b-subtle95 max-lg:px-8 max-lg:pt-12 max-lg:pb-12 max-md:px-6 max-md:pt-8 max-md:pb-10 relative z-2 overflow-hidden rounded-4xl">
							<div className="max-w-200 max-lg:max-w-175 max-md:max-w-full max-md:text-left mx-auto text-center">
								<div className="mb-4 max-md:justify-start flex justify-center">
									<span className="border-primary1/15 bg-primary1/5 px-3 py-1.5 text-button text-t-blue inline-flex items-center rounded-2xl border-[1.5px]">
										Get discovered ✨ by more people and brands 🚀.
									</span>
								</div>
								<h1 className="mb-5 text-hero max-lg:mx-auto max-lg:mb-5 max-lg:max-w-132 max-md:max-w-full">
									Claim the <span className="text-t-blue">#{claimRank}</span> spot in the influencer
									rankings.
								</h1>
								<div className="mb-8 text-body-lg text-t-secondary max-md:mb-6">
									<span className="text-t-blue">Bids start at $5</span>. Bid under the #1 price and
									you still land on the board - exactly where your amount ranks.
								</div>
								<BidForm
									className="mb-0 mt-6 max-md:mb-0 max-md:ml-0 max-md:mt-4"
									categories={categories}
									defaultBidDollars={defaultBidDollars}
									onRankChange={setClaimRank}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Start;
