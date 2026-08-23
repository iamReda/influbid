"use client";

import { influencerCategories } from "@home/influencerbid/constants/categories";
import { LayoutGrid, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FilterItem = {
	value: string;
	title: string;
	icon: LucideIcon;
};

const filterItems: FilterItem[] = [
	{ value: "all", title: "ALL", icon: LayoutGrid },
	...influencerCategories.map((category) => ({
		value: category.slug,
		title: category.name,
		icon: category.icon,
	})),
];

type CategoryFiltersProps = {
	className?: string;
	activeTag?: string;
	onActiveTagChange?: (value: string) => void;
};

const CategoryFilters = ({
	className,
	activeTag: controlledActiveTag,
	onActiveTagChange,
}: CategoryFiltersProps) => {
	const [uncontrolledActiveTag, setUncontrolledActiveTag] = useState("all");
	const activeTag = controlledActiveTag ?? uncontrolledActiveTag;
	const setActiveTag = onActiveTagChange ?? setUncontrolledActiveTag;
	const tagsRef = useRef<HTMLDivElement>(null);
	const [scrollState, setScrollState] = useState<"start" | "middle" | "end">("start");

	const handleScroll = () => {
		if (tagsRef.current) {
			const { scrollLeft, scrollWidth, clientWidth } = tagsRef.current;
			if (scrollLeft === 0) {
				setScrollState("start");
			} else if (scrollLeft + clientWidth >= scrollWidth) {
				setScrollState("end");
			} else {
				setScrollState("middle");
			}
		}
	};

	useEffect(() => {
		const tagsElement = tagsRef.current;
		if (tagsElement) {
			tagsElement.addEventListener("scroll", handleScroll);
		}

		return () => {
			if (tagsElement) {
				tagsElement.removeEventListener("scroll", handleScroll);
			}
		};
	}, []);

	return (
		<div className={className || ""}>
			<div className="mb-4 max-md:block max-md:mb-3 flex justify-between">
				<div className="relative w-full">
					<div
						className={`gap-3 py-2 max-md:-mx-6 max-md:gap-0 max-md:before:shrink-0 max-md:before:w-6 max-md:after:shrink-0 max-md:after:w-6 flex scrollbar-none overflow-auto ${
							scrollState === "start" ? "mask-right" : ""
						} ${scrollState === "end" ? "mask-left" : ""} ${
							scrollState === "middle" ? "mask-middle" : ""
						}`}
						ref={tagsRef}
					>
						{filterItems.map((item) => {
							const Icon = item.icon;
							const isActive = activeTag === item.value;

							return (
								<button
									className={`gap-2 h-8 px-4 bg-b-surface1 text-hairline font-medium text-t-secondary hover:bg-b-surface2 hover:shadow-hover hover:text-t-primary max-xl:hover:shadow-none max-md:not-last:mr-3 inline-flex shrink-0 items-center rounded-full shadow-[inset_0_0_0_1.5px_var(--color-stroke1)] transition-all ${
										isActive
											? "bg-primary1/15! text-t-primary! shadow-[inset_0_0_0_2px_var(--color-primary1)]!"
											: ""
									}`}
									key={item.value}
									type="button"
									onClick={() => setActiveTag(item.value)}
								>
									<Icon
										className={`size-3.5 shrink-0 stroke-2 ${
											isActive ? "text-t-primary" : "text-t-secondary"
										}`}
										aria-hidden
									/>
									{item.title}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CategoryFilters;
