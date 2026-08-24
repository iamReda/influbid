"use client";

import { useSession } from "@auth/hooks/use-session";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import ThemeButton from "@repo/ui/components/influencerbid/theme-button";
import { UserAvatar } from "@shared/components/UserAvatar";
import {
	Globe,
	LayoutDashboard,
	Lightbulb,
	LogOut,
	Receipt,
	Settings,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type NavItem = {
	title: string;
	icon: LucideIcon;
	url: string;
};

type Props = {
	onLogout: () => void;
};

const UserMenu = ({ onLogout }: Props) => {
	const { user, reloadSession } = useSession();
	const [profileHref, setProfileHref] = useState("/my-profile");

	useEffect(() => {
		const ensure = async () => {
			if (!user) {
				return;
			}

			let username = user.username as string | null | undefined;
			if (!username) {
				await reloadSession();
				username = user.username as string | null | undefined;
			}

			if (username) {
				setProfileHref(`/${username}`);
			}
		};

		void ensure();
	}, [user, reloadSession]);

	if (!user) {
		return null;
	}

	const { name, email, image } = user;

	const navigation: NavItem[] = [
		{
			title: "Dashboard",
			icon: LayoutDashboard,
			url: "/dashboard",
		},
		{
			title: "My Public profile",
			icon: Globe,
			url: profileHref,
		},
		{
			title: "Account settings",
			icon: Settings,
			url: "/account",
		},
		{
			title: "Payment History",
			icon: Receipt,
			url: "/payment-history",
		},
	];

	return (
		<Menu>
			<MenuButton
				className="size-12 border-b-surface2 before:-inset-1 before:border-stroke2 relative flex items-center justify-center rounded-full border-4 outline-0 before:absolute before:z-1 before:rounded-full before:border-[1.5px] before:opacity-0 before:transition-opacity data-open:before:opacity-100"
				aria-label="Account menu"
			>
				<UserAvatar name={name ?? ""} avatarUrl={image} className="size-10" />
			</MenuButton>
			<MenuItems
				className="w-62 shadow-hover bg-b-surface2 ease-out z-20 origin-top rounded-3xl outline-0 transition duration-200 [--anchor-gap:0.75rem] data-closed:scale-95 data-closed:opacity-0"
				anchor="bottom end"
				transition
			>
				<div className="p-3 border-stroke-subtle border-b">
					<div className="gap-3 px-1 min-w-0 flex items-center">
						<UserAvatar name={name ?? ""} avatarUrl={image} className="size-10 shrink-0" />
						<div className="min-w-0 flex-1">
							<div className="text-button text-t-primary truncate">{name}</div>
							<div className="text-hairline text-t-secondary truncate">{email}</div>
						</div>
					</div>
				</div>
				<div className="p-3">
					<div className="">
						{navigation.map((item) => {
							const ItemIcon = item.icon;

							return (
								<MenuItem key={item.url}>
									<Link
										className="h-12 px-3 text-hairline font-medium text-t-secondary hover:bg-b-highlight hover:text-t-primary flex w-full items-center rounded-2xl transition-colors"
										href={item.url}
									>
										<ItemIcon className="mr-4 size-5 shrink-0 stroke-[1.75px]" aria-hidden />
										{item.title}
									</Link>
								</MenuItem>
							);
						})}
					</div>
				</div>
				<div className="p-3 border-stroke-subtle border-t">
					<div className="h-12 pl-3 text-hairline text-t-secondary max-md:flex hidden w-full items-center">
						<Lightbulb className="mr-4 size-5 shrink-0 stroke-[1.75px]" aria-hidden />
						<div className="">Theme</div>
						<ThemeButton className="ml-auto" isHorizontal />
					</div>
					<button
						type="button"
						className="h-12 px-3 text-hairline font-medium text-t-secondary hover:bg-b-highlight hover:text-t-primary flex w-full items-center rounded-2xl transition-colors"
						onClick={onLogout}
					>
						<LogOut className="mr-4 size-5 shrink-0 stroke-[1.75px]" aria-hidden />
						Log out
					</button>
				</div>
			</MenuItems>
		</Menu>
	);
};

export default UserMenu;
