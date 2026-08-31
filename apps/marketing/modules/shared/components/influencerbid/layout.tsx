"use client";

import UpButton from "@repo/ui/components/influencerbid/up-button";
import type { ReactNode } from "react";

import Footer from "./footer";
import Header from "./header";

type Props = {
	className?: string;
	classContainer?: string;
	isFixedHeader?: boolean;
	isLoggedIn?: boolean;
	isVisiblePlan?: boolean;
	isHiddenFooter?: boolean;
	isMinimalHeader?: boolean;
	children: ReactNode;
};

const Layout = ({
	className,
	classContainer,
	isFixedHeader,
	isVisiblePlan,
	isHiddenFooter,
	isMinimalHeader,
	children,
}: Props) => {
	return (
		<div
			className={`bg-b-surface1 font-satoshi text-t-primary flex min-h-screen flex-col text-[1rem] antialiased ${
				isVisiblePlan ? "relative" : ""
			} ${className || ""}`}
		>
			{isVisiblePlan && (
				<>
					<div className="left-0 top-0 right-0 h-32 from-b-surface1 max-md:h-22 max-md:from-80% pointer-events-none fixed z-2 bg-linear-to-b from-50% to-transparent"></div>
					<div className="left-0 bottom-0 right-0 h-32 from-b-surface1 max-md:h-22 max-md:from-80% pointer-events-none fixed z-2 bg-linear-to-t from-50% to-transparent"></div>
				</>
			)}
			<Header isFixed={isFixedHeader} isVisiblePlan={isVisiblePlan} isMinimal={isMinimalHeader} />
			<div className={`grow ${classContainer || ""}`}>{children}</div>
			{!isHiddenFooter && <Footer />}
			<UpButton />
		</div>
	);
};

export default Layout;
