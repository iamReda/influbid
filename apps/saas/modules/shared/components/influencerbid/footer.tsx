"use client";

import { config } from "@config";
import Link from "next/link";
import { usePathname } from "next/navigation";

const marketingBase = (config.marketingUrl ?? "http://localhost:3001").replace(/\/$/, "");

const isHomeRoute = (pathname: string) =>
	pathname === "/" || pathname === "/home" || pathname === "/about";

const Footer = () => {
	const pathname = usePathname();

	return (
		<div className={`${isHomeRoute(pathname) ? "max-md:h-18" : ""}`}>
			<div
				className={`center h-22 max-md:h-12 flex items-center justify-center ${
					isHomeRoute(pathname) ? "max-md:hidden" : ""
				}`}
			>
				<div className="text-small text-t-tertiary">© 2026 influencerbid</div>
				<div className="w-0.25 h-1 mx-4 bg-t-tertiary max-md:mx-auto"></div>
				<Link
					className="text-small text-t-secondary hover:text-t-primary transition-colors"
					href={`${marketingBase}/rules`}
				>
					Rules
				</Link>
			</div>
		</div>
	);
};

export default Footer;
