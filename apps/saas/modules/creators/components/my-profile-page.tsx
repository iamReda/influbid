"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Icon from "@repo/ui/components/influencerbid/icon";
import Image from "@repo/ui/components/influencerbid/image";
import Layout from "@shared/components/influencerbid/layout";
import SocialPlatformIcon, { type Platform } from "@shared/components/social-platform-icon";
import { Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";

import Actions from "./my-profile-actions";
import { content } from "./my-profile-content";

const PROFILE = {
	name: "Luna Martinez",
	avatar: "/images/avatar-2.png",
	email: "luna@example.com",
};

const SOCIALS: {
	platform: Platform;
	url: string;
}[] = [
	{
		platform: "instagram",
		url: "https://instagram.com/lunamartinez",
	},
	{
		platform: "tiktok",
		url: "https://tiktok.com/@lunamartinez",
	},
	{
		platform: "facebook",
		url: "https://facebook.com/lunamartinez",
	},
	{
		platform: "twitch",
		url: "https://twitch.tv/lunamartinez",
	},
];

const MyProfilePage = () => {
	const searchParams = useSearchParams();
	const isPreview = searchParams.get("preview") === "1";

	return (
		<Layout isFixedHeader isHiddenFooter isLoggedIn={!isPreview}>
			<div className="pt-34 px-6 pb-38 max-2xl:pt-32 max-2xl:px-11 max-2xl:pb-33 max-xl:pt-30 max-lg:pt-28 max-md:pt-22 max-md:px-4 max-md:pb-24">
				<div className="max-w-170 p-12 shadow-hover bg-b-surface4 before:left-6 before:right-6 before:h-3.75 before:bg-b-surface2 max-md:px-8 max-md:pb-4 max-md:before:hidden relative mx-auto rounded-4xl before:absolute before:top-full before:-z-1 before:rounded-b-4xl">
					<div className="mb-14 gap-4 max-md:mb-10 flex w-full flex-col items-center">
						<div className="influencer-avatar influencer-avatar-xl w-44 bg-b-surface1 max-md:w-32 relative aspect-square overflow-hidden">
							<Image
								className="size-full object-cover object-center opacity-100"
								src={PROFILE.avatar}
								width={176}
								height={176}
								alt={`${PROFILE.name} profile photo`}
							/>
						</div>
						<div className="flex w-full justify-center">
							<div className="gap-2.5 inline-flex max-w-full items-center justify-center">
								<h1 className="text-h3 max-md:text-h5 truncate leading-none">{PROFILE.name}</h1>
								<Icon
									className="size-6! fill-t-blue max-md:size-5! shrink-0 self-center"
									name="verification"
								/>
							</div>
						</div>
						<div className="mt-3 gap-4 flex items-center justify-center">
							{SOCIALS.map((social) => (
								<a
									key={social.platform}
									className="inline-flex transition-opacity hover:opacity-80"
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Open ${PROFILE.name} on ${social.platform}`}
								>
									<SocialPlatformIcon
										platform={social.platform}
										className="size-8 max-md:size-7 shrink-0"
										colored
									/>
								</a>
							))}
						</div>
					</div>
					<div className="text-body text-t-primary-body [&_p]:not-last:mb-6">
						{content.introduction}
					</div>
					<div className="mt-10 flex justify-center">
						<Button
							className="h-10! px-5 max-md:w-full"
							isSecondary
							as="a"
							href={`mailto:${PROFILE.email}`}
						>
							<Mail className="mr-2 size-4 shrink-0 stroke-[1.75px]" aria-hidden />
							Contact for Business
						</Button>
					</div>
				</div>
			</div>
			{!isPreview && <Actions />}
		</Layout>
	);
};

export default MyProfilePage;
