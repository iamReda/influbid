"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

import Icon from "./icon";

type ThemeButtonProps = {
	className?: string;
	isHorizontal?: boolean;
};

const ThemeButton = ({ className, isHorizontal }: ThemeButtonProps) => {
	const { setTheme, theme } = useTheme();
	const pathname = usePathname();

	return (
		<div
			className={`group gap-1 p-1.5 bg-b-surface2 dark:after:inset-0 relative flex cursor-pointer rounded-3xl transition-shadow dark:after:absolute dark:after:rounded-full dark:after:border-[1.5px] dark:after:border-[#FDFDFD]/7 dark:after:mask-linear-170 dark:after:mask-linear-from-1% dark:after:mask-linear-to-100% dark:after:opacity-0 dark:after:transition-opacity dark:hover:after:opacity-100 ${
				isHorizontal
					? "max-md:flex! flex-row shadow-[inset_0_0_0_1.5px_var(--color-stroke2)]"
					: "flex-col"
			} ${!isHorizontal ? "hover:shadow-hover" : ""} ${
				pathname === "/" || pathname === "/home" || pathname === "/about"
					? "max-md:flex"
					: "max-md:hidden"
			} ${className || ""}`}
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
		>
			{["dark", "light"].map((theme) => (
				<button
					className="size-9 fill-t-secondary group-hover:fill-t-primary! last:bg-b-surface1 last:fill-t-primary dark:first:bg-b-surface1 dark:first:fill-t-primary dark:last:fill-t-secondary dark:group-hover:fill-t-primary flex items-center justify-center rounded-[1.125rem] transition-colors dark:last:bg-transparent"
					key={theme}
				>
					<Icon className="size-4! fill-inherit" name={theme === "dark" ? "moon" : "sun"} />
				</button>
			))}
		</div>
	);
};

export default ThemeButton;
