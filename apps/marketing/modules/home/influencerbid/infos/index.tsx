"use client";

import RecentBidRow from "@home/influencerbid/recent-bids/recent-bid-row";
import {
	RECENT_BIDS_VISIBLE_ROWS,
	type RecentBid,
} from "@home/influencerbid/recent-bids/recent-bids";
import Icon from "@repo/ui/components/influencerbid/icon";
import Image from "@repo/ui/components/influencerbid/image";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { content } from "./content";

const SLIDE_INTERVAL_MS = 4000;
const SLIDE_TRANSITION_MS = 900;

type ContentItem = (typeof content)[number];

const InfosImageSlider = ({
	slides,
	activeSlide,
	getImageSrc,
	imageWidth,
	imageHeight,
}: {
	slides: ContentItem[];
	activeSlide: number;
	getImageSrc: (item: ContentItem) => string;
	imageWidth: number;
	imageHeight: number;
}) => (
	<div className="relative w-full">
		{slides.map((item, slideIndex) => (
			<div
				key={slideIndex}
				className="inset-0 ease-in-out absolute transition-opacity motion-reduce:transition-none"
				style={{
					opacity: activeSlide === slideIndex ? 1 : 0,
					transitionDuration: `${SLIDE_TRANSITION_MS}ms`,
				}}
				aria-hidden={activeSlide !== slideIndex}
			>
				<Image
					className="max-3xl:rounded-r-none max-md:w-full max-md:h-auto relative z-2 w-full rounded-2xl"
					src={getImageSrc(item)}
					width={imageWidth}
					height={imageHeight}
					alt=""
					unoptimized
				/>
			</div>
		))}
		<div className="pointer-events-none invisible" aria-hidden>
			<Image
				className="max-3xl:rounded-r-none max-md:w-full max-md:h-auto w-full rounded-2xl"
				src={getImageSrc(slides[0])}
				width={imageWidth}
				height={imageHeight}
				alt=""
				unoptimized
			/>
		</div>
	</div>
);

const AUTO_SCROLL_SPEED_PX_PER_SEC = 12;

const InfosRecentBidsScroller = ({ recentBids }: { recentBids: RecentBid[] }) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const offsetRef = useRef(0);
	const isPausedRef = useRef(false);
	const lastTimeRef = useRef<number | null>(null);
	const shouldLoop = recentBids.length > RECENT_BIDS_VISIBLE_ROWS;

	const loopedRecentBids = useMemo(
		() =>
			shouldLoop
				? [
						...recentBids,
						...recentBids.map((bid, index) => ({
							...bid,
							id: `${bid.id}-loop-${index}`,
						})),
					]
				: recentBids,
		[recentBids, shouldLoop],
	);

	useEffect(() => {
		if (!shouldLoop) {
			return;
		}

		const track = trackRef.current;
		if (!track) return;

		let animationFrame = 0;

		const tick = (time: number) => {
			if (lastTimeRef.current == null) {
				lastTimeRef.current = time;
			}

			const deltaMs = Math.min(time - lastTimeRef.current, 32);
			lastTimeRef.current = time;

			if (!isPausedRef.current) {
				const loopHeight = track.scrollHeight / 2;

				if (loopHeight > 0) {
					offsetRef.current += (AUTO_SCROLL_SPEED_PX_PER_SEC * deltaMs) / 1000;

					if (offsetRef.current >= loopHeight) {
						offsetRef.current -= loopHeight;
					}

					track.style.transform = `translate3d(0, ${-Math.round(offsetRef.current)}px, 0)`;
				}
			}

			animationFrame = requestAnimationFrame(tick);
		};

		animationFrame = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(animationFrame);
			lastTimeRef.current = null;
		};
	}, [shouldLoop]);

	return (
		<div
			className="bg-b-surface1 p-4 max-md:p-3 overflow-hidden rounded-2xl shadow-[inset_0_0_0_1.5px_var(--color-stroke-subtle)]"
			onMouseEnter={() => {
				isPausedRef.current = true;
			}}
			onMouseLeave={() => {
				isPausedRef.current = false;
				lastTimeRef.current = null;
			}}
		>
			<div
				className="overflow-hidden"
				style={{
					height: `calc(${RECENT_BIDS_VISIBLE_ROWS} * 3.75rem)`,
				}}
				aria-label="Recent bids"
			>
				<div ref={trackRef} className="divide-stroke-subtle divide-y will-change-transform">
					{loopedRecentBids.map((bid) => (
						<RecentBidRow item={bid} key={bid.id} isScrolling />
					))}
				</div>
			</div>
		</div>
	);
};

