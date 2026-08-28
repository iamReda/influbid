import { config } from "@config";
import { cn } from "@repo/ui";
import Image from "@repo/ui/components/influencerbid/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";

import { AuthBackground } from "./AuthBackground";

export async function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	const marketingUrl = (config.marketingUrl ?? "http://localhost:3001").replace(/\/$/, "");

	return (
		<div className="bg-b-surface1 font-satoshi text-t-primary p-4 max-md:p-0 relative flex min-h-screen w-full items-center justify-center">
			<AuthBackground />
			<div
				className={cn(
					"max-w-120 p-16 bg-b-surface1 shadow-hover max-md:min-h-screen max-md:rounded-none max-md:px-6 max-md:pb-12 max-md:pt-16 relative z-10 m-auto w-full rounded-4xl",
					contentClass,
				)}
			>
				<div className="mb-8 flex justify-center">
					<Link href={marketingUrl} className="w-33.75">
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
				</div>
				{children}
			</div>
		</div>
	);
}
