"use client";

import { Check, Copy, Eye, SquarePen, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

const Actions = ({ username }: { username: string }) => {
	const [toastVisible, setToastVisible] = useState(false);
	const profilePath = `/${username}`;

	useEffect(() => {
		if (!toastVisible) {
			return;
		}

		const timeout = setTimeout(() => setToastVisible(false), 2200);
		return () => clearTimeout(timeout);
	}, [toastVisible]);

	const copyProfileLink = async () => {
		const profileLink = `${window.location.origin}${profilePath}?preview=1`;

		try {
			await navigator.clipboard.writeText(profileLink);
		} catch {
			const input = document.createElement("input");
			input.value = profileLink;
			document.body.appendChild(input);
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
		}

		setToastVisible(true);
	};

	const actions: {
		title: string;
		icon: LucideIcon;
		onClick: () => void;
	}[] = [
		{
			title: "Copy link",
			icon: Copy,
			onClick: copyProfileLink,
		},
		{
			title: "Preview",
			icon: Eye,
			onClick: () => {
				window.open(`${profilePath}?preview=1`, "_blank", "noopener,noreferrer");
			},
		},
		{
			title: "Edit profile",
			icon: SquarePen,
			onClick: () => {
				window.location.href = `${profilePath}/edit`;
			},
		},
	];

	return (
		<>
			<div className="bottom-5 gap-1 p-1.5 bg-b-surface2 shadow-hover fixed left-1/2 z-5 flex -translate-x-1/2 rounded-full">
				{actions.map((action) => {
					const ActionIcon = action.icon;

					return (
						<button
							className="group size-11 px-2.5 text-button text-t-primary hover:w-32 hover:bg-b-surface1 hover:text-t-primary flex items-center overflow-hidden rounded-full text-nowrap transition-all duration-400 hover:justify-center"
							key={action.title}
							type="button"
							onClick={action.onClick}
						>
							<ActionIcon className="size-5 shrink-0 stroke-[1.75px]" aria-hidden />
							<div className="ml-2 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
								{action.title}
							</div>
						</button>
					);
				})}
			</div>

			<div
				className={`pointer-events-none fixed left-1/2 z-10 -translate-x-1/2 transition-all duration-300 ${
					toastVisible ? "bottom-22 visible opacity-100" : "bottom-18 invisible opacity-0"
				}`}
				role="status"
				aria-live="polite"
			>
				<div className="gap-2 bg-b-dark1 px-4 py-2.5 text-button text-t-light shadow-hover inline-flex items-center rounded-full">
					<Check className="size-4 shrink-0 stroke-[2px]" aria-hidden />
					Profile link copied!
				</div>
			</div>
		</>
	);
};

export default Actions;
