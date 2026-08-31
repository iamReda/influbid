"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
	title: string;
	url: string;
};

type HeaderMobileNavProps = {
	items: NavItem[];
};

const getItemPathname = (url: string) => {
	if (url.startsWith("http")) {
		try {
			return new URL(url).pathname;
		} catch {
			return url;
		}
	}

	return url;
};

const HeaderMobileNav = ({ items }: HeaderMobileNavProps) => {
	const pathname = usePathname();

	return (
		<Menu as="div" className="md:hidden">
			<MenuButton
				className="header-action-btn h-12 w-12 text-button hover:shadow-hover inline-flex cursor-pointer items-center justify-center rounded-full border-[1.5px] outline-0 transition-all"
				aria-label="Open navigation menu"
			>
				<MenuIcon className="size-5 stroke-current stroke-[1.75px]" aria-hidden />
			</MenuButton>
			<MenuItems
				className="shadow-hover bg-b-surface2 ease-out w-56 z-20 origin-top rounded-3xl outline-0 transition duration-200 [--anchor-gap:0.75rem] data-closed:scale-95 data-closed:opacity-0"
				anchor="bottom end"
				transition
			>
				<div className="p-3">
					{items.map((item) => {
						const itemPath = getItemPathname(item.url);
						const isActive =
							itemPath === "/"
								? pathname === "/"
								: pathname === itemPath || pathname.startsWith(`${itemPath}/`);

						return (
							<MenuItem key={item.url}>
								<Link
									className={`text-hairline h-12 px-3 font-medium flex w-full items-center rounded-2xl transition-colors ${
										isActive
											? "bg-b-highlight text-t-primary"
											: "text-t-secondary hover:bg-b-highlight hover:text-t-primary"
									}`}
									href={item.url}
								>
									{item.title}
								</Link>
							</MenuItem>
						);
					})}
				</div>
			</MenuItems>
		</Menu>
	);
};

export default HeaderMobileNav;
