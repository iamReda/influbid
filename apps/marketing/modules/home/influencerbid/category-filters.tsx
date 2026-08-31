"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CategoryOptionDto } from "./actions";
import { getCategoryUi } from "./lib/category-ui";

type FilterItem = {
	value: string;
	title: string;
	icon: LucideIcon;
};

type CategoryFiltersProps = {
	className?: string;
	categories: CategoryOptionDto[];
	activeTag?: string;
	onActiveTagChange?: (value: string) => void;
};

const CategoryFilters = ({
	className,
	categories,
	activeTag: controlledActiveTag,
	onActiveTagChange,
}: CategoryFiltersProps) => {
	const [uncontrolledActiveTag, setUncontrolledActiveTag] = useState("all");
	const activeTag = controlledActiveTag ?? uncontrolledActiveTag;
	const setActiveTag = onActiveTagChange ?? setUncontrolledActiveTag;
	const tagsRef = useRef<HTMLDivElement>(null);
	const [scrollState, setScrollState] = useState<"start" | "middle" | "end">("start");

	const filterItems = useMemo<FilterItem[]>(
		() => [
			{ value: "all", title: "ALL", icon: LayoutGrid },
			...categories.map((category) => ({
				value: category.slug,
				title: category.name,
				icon: getCategoryUi(category.slug).icon,
			})),
		],
		[categories],
	);

	const handleScroll = useCallback(() => {
		if (!tagsRef.current) {
			return;
		}

		const { scrollLeft, scrollWidth, clientWidth } = tagsRef.current;

		if (scrollLeft <= 1) {
			setScrollState("start");
		} else if (scrollLeft + clientWidth >= scrollWidth - 1) {
			setScrollState("end");
		} else {
			setScrollState("middle");
		}
	}, []);

	const scrollTags = (direction: -1 | 1) => {
		const container = tagsRef.current;
		if (!container) {
			return;
		}

		container.scrollBy({
			left: direction * Math.max(container.clientWidth * 0.75, 220),
			behavior: "smooth",
		});
	};

	useEffect(() => {
		const tagsElement = tagsRef.current;
		if (!tagsElement) {
			return;
		}

		handleScroll();
		tagsElement.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("resize", handleScroll);

		return () => {
			tagsElement.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleScroll);
		};
	}, [filterItems, handleScroll]);

	return (
		<div className={className || ""}>
			<div className="mb-4 max-md:block max-md:mb-3 flex justify-between">
				<div className="relative w-full">
					{scrollState !== "start" ? (
						<div className="from-b-surface1 via-b-surface1/95 top-0 bottom-0 left-0 w-12 max-md:hidden pointer-events-none absolute z-10 flex items-center bg-gradient-to-r to-transparent">
							<button
								className="header-action-btn ml-0.5 size-8 pointer-events-auto flex shrink-0 items-center justify-center rounded-full transition-all"
								type="button"
								aria-label="Scroll categories left"
								onClick={() => scrollTags(-1)}
							>
								<ChevronLeft className="size-4 stroke-2" aria-hidden />
							</button>
						</div>
					) : null}
					{scrollState !== "end" ? (
						<div className="from-b-surface1 via-b-surface1/95 top-0 right-0 bottom-0 w-12 max-md:hidden pointer-events-none absolute z-10 flex items-center justify-end bg-gradient-to-l to-transparent">
							<button
								className="header-action-btn mr-0.5 size-8 pointer-events-auto flex shrink-0 items-center justify-center rounded-full transition-all"
								type="button"
								aria-label="Scroll categories right"
								onClick={() => scrollTags(1)}
							>
								<ChevronRight className="size-4 stroke-2" aria-hidden />
							</button>
						</div>
					) : null}
					<div
						className={`gap-2 py-2 max-md:-mx-6 max-md:gap-0 max-md:before:shrink-0 max-md:before:w-6 max-md:after:shrink-0 max-md:after:w-6 flex scrollbar-none overflow-auto ${
							scrollState === "start" ? "mask-right" : ""
						} ${scrollState === "end" ? "mask-left" : ""} ${
							scrollState === "middle" ? "mask-middle" : ""
						}`}
						ref={tagsRef}
					>
						{filterItems.map((item) => {
							const ItemIcon = item.icon;
							const isActive = activeTag === item.value;

							return (
								<button
									className={`gap-2 h-9 px-4 text-button font-medium max-xl:hover:shadow-none max-md:not-last:mr-2 inline-flex shrink-0 items-center rounded-full transition-all ${
										isActive
											? "bg-primary1/15! text-t-primary! shadow-[inset_0_0_0_2px_var(--color-primary1)]!"
											: "bg-b-surface2 text-t-primary/75 hover:bg-white hover:text-t-primary dark:hover:bg-b-surface2 hover:shadow-hover shadow-[inset_0_0_0_1px_var(--color-stroke-subtle)]"
									}`}
									key={item.value}
									type="button"
									onClick={() => setActiveTag(item.value)}
								>
									<ItemIcon
										className={`size-4 shrink-0 stroke-2 ${
											isActive ? "text-t-primary" : "text-t-primary/70"
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
