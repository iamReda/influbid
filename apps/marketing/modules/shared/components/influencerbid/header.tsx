"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Image from "@repo/ui/components/influencerbid/image";
import Modal from "@repo/ui/components/influencerbid/modal";
import { Rocket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import Menu from "./header-menu";
import Plan from "./header-plan";
import Login from "./login";

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
	onLogin: () => void;
	onLogout: () => void;
};

const Header = ({ isFixed, login, isVisiblePlan, isMinimal, onLogin, onLogout }: HeaderProps) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<>
			<div
				className={`p-5 max-md:p-4 relative z-50 flex items-center ${
					isFixed ? "top-0 left-0 right-0 fixed!" : ""
				}`}
			>
				<Link className="w-33.75 shrink-0" href="/">
					<Image
						className="w-full opacity-100 dark:hidden!"
						src="/images/logo-dark.svg"
						width={135}
						height={36}
						alt="Logo"
					/>
					<Image
						className="hidden! w-full opacity-100 dark:block!"
						src="/images/logo-light.svg"
						width={135}
						height={36}
						alt="Logo"
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
							<Button
								className="max-sm:px-4"
								isSecondary
								as="link"
								href="/rank-higher"
								aria-label="Rank higher"
							>
								<Rocket className="mr-2 size-4 max-sm:mr-0 stroke-[1.75px]" aria-hidden />
								<span className="max-sm:hidden">Rank higher</span>
							</Button>
							{login ? (
								<Menu onLogout={onLogout} />
							) : (
								<Button isPrimary onClick={() => setIsMenuOpen(true)}>
									Sign in
								</Button>
							)}
						</div>
					</>
				)}
			</div>
			{!isMinimal && (
				<Modal open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
					<Login
						onLogin={() => {
							onLogin();
							setIsMenuOpen(false);
						}}
					/>
				</Modal>
			)}
		</>
	);
};

export default Header;
