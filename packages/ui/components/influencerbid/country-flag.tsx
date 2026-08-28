"use client";

import ReactCountryFlag from "react-country-flag";

import { cn } from "../../lib";

type CountryFlagProps = {
	countryCode: string | null | undefined;
	className?: string;
	/** Visual size matching verified icon footprints: size-4 or size-6 */
	size?: "sm" | "md";
	title?: string;
};

const SIZE_CLASS = {
	sm: "size-4",
	md: "size-6 max-md:size-5",
} as const;

/**
 * Circular country flag for creator public-name presentation.
 * Renders nothing when countryCode is missing (safe fallback).
 */
export function CountryFlag({ countryCode, className, size = "md", title }: CountryFlagProps) {
	const code = countryCode?.trim().toUpperCase();
	if (!code || code.length !== 2) {
		return null;
	}

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
				SIZE_CLASS[size],
				className,
			)}
			title={title ?? code}
			aria-hidden={title ? undefined : true}
			aria-label={title}
		>
			<ReactCountryFlag
				countryCode={code}
				svg
				style={{
					width: "100%",
					height: "100%",
					display: "block",
					objectFit: "cover",
				}}
				aria-label={title ?? code}
			/>
		</span>
	);
}

export default CountryFlag;
