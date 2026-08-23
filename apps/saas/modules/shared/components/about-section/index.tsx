"use client";

import Icon from "@repo/ui/components/influencerbid/icon";
import Image from "@repo/ui/components/influencerbid/image";
import { Rocket } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { useMediaQuery } from "usehooks-ts";

import { content } from "./content";

type FirstCardOverride = {
	title: string;
	content: string;
	useRocketIcon?: boolean;
	footer?: ReactNode;
	media?: ReactNode;
};

type AboutProps = {
	hideHeader?: boolean;
	embedded?: boolean;
	firstCard?: FirstCardOverride;
};

const About = ({ hideHeader = false, embedded = false, firstCard }: AboutProps) => {
	const [isMounted, setIsMounted] = useState(false);
	const { theme } = useTheme();
	const isTablet = useMediaQuery("(max-width: 1023px)");
	const isMobile = useMediaQuery("(max-width: 767px)");

	useEffect(() => {
		setTimeout(() => {
			setIsMounted(true);
		}, 50);
	}, []);

	const cards = (
		<div className="p-1.5 border-stroke-subtle rounded-5xl border-[1.5px]">
			<div className="-mt-4 -mx-2 flex flex-wrap">
				{(firstCard ? content.slice(0, 1) : content).map((item, index) => {
					const isFirstOverride = index === 0 && !!firstCard;
					const title = isFirstOverride ? firstCard.title : item.title;
					const body = isFirstOverride ? firstCard.content : item.content;

					return (
						<div
							key={index}
							className={`group mt-4 mx-2 p-12 bg-b-subtle max-lg:p-8 max-md:w-[calc(100%-1rem)] max-md:first:flex-col max-md:first:h-auto relative w-[calc(50%-1rem)] overflow-hidden rounded-4xl first:flex first:w-[calc(100%-1rem)] first:flex-row-reverse first:items-center ${
								isFirstOverride
									? "first:min-h-90 max-lg:first:min-h-75"
									: "first:h-90 max-lg:first:h-75"
							} `}
						>
							{isFirstOverride && firstCard.media ? (
								<div className="max-md:mb-6 max-md:max-w-full md:absolute md:inset-y-0 md:right-8 md:flex md:w-[min(26rem,calc(100%-12rem))] md:items-center max-3xl:md:right-4 max-lg:md:right-6 max-lg:md:w-[min(22rem,calc(100%-10rem))] relative z-3 w-full max-w-[26rem]">
									{firstCard.media}
								</div>
							) : (
								<div className="max-md:-mr-8 max-md:mb-10 group-first:right-0 group-first:bottom-0 max-3xl:group-first:-right-16 max-lg:group-first:right-0 max-md:group-first:relative max-md:group-first:right-auto max-md:group-first:bottom-auto max-md:group-first:w-[calc(100%+2rem)] group-not-first:mb-12 max-3xl:group-not-first:-mr-12 max-lg:group-not-first:-mr-8 max-md:group-not-first:mb-10 relative z-2 group-first:absolute">
									<div className="group-first:top-20 group-first:-left-20 group-first:right-0 group-first:bottom-0 group-first:shadow-hover group-first:bg-b-surface1 dark:max-md:group-first:hidden max-lg:group-first:top-12 max-lg:group-first:-left-12 max-lg:group-first:bg-b-surface2 max-md:group-first:top-0.5 max-md:group-first:-left-4 max-md:group-first:-bottom-10 max-md:group-first:w-87 max-md:group-first:bg-b-box-shadow max-md:group-first:blur-2xl max-md:group-first:rounded-2xl max-md:group-first:shadow-none group-not-first:w-87 group-not-first:bg-b-box-shadow group-not-first:blur-2xl dark:max-md:group-not-first:hidden group-nth-2:top-4 group-nth-2:-left-4 group-nth-2:-bottom-8 max-lg:group-nth-2:-bottom-10 max-md:top-0.5 group-nth-3:top-0.5 group-nth-3:-left-4 group-nth-3:-bottom-4 max-lg:group-nth-3:-bottom-13.5 max-md:group-nth-3:-bottom-10 group-not-first:absolute group-not-first:rounded-2xl group-first:absolute group-first:rounded-tl-2xl dark:group-not-first:opacity-50"></div>
									<div className="group-first:top-10 group-first:-left-10 group-first:right-0 group-first:bottom-0 group-first:shadow-hover group-first:bg-b-surface2 max-lg:group-first:top-6 max-lg:group-first:-left-6 max-md:hidden group-not-first:hidden group-first:absolute group-first:z-1 group-first:rounded-tl-2xl"></div>
									<div className="group-first:before:top-4.5 group-first:before:-left-4 group-first:before:-right-4 group-first:before:-bottom-14.5 group-first:before:bg-b-box-shadow group-first:before:blur-2xl relative z-2 group-first:before:absolute group-first:before:rounded-2xl dark:group-first:before:opacity-50">
										{isMounted && (
											<Image
												className="max-md:w-full max-md:h-auto max-3xl:group-not-first:rounded-r-none relative z-2 max-w-fit group-not-first:w-full group-not-first:rounded-2xl"
												src={
													theme === "light"
														? isMobile
															? item.imageLightMobile
															: isTablet
																? item.imageLightTablet
																: item.imageLight
														: isMobile
															? item.imageDarkMobile
															: isTablet
																? item.imageDarkTablet
																: item.imageDark
												}
												width={
													index === 0
														? isMobile
															? 279
															: isTablet
																? 280
																: 472
														: isMobile
															? 279
															: isTablet
																? 296
																: 496
												}
												height={
													index === 0
														? isMobile
															? 220
															: isTablet
																? 270
																: 306
														: isMobile
															? 220
															: isTablet
																? 220
																: 244
												}
												alt=""
												unoptimized
											/>
										)}
									</div>
								</div>
							)}
							<div className="group-first:max-w-93.5 max-md:group-first:max-w-full relative z-2 group-first:mr-auto">
								<div className="mb-6 fill-t-primary text-t-primary">
									{isFirstOverride && firstCard.useRocketIcon ? (
										<Rocket className="size-6 stroke-[1.75px]" aria-hidden />
									) : (
										<Icon name={item.icon} />
									)}
								</div>
								{isFirstOverride ? (
									<h2 className="mb-3 text-h5 text-t-primary">{title}</h2>
								) : (
									<div className="mb-3 text-body-lg-bold">{title}</div>
								)}
								<div className="max-w-94 text-body text-t-secondary max-lg:max-w-70 max-lg:[&_br]:hidden">
									{body}
								</div>
								{isFirstOverride && firstCard.footer && (
									<div className="mt-8">{firstCard.footer}</div>
								)}
							</div>
							{(index === 1 || isFirstOverride) && (
								<div className="top-0 right-0 max-lg:-right-49.5 max-md:-right-57.5 pointer-events-none absolute z-0">
									<Image src="/images/about-gradient.png" alt="" width={448} height={388} />
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);

	if (embedded) {
		return <div className="center text-left">{cards}</div>;
	}

	return (
		<div className="section section-lines before:-top-9! before:-bottom-51! after:-top-9! after:-bottom-51! max-md:before:hidden max-md:after:hidden">
			{!hideHeader && (
				<div className="mb-20 max-lg:mb-12 max-md:mb-10 max-md:text-left text-center">
					<div className="center">
						<div className="mb-5 text-h1">AI-powered briefs in seconds</div>
						<div className="text-body-lg text-t-secondary/80">
							Save hours of preparation time with intelligent brief generation
						</div>
					</div>
				</div>
			)}
			<div className="before:top-0 before:left-0 before:right-0 after:bottom-0 after:left-0 after:right-0 max-md:before:hidden max-md:after:hidden relative before:absolute before:h-[1.5px] before:bg-linear-(--gradient-horizontal) after:absolute after:h-[1.5px] after:bg-linear-(--gradient-horizontal)">
				<div className="center">{cards}</div>
			</div>
		</div>
	);
};

export default About;
