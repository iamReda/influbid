import Image from "@repo/ui/components/influencerbid/image";

import { formatBid, type RecentBid } from "./recent-bids";

type RecentBidRowProps = {
	item: RecentBid;
	isScrolling?: boolean;
};

const RecentBidRow = ({ item, isScrolling = false }: RecentBidRowProps) => (
	<a
		className={`gap-2.5 py-2 max-md:gap-2 flex items-center ${
			isScrolling
				? "hover:bg-b-highlight/50 rounded-xl transition-colors"
				: "transition-opacity hover:opacity-80"
		}`}
		href={item.profileUrl}
		aria-label={`Open ${item.name} profile`}
	>
		<span className="w-9 pt-2.5 text-body-bold text-t-blue max-md:w-7 max-md:pt-2 shrink-0 self-start">
			#{item.rank}
		</span>
		<div className="influencer-avatar size-11 bg-b-surface1 max-md:size-10 relative shrink-0 overflow-hidden">
			<Image
				className="size-full object-cover object-center opacity-100"
				src={item.avatar}
				width={44}
				height={44}
				unoptimized
				alt=""
			/>
		</div>
		<div className="min-w-0 flex-1">
			<div className="text-body-bold text-t-primary truncate">{item.name}</div>
			<div className="mt-0.5 gap-x-2 gap-y-0.5 text-small text-t-tertiary flex flex-wrap items-center">
				<span className="text-t-secondary">{formatBid(item.bid)}</span>
				<span aria-hidden>•</span>
				<span>{item.bidAgo}</span>
			</div>
		</div>
	</a>
);

export default RecentBidRow;
