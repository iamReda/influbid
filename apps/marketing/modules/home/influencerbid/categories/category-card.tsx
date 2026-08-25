"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Image from "@repo/ui/components/influencerbid/image";
import type { MouseEvent } from "react";

import type { CategoryCardDto } from "../actions";
import { getCategoryUi } from "../lib/category-ui";
import { formatBidCents, formatInfluencerCount } from "../lib/format";

type CategoryProps = {
	item: CategoryCardDto;
};

const Category = ({ item }: CategoryProps) => {
	const ui = getCategoryUi(item.slug);
	const Icon = ui.icon;

	const handleTakeSpot = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "center" });
	};

	return (
		<div className="group mt-6 mx-3 p-6 bg-b-surface2 hover:shadow-hover max-3xl:w-[calc(33.333%-1.5rem)] max-md:w-full max-md:mt-4 max-md:mx-0 flex w-[calc(25%-1.5rem)] flex-col rounded-4xl transition-shadow max-[1179px]:w-[calc(50%-1.5rem)]">
			<div className="mb-7 gap-3 max-md:mb-6 flex items-center justify-start">
				<div
					className={`size-11 flex shrink-0 items-center justify-center rounded-full border-[1.5px] ${ui.colors.border} ${ui.colors.bg}`}
				>
					<Icon className={`size-5 shrink-0 stroke-2 ${ui.colors.icon}`} aria-hidden />
				</div>
				<div className="min-w-0 text-left">
					<div className="text-body-bold text-t-primary truncate">{item.name}</div>
				</div>
			</div>

			<div className="mb-5 divide-stroke-subtle divide-y">
				{item.topCreators.map((influencer, index) => (
					<div
						key={influencer.id}
						className="group/row gap-2.5 py-2 hover:bg-b-highlight/50 first:pt-0 last:pb-0 relative flex items-center transition-colors"
					>
						<a
							className="min-w-0 gap-2.5 flex flex-1 items-center"
							href={influencer.username ? `/${influencer.username}` : "/"}
							aria-label={`Open ${influencer.publicName} profile`}
						>
							<span className="w-7 text-body text-t-tertiary shrink-0">#{index + 1}</span>
							<div className="influencer-avatar size-9 bg-b-surface2 relative shrink-0 overflow-hidden">
								<Image
									className="size-full object-cover object-center opacity-100"
									src={influencer.avatarUrl}
									width={36}
									height={36}
									alt=""
								/>
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-button font-bold text-t-primary truncate">
									{influencer.publicName}
								</div>
								<div className="mt-0.5 text-button font-normal text-t-tertiary">
									{formatBidCents(influencer.totalBidCents)}
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
				{item.topCreators.length === 0 && (
					<p className="py-2 text-small text-t-tertiary">No creators yet in this category.</p>
				)}
			</div>

			<Button
				className="h-10! bg-b-surface1! text-t-primary! fill-t-primary! hover:bg-b-highlight! mt-auto w-full border-transparent! hover:shadow-none!"
				as="link"
				href={`/?category=${item.slug}`}
			>
				View all {formatInfluencerCount(item.influencerCount)}
			</Button>
		</div>
	);
};

export default Category;
