"use client";

import { Rocket } from "lucide-react";

import Button from "./button";

type RankHigherButtonProps = {
	href: string;
};

const RankHigherButton = ({ href }: RankHigherButtonProps) => {
	return (
		<div className="rank-higher-gemini">
			<div aria-hidden className="rank-higher-gemini__border" />
			<Button
				as="link"
				href={href}
				aria-label="Rank higher"
				className="header-action-btn rank-higher-gemini__btn max-md:gap-0! max-md:w-12 max-md:px-0"
			>
				<Rocket
					className="size-5 max-md:mr-0 md:mr-2 md:size-4 stroke-current stroke-[1.75px]"
					aria-hidden
				/>
				<span className="max-md:hidden">Rank higher</span>
			</Button>
		</div>
	);
};

export default RankHigherButton;
