"use client";

import SocialPlatformIcon, {
	PLATFORM_LABEL,
} from "@home/influencerbid/bid-form/social-platform-icon";
import { getCategoryUi } from "@home/influencerbid/lib/category-ui";
import Button from "@repo/ui/components/influencerbid/button";
import { CountryFlag } from "@repo/ui/components/influencerbid/country-flag";
import Image from "@repo/ui/components/influencerbid/image";
import { getCountryName } from "@repo/utils";
import { Armchair } from "lucide-react";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

import type { LeaderboardItemDto } from "../actions";
import { requestTakeSpot } from "../lib/take-spot";
import { formatBid, formatClicks } from "./influencers";

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

const rankBadgeClassName = (rank: number, className?: string) => {
	if (rank <= 3) {
		return `size-11 text-button font-bold flex shrink-0 items-center justify-center rounded-full ${rankBadgeClass(rank)} ${className ?? ""}`;
	}

	return `w-11 text-button font-bold text-t-secondary shrink-0 self-center text-center ${className ?? ""}`;
};

const InfluencerCard = ({ item, rank }: InfluencerCardProps) => {
	const router = useRouter();
	const CategoryIcon = getCategoryUi(item.categorySlug).icon;
	const countryName = item.countryCode ? getCountryName(item.countryCode) : null;
	const takeSpotAmount = item.bid + 1;

	const openProfile = () => {
		router.push(item.profileUrl);
	};

	const handleTakeSpot = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		requestTakeSpot(takeSpotAmount);
	};

	const stopCardNavigation = (event: MouseEvent) => {
		event.stopPropagation();
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
			<div className={rankBadgeClassName(rank, "max-md:hidden")}>#{rank}</div>

			<div className="min-w-0 gap-6 max-md:flex max-md:grid-cols-none max-md:items-start max-md:gap-4 grid h-full flex-1 grid-cols-[auto_minmax(0,1fr)] items-stretch">
				<div className="max-md:flex max-md:flex-col max-md:items-center max-md:gap-2 max-md:shrink-0">
					<div className="influencer-avatar influencer-avatar-lg bg-b-surface1 size-28 max-md:size-20 relative shrink-0 overflow-hidden">
						<Image
							className="size-full object-cover object-center opacity-100"
							src={item.avatar}
							width={112}
							height={112}
							unoptimized
							alt=""
						/>
					</div>
					<div className={rankBadgeClassName(rank, "md:hidden")}>#{rank}</div>
				</div>

				<div className="min-w-0 flex flex-1 flex-col">
					<div className="gap-2 flex flex-wrap items-center">
						<div className="min-w-0 gap-1.5 flex items-center">
							<span className="leading-6 font-bold text-t-primary truncate text-[1.25rem]">
								{item.name}
							</span>
							{countryName ? (
								<span className="group/flag relative inline-flex shrink-0">
									<CountryFlag
										countryCode={item.countryCode}
										size="xs"
										title={countryName}
										className="shrink-0 self-center"
									/>
									<span
										className="bg-b-dark1 text-t-light dark:bg-b-surface3 dark:text-t-primary ml-1.5 px-2 py-0.5 text-small font-medium pointer-events-none absolute top-1/2 left-full z-10 -translate-y-1/2 rounded-full whitespace-nowrap opacity-0 transition-opacity group-hover/flag:opacity-100 dark:shadow-[inset_0_0_0_1px_var(--color-stroke2)]"
										role="tooltip"
									>
										{countryName}
									</span>
								</span>
							) : null}
						</div>
					</div>

					<p className="mt-2 text-body text-t-secondary max-md:line-clamp-2 line-clamp-1">
						{item.description}
					</p>

					<div className="mt-4 gap-3.5 flex items-center">
						{item.socials.map((social) => (
							<a
								key={social.id}
								className="inline-flex"
								href={`/out/social/${social.id}`}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Open ${item.name} on ${PLATFORM_LABEL[social.platform]}`}
								onClick={stopCardNavigation}
							>
								<SocialPlatformIcon
									platform={social.platform}
									className="size-5 shrink-0"
									colored
								/>
							</a>
						))}
					</div>

					<div className="mt-4 gap-x-2 gap-y-1 text-button font-normal text-t-secondary dark:text-t-secondary flex flex-wrap items-center">
						<span className="gap-1.5 inline-flex items-center">
							<CategoryIcon className="size-3.5 shrink-0 stroke-2" aria-hidden />
							{item.categoryName}
						</span>
						<span className="text-t-tertiary dark:text-t-secondary/50" aria-hidden>
							•
						</span>
						<span>{formatClicks(item.clicks)} clicks</span>
						<span className="text-t-tertiary dark:text-t-secondary/50" aria-hidden>
							•
						</span>
						<span>{item.addedAgo}</span>
					</div>
				</div>
			</div>

			<div className="min-h-12 w-80 max-lg:w-72 max-md:w-full max-md:flex-col max-md:items-stretch max-md:gap-3 relative flex shrink-0 items-center justify-end self-center">
				<div className="text-h5 text-t-blue max-md:hidden transition-opacity group-hover:pointer-events-none group-hover:opacity-0">
					{formatBid(item.bid)}
				</div>
				<div className="text-h5 text-t-blue max-md:ml-23 md:hidden whitespace-nowrap">
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
						Take this spot for {formatBid(takeSpotAmount)}
					</Button>
				</div>
			</div>
		</article>
	);
};

export default InfluencerCard;

export const LeaderboardTopTenDivider = () => (
	<div className="py-1 relative flex items-center" aria-hidden>
		<div className="bg-primary1/20 h-px flex-1" />
		<span className="border-primary1/20 bg-primary1/5 text-button text-t-blue mx-4 px-4 py-1.5 font-bold shrink-0 rounded-full border-[1.5px] tracking-[0.08em]">
			TOP 10
		</span>
		<div className="bg-primary1/20 h-px flex-1" />
	</div>
);
