"use client";

import { usePathname } from "next/navigation";

export function AuthBackground() {
	const pathname = usePathname();
	const isLogin = pathname === "/login";

	if (isLogin) {
		return (
			<>
				<video
					className="inset-0 fixed size-full object-cover"
					src="/videos/login.mp4"
					autoPlay
					muted
					loop
					playsInline
					aria-hidden
				/>
				{/* Keep the form readable over motion */}
				<div className="inset-0 max-md:bg-[#141414]/70 pointer-events-none fixed bg-[#141414]/55" />
			</>
		);
	}

	return <div className="inset-0 max-md:bg-b-surface1 pointer-events-none fixed bg-[#282828]/90" />;
}
