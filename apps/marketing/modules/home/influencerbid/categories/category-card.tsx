"use client";

import {
	formatInfluencerCount,
	type InfluencerCategory,
} from "@home/influencerbid/constants/categories";
import { formatBid, leaderboardInfluencers } from "@home/influencerbid/leaderboard/influencers";
import Button from "@repo/ui/components/influencerbid/button";
import Image from "@repo/ui/components/influencerbid/image";
import { useMemo, type MouseEvent } from "react";

type CategoryProps = {
	item: InfluencerCategory;
};

const Category = ({ item }: CategoryProps) => {
	const Icon = item.icon;

	const topInfluencers = useMemo(() => {
		return leaderboardInfluencers
			.filter((influencer) => influencer.categorySlug === item.slug)
			.sort((a, b) => b.bid - a.bid)
			.slice(0, 3)
			.map((influencer, index) => ({
				...influencer,
				categoryRank: index + 1,
			}));
	}, [item.slug]);

	const handleTakeSpot = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "center" });
	};

	return (
		<div className="group mt-6 mx-3 p-6 bg-b-surface2 hover:shadow-hover max-3xl:w-[calc(33.333%-1.5rem)] max-md:w-full max-md:mt-4 max-md:mx-0 flex w-[calc(25%-1.5rem)] flex-col rounded-4xl transition-shadow max-[1179px]:w-[calc(50%-1.5rem)]">
			<div className="mb-7 gap-3 max-md:mb-6 flex items-center justify-start">
				<div
					className={`size-11 flex shrink-0 items-center justify-center rounded-full border-[1.5px] ${item.colors.border} ${item.colors.bg}`}
				>
					<Icon className={`size-5 shrink-0 stroke-2 ${item.colors.icon}`} aria-hidden />
				</div>
				<div className="min-w-0 text-left">
					<div className="text-body-bold text-t-primary truncate">{item.name}</div>
				</div>
			</div>

			<div className="mb-5 divide-stroke-subtle divide-y">
				{topInfluencers.map((influencer) => (
					<div
						key={influencer.id}
						className="group/row gap-2.5 py-2 hover:bg-b-highlight/50 first:pt-0 last:pb-0 relative flex items-center transition-colors"
					>
						<a
							className="min-w-0 gap-2.5 flex flex-1 items-center"
							href={influencer.profileUrl}
							aria-label={`Open ${influencer.name} profile`}
						>
							<span className="w-7 text-body text-t-tertiary shrink-0">
								#{influencer.categoryRank}
							</span>
							<div className="influencer-avatar size-9 bg-b-surface2 relative shrink-0 overflow-hidden">
								<Image
									className="size-full object-cover object-center opacity-100"
									src={influencer.avatar}
									width={36}
									height={36}
									alt=""
								/>
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-button font-bold text-t-primary truncate">
									{influencer.name}
								</div>
								<div className="mt-0.5 text-button font-normal text-t-tertiary">
									{formatBid(influencer.bid)}
								</div>
							</div>
						</a>
						<div className="inset-y-0 right-0 pl-10 md:flex pointer-events-none absolute hidden items-center opacity-0 transition-opacity group-hover/row:pointer-events-auto group-hover/row:opacity-100">
							<Button
								className="h-8! px-3! whitespace-nowrap"
								isSecondary
								type="button"
								onClick={handleTakeSpot}
							>
								Take this spot
							</Button>
						</div>
					</div>
				))}
			</div>

			<Button
				className="h-10! bg-b-surface1! text-t-primary! fill-t-primary! hover:bg-b-highlight! mt-auto w-full border-transparent! hover:shadow-none!"
				as="link"
				href={`/categories/${item.slug}`}
			>
				View all {formatInfluencerCount(item.influencerCount)}
			</Button>
		</div>
	);
};

export default Category;
