"use client";

import { SOCIAL_PLATFORMS, detectPlatform } from "@creators/lib/profile";
import SocialPlatformIcon, { type Platform } from "@shared/components/social-platform-icon";
import { useEffect, useState, type Ref } from "react";

type SocialUrlFieldProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	ariaLabel: string;
	inputRef?: Ref<HTMLInputElement>;
};

export function SocialUrlField({
	value,
	onChange,
	placeholder,
	ariaLabel,
	inputRef,
}: SocialUrlFieldProps) {
	const [cycleIndex, setCycleIndex] = useState(0);
	const detectedPlatform = detectPlatform(value.trim());
	const activePlatform = (detectedPlatform ?? SOCIAL_PLATFORMS[cycleIndex]) as Platform;
	const isLocked = !!detectedPlatform;

	useEffect(() => {
		if (detectedPlatform) {
			return;
		}

		const interval = setInterval(() => {
			setCycleIndex((current) => (current + 1) % SOCIAL_PLATFORMS.length);
		}, 2000);

		return () => clearInterval(interval);
	}, [detectedPlatform]);

	return (
		<div className="relative">
			<div className="left-4.5 pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center">
				<SocialPlatformIcon
					platform={activePlatform}
					className={`size-5 shrink-0 ${isLocked ? "" : "text-t-secondary"}`}
					colored={isLocked}
				/>
			</div>
			<input
				ref={inputRef}
				type="url"
				className="h-12 border-stroke1 pl-13 pr-6.5 font-medium text-t-primary placeholder:text-t-tertiary max-md:text-[1rem] w-full rounded-3xl border-[1.5px] bg-transparent text-input outline-0 transition-colors focus:border-[#A8A8A8]/50!"
				value={value}
				placeholder={placeholder}
				aria-label={ariaLabel}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
}
