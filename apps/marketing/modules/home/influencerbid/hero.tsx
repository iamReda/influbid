"use client";

import Image from "@repo/ui/components/influencerbid/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

const Hero = () => {
	const [isMounted, setIsMounted] = useState(false);
	const { theme } = useTheme();
	const isTablet = useMediaQuery("(max-width: 1023px)");
	const isMobile = useMediaQuery("(max-width: 767px)");

	useEffect(() => {
		setTimeout(() => {
			setIsMounted(true);
		}, 50);
	}, []);

	return (
		<div className="section section-lines pt-20 max-md:pt-10 max-md:text-left before:-top-22! after:-top-22! max-lg:before:top-0! max-lg:after:top-0! max-md:before:bottom-4! max-md:after:bottom-4! text-center">
			<div className="mb-12 before:top-0 before:left-0 before:right-0 after:bottom-0 after:left-0 after:right-0 relative before:absolute before:h-[1.5px] before:bg-linear-(--gradient-horizontal) after:absolute after:h-[1.5px] after:bg-linear-(--gradient-horizontal)">
				<div className="center">
					<div className="p-1.5 border-stroke-subtle rounded-5xl relative border-[1.5px]">
						<div className="inset-2 bg-b-subtle absolute overflow-hidden rounded-4xl">
							<Image
								className="object-cover"
								src="/images/hero-gradient.png"
								fill
								alt=""
								sizes="(max-width: 1023px) 100vw, 50vw"
							/>
						</div>
						<div className="h-132 max-md:h-auto max-md:pt-6 max-md:pl-6 relative z-2 overflow-hidden rounded-4xl">
							<div
								className="bottom-0 w-179 max-3xl:left-[calc(50%-25rem)] max-lg:left-1/2 max-lg:w-136 max-lg:-translate-x-1/2 max-md:relative max-md:w-auto max-md:left-auto max-md:bottom-auto max-md:translate-x-0 before:-top-5 before:left-4.5 before:right-3.5 before:bottom-0 before:bg-b-surface2 max-lg:before:hidden after:-top-2 after:left-6.75 after:right-6.75 after:bottom-13 after:bg-b-box-shadow after:blur-2xl max-lg:after:top-2 max-lg:after:left-10.75 max-lg:after:-right-40.25 max-md:after:top-4 max-md:after:-left-4 max-md:after:right-6 max-md:after:-bottom-4 absolute left-[calc(50%-25.5rem)] before:absolute before:rounded-2xl before:opacity-50 after:absolute after:rounded-2xl dark:after:opacity-0"
							>
								{isMounted && (
									<Image
										className="relative z-2 h-auto w-full rounded-t-2xl opacity-100"
										src={
											theme === "dark"
												? isMobile
													? "/images/hero-pic-dark-mobile-1.png"
													: isTablet
														? "/images/hero-pic-dark-tablet-1.png"
														: "/images/hero-pic-dark-1.png"
												: isMobile
													? "/images/hero-pic-light-mobile-1.png"
													: isTablet
														? "/images/hero-pic-light-tablet-1.png"
														: "/images/hero-pic-light-1.png"
										}
										width={isMobile ? 287 : isTablet ? 544 : 716}
										height={isMobile ? 371 : isTablet ? 464 : 448}
										alt=""
										quality={100}
										unoptimized
									/>
								)}
							</div>
							<div
								className="bottom-0 w-76 max-3xl:right-[calc(50%-26rem)] max-lg:right-0 max-lg:w-74 max-md:w-[42%] after:-top-7.25 after:-left-10.75 after:right-10.75 after:-bottom-7.25 after:bg-b-box-shadow after:blur-2xl max-lg:after:top-6 max-lg:after:-left-14.5 max-lg:after:right-12 max-lg:after:-bottom-31 max-md:after:top-4 max-md:after:-left-9 max-md:after:-right-3 max-md:after:-bottom-3 absolute right-[calc(50%-25.5rem)] z-2 after:absolute after:rounded-2xl dark:after:opacity-30"
							>
								{isMounted && (
									<Image
										className="max-md:rounded-tr-none relative z-2 h-auto w-full rounded-t-2xl opacity-100"
										src={
											theme === "dark"
												? isMobile
													? "/images/hero-pic-dark-mobile-2.png"
													: "/images/hero-pic-dark-2.png"
												: isMobile
													? "/images/hero-pic-light-mobile-2.png"
													: "/images/hero-pic-light-2.png"
										}
										width={isMobile ? 130 : 303}
										height={isMobile ? 263 : 316}
										alt=""
										quality={100}
										unoptimized
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="mt-12 max-lg:mt-10">
				<div className="mb-3 text-heading-thin text-t-secondary max-md:text-center">
					Join 80,000+ designers
				</div>
				<div className="-mt-0.5 flex items-center justify-center">
					<div className="flex">
						{[
							"/images/avatar-1.png",
							"/images/avatar-2.png",
							"/images/avatar-3.png",
							"/images/avatar-4.png",
							"/images/avatar-5.png",
						].map((src, index) => (
							<div
								className="border-b-surface1 not-first:-ml-3.25 relative overflow-hidden rounded-full border-2"
								key={index}
							>
								<Image
									className="w-8 scale-105 opacity-100"
									src={src}
									width={32}
									height={32}
									alt=""
								/>
							</div>
						))}
					</div>
					<div className="-ml-3.25 border-b-surface1 bg-b-surface1 relative z-2 rounded-[1.125rem] border-2">
						<span className="h-8 px-2.5 bg-primary1/5 border-primary1/15 text-button text-t-blue flex items-center justify-center rounded-2xl border-[1.5px]">
							1,234+
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Hero;