const Infos = ({ recentBids }: { recentBids: RecentBid[] }) => {
	const [isMounted, setIsMounted] = useState(false);
	const [activeSlide, setActiveSlide] = useState(0);
	const { theme } = useTheme();
	const isTablet = useMediaQuery("(max-width: 1023px)");
	const isMobile = useMediaQuery("(max-width: 767px)");

	useEffect(() => {
		setTimeout(() => {
			setIsMounted(true);
		}, 50);
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setActiveSlide((prev) => (prev + 1) % content.length);
		}, SLIDE_INTERVAL_MS);

		return () => clearInterval(interval);
	}, []);

	const getImageSrc = (item: (typeof content)[number]) => {
		if (theme === "light") {
			if (isMobile) return item.imageLightMobile;
			if (isTablet) return item.imageLightTablet;
			return item.imageLight;
		}

		if (isMobile) return item.imageDarkMobile;
		if (isTablet) return item.imageDarkTablet;
		return item.imageDark;
	};

	const imageWidth = isMobile ? 279 : isTablet ? 296 : 496;
	const imageHeight = isMobile ? 220 : isTablet ? 220 : 244;

	return (
		<div className="section section-lines before:-top-9! before:-bottom-51! after:-top-9! after:-bottom-51! max-md:before:hidden max-md:after:hidden">
			<div className="before:top-0 before:left-0 before:right-0 after:bottom-0 after:left-0 after:right-0 max-md:before:hidden max-md:after:hidden relative before:absolute before:h-[1.5px] before:bg-linear-(--gradient-horizontal) after:absolute after:h-[1.5px] after:bg-linear-(--gradient-horizontal)">
				<div className="center">
					<div className="p-1.5 border-stroke-subtle rounded-5xl border-[1.5px]">
						<div className="-mt-4 -mx-2 flex flex-wrap">
							{content.map((item, index) => (
								<div
									key={index}
									className="group mt-4 mx-2 p-12 bg-b-subtle max-lg:p-8 max-md:w-[calc(100%-1rem)] relative w-[calc(50%-1rem)] overflow-hidden rounded-4xl"
								>
									<div className="mb-12 max-3xl:-mr-12 max-lg:-mr-8 max-md:-mr-8 max-md:mb-10 relative z-2">
										<div className="w-87 bg-b-box-shadow blur-2xl dark:max-md:hidden group-nth-1:top-4 group-nth-1:-left-4 group-nth-1:-bottom-8 max-lg:group-nth-1:-bottom-10 max-md:top-0.5 group-nth-2:top-0.5 group-nth-2:-left-4 group-nth-2:-bottom-4 max-lg:group-nth-2:-bottom-13.5 max-md:group-nth-2:-bottom-10 absolute rounded-2xl dark:opacity-50"></div>
										<div className="relative z-2">
											{index === 0 ? (
												isMounted && (
													<InfosImageSlider
														slides={content}
														activeSlide={activeSlide}
														getImageSrc={getImageSrc}
														imageWidth={imageWidth}
														imageHeight={imageHeight}
													/>
												)
											) : recentBids.length > 0 ? (
												<InfosRecentBidsScroller recentBids={recentBids} />
											) : (
												<div className="bg-b-surface1 p-4 text-small text-t-tertiary rounded-2xl">
													Recent bids will appear here after the first paid signup.
												</div>
											)}
										</div>
									</div>
									<div className="relative z-2">
										<div className="mb-6">
											<Icon
												name={item.icon}
												className={
													index === 1
														? "fill-primary2 animate-signal-pulse motion-reduce:animate-none"
														: "fill-t-primary"
												}
											/>
										</div>
										<div className="mb-3 text-body-lg-bold">{item.title}</div>
										<div className="max-w-94 text-body text-t-secondary max-lg:max-w-70 max-lg:[&_br]:hidden">
											{item.content}
										</div>
									</div>
									<div className="top-0 right-0 max-lg:-right-49.5 max-md:-right-57.5 absolute">
										<Image src="/images/about-gradient.png" alt="" width={448} height={388} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Infos;
