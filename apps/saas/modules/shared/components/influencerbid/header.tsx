"use client";

import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import Button from "@repo/ui/components/influencerbid/button";
import Image from "@repo/ui/components/influencerbid/image";
import { isPlatformAdmin } from "@shared/lib/admin-routing";
import { LayoutDashboard, Rocket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import Menu from "./header-menu";
import Plan from "./header-plan";

const marketingBase = (config.marketingUrl ?? "http://localhost:3001").replace(/\/$/, "");

const navigation = [
	{ title: "Leaderboard", url: `${marketingBase}/` },
	{ title: "Categories", url: `${marketingBase}/categories` },
	{ title: "About", url: `${marketingBase}/about` },
	{ title: "Rules", url: `${marketingBase}/rules` },
];

type HeaderProps = {
	isFixed?: boolean;
	login?: boolean;
	isVisiblePlan?: boolean;
	isMinimal?: boolean;
	onLogout: () => void;
};

const Header = ({ isFixed, login, isVisiblePlan, isMinimal, onLogout }: HeaderProps) => {
	const { user } = useSession();
	const isAdmin = isPlatformAdmin(user);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => {
			setIsScrolled(window.scrollY > 8);
		};

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<div
			className={`p-5 max-md:p-4 z-50 flex items-center transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ${
				isFixed ? "top-0 right-0 left-0 fixed!" : "top-0 sticky"
			} ${isScrolled ? "header-liquid-glass" : "border-b border-transparent bg-transparent"}`}
		>
			<Link className="w-33.75 shrink-0" href={`${marketingBase}/`}>
				<Image
					className="w-full opacity-100 dark:hidden!"
					src="/images/logo-dark.svg"
					width={135}
					height={36}
					alt="CreatorLand"
				/>
				<Image
					className="hidden! w-full opacity-100 dark:block!"
					src="/images/logo-light.svg"
					width={135}
					height={36}
					alt="CreatorLand"
				/>
			</Link>
			{!isMinimal && (
				<>
					<nav className="gap-6 max-lg:gap-4 max-md:hidden absolute left-1/2 flex -translate-x-1/2 items-center">
						{navigation.map((item) => (
							<Link
								key={item.url}
								className="text-button text-t-secondary hover:text-t-primary transition-colors"
								href={item.url}
							>
								{item.title}
							</Link>
						))}
					</nav>
					<div className="gap-3 ml-auto flex items-center">
						{isVisiblePlan && <Plan />}
						{login ? (
							<>
								{isAdmin ? (
									<Button
										isSecondary
										isCircle
										as="link"
										href="/admin/dashboard"
										aria-label="Dashboard"
									>
										<LayoutDashboard className="size-5 stroke-[1.75px]" aria-hidden />
									</Button>
								) : (
									<>
										<Button isSecondary as="link" href="/rank-higher" aria-label="Rank higher">
											<Rocket className="mr-2 size-4 stroke-[1.75px]" aria-hidden />
											<span>Rank higher</span>
										</Button>
										<Button isSecondary isCircle as="link" href="/dashboard" aria-label="Dashboard">
											<LayoutDashboard className="size-5 stroke-[1.75px]" aria-hidden />
										</Button>
										<Menu onLogout={onLogout} />
									</>
								)}
							</>
						) : (
							<Button isPrimary as="link" href="/login">
								Sign in
							</Button>
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default Header;
