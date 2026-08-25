"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Icon from "@repo/ui/components/influencerbid/icon";
import Layout from "@shared/components/influencerbid/layout";
import { useEffect, useState } from "react";

const CONFETTI_COLORS = ["#52721a", "#1c7ed6", "#f5c542", "#e8590c", "#ae3ec9", "#0ca678"];

type ConfettiPiece = {
	id: number;
	left: string;
	delay: string;
	duration: string;
	color: string;
	size: string;
	rotate: string;
};

const PaymentSuccessPage = ({ email }: { email: string }) => {
	const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

	useEffect(() => {
		setPieces(
			Array.from({ length: 36 }, (_, index) => ({
				id: index,
				left: `${(index * 17) % 100}%`,
				delay: `${(index % 12) * 0.12}s`,
				duration: `${2.4 + (index % 5) * 0.35}s`,
				color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]!,
				size: `${6 + (index % 4) * 2}px`,
				rotate: `${(index * 47) % 360}deg`,
			})),
		);
	}, []);

	return (
		<Layout isFixedHeader isHiddenFooter>
			<div className="pt-34 px-6 pb-38 max-2xl:pt-32 max-2xl:px-11 max-2xl:pb-33 max-xl:pt-30 max-lg:pt-28 max-md:pt-22 max-md:px-4 max-md:pb-24">
				<div className="relative overflow-hidden">
					<div className="inset-0 pointer-events-none absolute overflow-hidden" aria-hidden>
						{pieces.map((piece) => (
							<span
								key={piece.id}
								className="influencer-confetti top-0 absolute rounded-sm opacity-90"
								style={{
									left: piece.left,
									width: piece.size,
									height: piece.size,
									backgroundColor: piece.color,
									animationDelay: piece.delay,
									animationDuration: piece.duration,
									transform: `rotate(${piece.rotate})`,
								}}
							/>
						))}
					</div>

					<div className="max-w-170 p-12 shadow-hover bg-b-surface4 before:left-6 before:right-6 before:h-3.75 before:bg-b-surface2 max-md:px-8 max-md:pb-8 max-md:before:hidden relative mx-auto rounded-4xl before:absolute before:top-full before:-z-1 before:rounded-b-4xl">
						<div className="mb-8 flex justify-center">
							<div className="size-16 bg-primary1/10 flex items-center justify-center rounded-full">
								<Icon className="size-8! fill-t-blue" name="verification" />
							</div>
						</div>
						<h1 className="mb-4 text-h2 max-md:text-h3 text-center">Payment successful</h1>
						<p className="text-body-lg text-t-secondary leading-relaxed text-center">
							Your profile is now live. Check your inbox at {email} and click the secure link we
							sent you to access your dashboard.
						</p>
						<div className="mt-10 gap-3 flex flex-wrap justify-center">
							<Button isSecondary as="link" href="/">
								Back to rankings
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default PaymentSuccessPage;
