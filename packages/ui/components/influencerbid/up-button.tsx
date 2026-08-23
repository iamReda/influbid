"use client";

import { usePathname } from "next/navigation";

import Button from "./button";
import Icon from "./icon";
import useScrollPosition from "./use-scroll-position";

const UpButton = () => {
	const scrollPosition = useScrollPosition();

	const pathname = usePathname();

	const goTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<Button
			className={`right-5 bottom-5 px-0! max-md:hidden max-md:bottom-4 max-md:right-4 fixed! z-5 transition-all! [&_svg]:-rotate-90 ${
				scrollPosition > 100 ? "opacity-100" : "opacity-0"
			} ${pathname === "/" || pathname === "/home" || pathname === "/about" ? "max-md:flex!" : ""}`}
			onClick={goTop}
			isPrimary
			isCircle
		>
			<Icon name="arrow" />
		</Button>
	);
};

export default UpButton;
