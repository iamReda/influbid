"use client";

import { useTheme } from "next-themes";

import Icon from "./icon";

type ThemeButtonProps = {
	className?: string;
	isHorizontal?: boolean;
	isMedium?: boolean;
};

const ThemeButton = ({ className, isHorizontal, isMedium }: ThemeButtonProps) => {
	const { setTheme, theme } = useTheme();
	const buttonClass = isMedium
		? "size-8 fill-t-secondary group-hover:fill-t-primary! last:bg-b-surface1 last:fill-t-primary dark:first:bg-b-surface1 dark:first:fill-t-primary dark:last:fill-t-secondary dark:group-hover:fill-t-primary dark:last:bg-transparent flex items-center justify-center rounded-full transition-colors"
		: "size-9 fill-t-secondary group-hover:fill-t-primary! last:bg-b-surface1 last:fill-t-primary dark:first:bg-b-surface1 dark:first:fill-t-primary dark:last:fill-t-secondary dark:group-hover:fill-t-primary flex items-center justify-center rounded-full transition-colors dark:last:bg-transparent";
	const iconClass = isMedium ? "size-3.5! fill-inherit" : "size-4! fill-inherit";
	const containerClass = isMedium ? "gap-0.5 p-1" : "gap-1 p-1.5";

	return (
		<div
			className={`group bg-b-surface2 dark:after:inset-0 relative flex cursor-pointer rounded-3xl transition-shadow dark:after:absolute dark:after:rounded-full dark:after:border-[1.5px] dark:after:border-[#FDFDFD]/7 dark:after:mask-linear-170 dark:after:mask-linear-from-1% dark:after:mask-linear-to-100% dark:after:opacity-0 dark:after:transition-opacity dark:hover:after:opacity-100 ${containerClass} ${
				isHorizontal
					? "flex-row shadow-[inset_0_0_0_1.5px_var(--color-stroke2)]"
					: "hover:shadow-hover flex-col"
			} ${className || ""}`}
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
		>
			{["dark", "light"].map((themeName) => (
				<button
					className={buttonClass}
					key={themeName}
					type="button"
					aria-label={themeName === "dark" ? "Dark theme" : "Light theme"}
				>
					<Icon className={iconClass} name={themeName === "dark" ? "moon" : "sun"} />
				</button>
			))}
		</div>
	);
};

export default ThemeButton;
