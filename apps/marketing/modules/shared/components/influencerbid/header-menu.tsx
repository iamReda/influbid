"use client";

import { config } from "@config";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Image from "@repo/ui/components/influencerbid/image";
import ThemeButton from "@repo/ui/components/influencerbid/theme-button";
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

const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");

const navigation: {
	title: string;
	icon: LucideIcon;
	url: string;
}[] = [
	{
		title: "Dashboard",
		icon: LayoutDashboard,
		url: `${saasBase}/my-dashboard`,
	},
	{
		title: "My Public profile",
		icon: Globe,
		url: `${saasBase}/my-profile`,
	},
	{
		title: "Account settings",
		icon: Settings,
		url: `${saasBase}/my-settings`,
	},
	{
		title: "Payment History",
		icon: Receipt,
		url: `${saasBase}/payment-history`,
	},
];

type Props = {
	onLogout: () => void;
};

const UserMenu = ({ onLogout }: Props) => {
	return (
		<Menu>
			<MenuButton className="size-12 border-b-surface2 before:-inset-1 before:border-stroke2 relative flex rounded-full border-4 outline-0 before:absolute before:z-1 before:rounded-full before:border-[1.5px] before:opacity-0 before:transition-opacity data-open:before:opacity-100">
				<Image
					className="size-10 rounded-full object-cover opacity-100"
					src="/images/avatar.png"
					width={40}
					height={40}
					alt="Avatar"
				/>
			</MenuButton>
			<MenuItems
				className="w-62 shadow-hover bg-b-surface2 ease-out z-20 origin-top rounded-3xl outline-0 transition duration-200 [--anchor-gap:0.75rem] data-closed:scale-95 data-closed:opacity-0"
				anchor="bottom end"
				transition
			>
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
