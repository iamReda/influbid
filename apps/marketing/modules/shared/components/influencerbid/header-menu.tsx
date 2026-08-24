"use client";

import { config } from "@config";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
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
import { useMemo } from "react";

const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");
const avatarsBucket = process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars";

type Props = {
	name: string;
	email?: string | null;
	image?: string | null;
	username?: string | null;
	onLogout: () => void;
};

const UserMenu = ({ name, email, image, username, onLogout }: Props) => {
	const navigation: {
		title: string;
		icon: LucideIcon;
		url: string;
	}[] = [
		{
			title: "Dashboard",
			icon: LayoutDashboard,
			url: `${saasBase}/dashboard`,
		},
		{
			title: "My Public profile",
			icon: Globe,
			url: username ? `${saasBase}/${username}` : `${saasBase}/my-profile`,
		},
		{
			title: "Account settings",
			icon: Settings,
			url: `${saasBase}/account`,
		},
		{
			title: "Payment History",
			icon: Receipt,
			url: `${saasBase}/payment-history`,
		},
	];

	const initials = useMemo(
		() =>
			name
				.split(" ")
				.slice(0, 2)
				.map((part) => part[0])
				.join("")
				.toUpperCase() || "?",
		[name],
	);

	const avatarSrc = useMemo(() => {
		if (!image) {
			return null;
		}
		if (image.startsWith("http")) {
			return image;
		}
		return `${saasBase}/image-proxy/${avatarsBucket}/${encodeURIComponent(image)}`;
	}, [image]);

	const renderAvatar = (className = "size-10 shrink-0 rounded-full object-cover") =>
		avatarSrc ? (
			<img className={className} src={avatarSrc} width={40} height={40} alt="" />
		) : (
			<span className="bg-primary1/10 text-t-primary size-10 text-sm font-bold flex shrink-0 items-center justify-center rounded-full">
				{initials}
			</span>
		);

	return (
		<Menu>
			<MenuButton
				className="size-12 border-b-surface2 before:-inset-1 before:border-stroke2 relative flex items-center justify-center overflow-hidden rounded-full border-4 outline-0 before:absolute before:z-1 before:rounded-full before:border-[1.5px] before:opacity-0 before:transition-opacity data-open:before:opacity-100"
				aria-label="Account menu"
			>
				{renderAvatar()}
			</MenuButton>
			<MenuItems
				className="w-62 shadow-hover bg-b-surface2 ease-out z-20 origin-top rounded-3xl outline-0 transition duration-200 [--anchor-gap:0.75rem] data-closed:scale-95 data-closed:opacity-0"
				anchor="bottom end"
				transition
			>
				<div className="p-3 border-stroke-subtle border-b">
					<div className="gap-3 px-1 min-w-0 flex items-center">
						{renderAvatar()}
						<div className="min-w-0 flex-1">
							<div className="text-button text-t-primary truncate">{name}</div>
							{email && <div className="text-hairline text-t-secondary truncate">{email}</div>}
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
