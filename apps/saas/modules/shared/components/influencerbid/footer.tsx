"use client";

import { config } from "@config";
import ThemeButton from "@repo/ui/components/influencerbid/theme-button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const marketingBase = (config.marketingUrl ?? "http://localhost:3001").replace(/\/$/, "");

const isHomeRoute = (pathname: string) =>
	pathname === "/" || pathname === "/home" || pathname === "/about";

const Footer = () => {
	const pathname = usePathname();
	const homeRoute = isHomeRoute(pathname);

	return (
		<div>
			<div className="center h-22 max-md:h-12 grid grid-cols-[auto_1fr] items-center">
				<ThemeButton
					className={`shrink-0 ${homeRoute ? "" : "max-md:hidden"}`}
					isHorizontal
					isMedium
				/>
				<div className="max-md:justify-end flex items-center justify-center">
					<div className="text-small text-t-tertiary max-md:truncate">
						© {new Date().getFullYear()} {config.appName}
					</div>
					<div className="w-0.25 h-1 mx-4 max-md:mx-2 bg-t-tertiary shrink-0"></div>
					<Link
						className="text-small text-t-secondary hover:text-t-primary shrink-0 transition-colors"
						href={`${marketingBase}/rules`}
					>
						Rules
					</Link>
				</div>
			</div>
		</div>
	);
};

export default Footer;
