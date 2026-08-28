"use client";

import { config } from "@config";
import Button from "@repo/ui/components/influencerbid/button";
import Image from "@repo/ui/components/influencerbid/image";
import { LayoutDashboard, Rocket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "../../lib/auth-client";
import Menu from "./header-menu";
import Plan from "./header-plan";

const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");

const navigation = [
	{ title: "Leaderboard", url: "/" },
	{ title: "Categories", url: "/categories" },
	{ title: "About", url: "/about" },
	{ title: "Rules", url: "/rules" },
];

type HeaderProps = {
	isFixed?: boolean;
	login?: boolean;
	isVisiblePlan?: boolean;
	isMinimal?: boolean;
	onLogin?: () => void;
	onLogout?: () => void;
};

const Header = ({ isFixed, isVisiblePlan, isMinimal }: HeaderProps) => {
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;
	const isLoggedIn = !!user;

	const handleLogout = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = "/";
				},
			},
		});
	};

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
			<Link className="w-33.75 shrink-0" href="/">
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
						{isLoggedIn ? (
							<>
								{user.role === "admin" ? (
									<Button
										isSecondary
										isCircle
										as="link"
										href={`${saasBase}/admin/dashboard`}
										aria-label="Dashboard"
									>
										<LayoutDashboard className="size-5 stroke-[1.75px]" aria-hidden />
									</Button>
								) : (
									<>
										<Button
											isSecondary
											as="link"
											href={`${saasBase}/rank-higher`}
											aria-label="Rank higher"
										>
											<Rocket className="mr-2 size-4 stroke-[1.75px]" aria-hidden />
											<span>Rank higher</span>
										</Button>
										<Button
											isSecondary
											isCircle
											as="link"
											href={`${saasBase}/dashboard`}
											aria-label="Dashboard"
										>
											<LayoutDashboard className="size-5 stroke-[1.75px]" aria-hidden />
										</Button>
										<Menu
											name={user.name ?? ""}
											email={user.email}
											image={user.image}
											username={(user as { username?: string | null }).username}
											onLogout={handleLogout}
										/>
									</>
								)}
							</>
						) : (
							!isPending && (
								<Button isPrimary as="link" href={`${saasBase}/login`}>
									Sign in
								</Button>
							)
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default Header;
