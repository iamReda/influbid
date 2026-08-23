import { Footer } from "@shared/components/Footer";
import { NavBar } from "@shared/components/NavBar";
import type { PropsWithChildren } from "react";

export default function SiteLayout({ children }: PropsWithChildren) {
	return (
		<>
			<NavBar />
			<main className="min-h-screen">{children}</main>
			<Footer />
		</>
	);
}
