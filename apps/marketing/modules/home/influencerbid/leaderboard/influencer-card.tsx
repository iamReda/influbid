"use client";

import SocialPlatformIcon from "@home/influencerbid/bid-form/social-platform-icon";
import Button from "@repo/ui/components/influencerbid/button";
import Icon from "@repo/ui/components/influencerbid/icon";
import Image from "@repo/ui/components/influencerbid/image";
import { Armchair, MousePointerClick } from "lucide-react";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

import type { LeaderboardItemDto } from "../actions";
import { buildPlatformUrl, formatBid, formatClicks } from "./influencers";

type InfluencerCardProps = {
	item: LeaderboardItemDto;
	rank: number;
};

const rankBadgeClass = (rank: number) => {
	if (rank === 1) {
		return "bg-[#f5c542] text-[#1b1b1b]";
	}

	if (rank === 2) {
		return "bg-[#c8ced8] text-[#1b1b1b]";
	}

	if (rank === 3) {
		return "bg-[#d89563] text-[#1b1b1b]";
	}

	return "bg-transparent text-t-secondary";
};

const InfluencerCard = ({ item, rank }: InfluencerCardProps) => {
	const router = useRouter();

	const openProfile = () => {
		router.push(item.profileUrl);
	};

	const handleTakeSpot = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "center" });
	};

	return (
		<article
			className="influencer-card group gap-5 bg-b-surface2 p-5 hover:shadow-hover max-md:flex-col max-md:items-stretch max-md:gap-4 relative flex cursor-pointer items-center transition-shadow"
			onClick={openProfile}
			onKeyDown={(event: KeyboardEvent) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					openProfile();
				}
			}}
			role="link"
			tabIndex={0}
			aria-label={`${item.name}, rank ${rank}, bid ${formatBid(item.bid)}`}
		>
			<div
				className={`size-11 text-button font-bold flex shrink-0 items-center justify-center rounded-full ${rankBadgeClass(rank)} ${
					rank > 3 ? "shadow-[inset_0_0_0_1.5px_var(--color-stroke1)]" : ""
				}`}
			>
				#{rank}
			</div>

			<div className="min-w-0 gap-4 max-md:flex max-md:grid-cols-none max-md:items-start max-md:gap-3 grid flex-1 grid-cols-[auto_minmax(0,1fr)] items-stretch">
				<div className="influencer-avatar influencer-avatar-lg bg-b-surface1 max-md:aspect-auto max-md:size-16 max-md:h-auto relative aspect-square h-full overflow-hidden">
					<Image
						className="size-full object-cover object-center opacity-100"
						src={item.avatar}
						width={80}
						height={80}
						alt=""
					/>
				</div>

				<div className="min-w-0 flex-1">
					<div className="mb-1.5 gap-2 flex flex-wrap items-center">
						<div className="min-w-0 gap-1.5 flex items-center">
							<span className="text-body-bold text-t-primary truncate">{item.name}</span>
							{item.verified && (
								<Icon className="size-4! fill-t-blue shrink-0" name="verification" />
							)}
						</div>
					</div>

					<p className="mb-2 text-body text-t-secondary max-md:line-clamp-2 line-clamp-1">
						{item.description}
					</p>

					<div className="mb-2 gap-2.5 flex items-center">
						{item.platforms.map((platform) => (
							<a
								key={platform}
								className="inline-flex transition-opacity hover:opacity-80"
								href={buildPlatformUrl(item.name, platform)}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Open ${item.name} on ${platform}`}
								onClick={(event) => {
									event.stopPropagation();
								}}
							>
								<SocialPlatformIcon platform={platform} className="size-5 shrink-0" colored />
							</a>
						))}
					</div>

					<div className="gap-x-1.5 gap-y-1 text-button font-normal text-t-tertiary flex flex-wrap items-center">
						<span className="gap-1.5 border-primary1/15 bg-primary1/5 px-2.25 py-0.75 text-t-blue inline-flex items-center rounded-2xl border-[1.5px]">
							<MousePointerClick className="size-3.5 shrink-0 stroke-2" aria-hidden />
							{formatClicks(item.clicks)} clicks
						</span>
						<span aria-hidden>•</span>
						<span>{item.categoryName}</span>
						<span aria-hidden>•</span>
						<span>{item.addedAgo}</span>
					</div>
				</div>
			</div>

			<div className="min-h-12 w-80 max-lg:w-72 max-md:w-full max-md:flex-col max-md:items-stretch max-md:gap-3 relative flex shrink-0 items-center justify-end">
				<div className="text-h4 text-t-blue max-md:hidden transition-opacity group-hover:pointer-events-none group-hover:opacity-0">
					{formatBid(item.bid)}
				</div>
				<div className="text-h4 text-t-blue max-md:ml-19 md:hidden whitespace-nowrap">
					{formatBid(item.bid)}
				</div>
				<div className="inset-y-0 right-0 gap-2 max-md:static max-md:!flex max-md:w-full max-md:opacity-100 absolute hidden items-center opacity-0 transition-opacity group-hover:flex group-hover:opacity-100">
					<Button
						className="h-10! gap-2! px-4! max-md:w-full whitespace-nowrap"
						isSecondary
						type="button"
						onClick={handleTakeSpot}
					>
						<Armchair className="size-4 shrink-0 stroke-2" aria-hidden />
						Take this spot for {formatBid(item.bid + 1)}
					</Button>
				</div>
			</div>
		</article>
	);
};

export default InfluencerCard;
