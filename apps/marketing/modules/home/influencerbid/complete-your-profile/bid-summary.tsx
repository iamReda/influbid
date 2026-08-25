"use client";

import { formatBidDollars } from "@home/influencerbid/lib/format";
import type { SignupDraft } from "@home/influencerbid/lib/signup-draft";

type BidSummaryProps = {
	draft: SignupDraft | null;
};

const BidSummary = ({ draft }: BidSummaryProps) => (
	<div className="bg-b-subtle95 before:top-0 before:left-36 before:bottom-0 max-3xl:before:left-32 max-2xl:before:left-24 relative z-2 flex grow items-center justify-center overflow-hidden rounded-4xl before:absolute before:z-3 before:w-[1.5px] before:bg-linear-(--gradient-vertical)">
		<div className="left-36 -right-10 px-12 py-16 max-3xl:left-32 max-3xl:-right-16 max-2xl:left-24 max-2xl:-right-28 max-2xl:pb-12 after:inset-0 after:bg-b-surface1 absolute top-1/2 min-h-auto -translate-y-1/2 after:absolute after:rounded-l-2xl after:shadow-[-24px_24px_48px_0px_rgba(0,0,0,0.05)]">
			<div className="inset-2 border-stroke-subtle pointer-events-none absolute z-2 rounded-lg border-[1.5px]"></div>
			<div className="max-w-80 relative z-2">
				<div className="mb-2 text-h4">Bid summary</div>
				<p className="mb-8 text-body text-t-secondary">
					Review your bid before continuing to payment.
				</p>
				<div className="gap-5 bg-b-surface2 p-6 flex flex-col rounded-4xl">
					<div className="gap-3 flex items-center justify-between">
						<span className="text-body text-t-secondary">Your bid</span>
						<span className="text-h5 text-t-primary">
							{draft ? formatBidDollars(draft.bidAmountDollars) : "—"}
						</span>
					</div>
					<div className="gap-3 flex items-center justify-between">
						<span className="text-body text-t-secondary">General Rank</span>
						<span className="text-body-bold text-t-primary">
							{draft ? `#${draft.estimatedGeneralRank} General` : "—"}
						</span>
					</div>
					<div className="gap-3 flex items-center justify-between">
						<span className="text-body text-t-secondary">Category rank</span>
						<span className="h-8 border-stroke1 bg-b-surface1 px-3 text-button text-t-secondary inline-flex items-center rounded-full border-[1.5px]">
							{draft?.estimatedCategoryRank
								? `#${draft.estimatedCategoryRank} in ${draft.categoryName}`
								: draft
									? draft.categoryName
									: "—"}
						</span>
					</div>
				</div>
				<p className="mt-5 text-small text-t-tertiary">
					Your final rank is confirmed after payment.
				</p>
			</div>
			<div className="before:top-0 before:-left-36 before:w-360 max-3xl:before:-left-32 max-2xl:before:-left-24 after:bottom-0 after:-left-36 after:w-360 max-3xl:after:-left-32 max-2xl:after:-left-24 pointer-events-none before:absolute before:z-3 before:h-[1.5px] before:bg-linear-(--gradient-horizontal) after:absolute after:z-3 after:h-[1.5px] after:bg-linear-(--gradient-horizontal)"></div>
		</div>
	</div>
);

export default BidSummary;
