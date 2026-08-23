import Icon from "@repo/ui/components/influencerbid/icon";

import RecentBidRow from "./recent-bid-row";
import { RECENT_BIDS_VISIBLE_ROWS, recentBids } from "./recent-bids";

const RecentBids = () => (
	<div className="section">
		<div className="center">
			<div className="bg-b-surface2 p-5 max-md:p-4 overflow-hidden rounded-4xl shadow-[inset_0_0_0_1.5px_var(--color-stroke-subtle)]">
				<div className="mb-4 gap-4 border-stroke-subtle pb-4 flex items-center justify-between border-b-[1.5px]">
					<div className="min-w-0 gap-3 flex items-center">
						<span className="size-2 bg-primary2 shrink-0 rounded-full" aria-hidden />
						<span className="text-h5 text-t-primary">Recent bids</span>
						<span className="text-body text-t-tertiary">{recentBids.length} bids</span>
					</div>
					<Icon className="size-4 fill-t-tertiary shrink-0 -rotate-180" name="chevron" />
				</div>

				<div
					className="scrollbar-design divide-stroke-subtle divide-y"
					style={{
						maxHeight: `calc(${RECENT_BIDS_VISIBLE_ROWS} * 3.75rem)`,
					}}
				>
					{recentBids.map((item) => (
						<RecentBidRow item={item} key={item.id} />
					))}
				</div>
			</div>
		</div>
	</div>
);

export default RecentBids;
