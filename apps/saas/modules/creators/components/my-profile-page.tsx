"use client";

import { detectPlatform, getAvatarSrc, getInitials } from "@creators/lib/profile";
import type { PublicProfile } from "@repo/database";
import { CountryFlag } from "@repo/ui/components/influencerbid/country-flag";
import Image from "@repo/ui/components/influencerbid/image";
import Layout from "@shared/components/influencerbid/layout";
import SocialPlatformIcon, { type Platform } from "@shared/components/social-platform-icon";
import { Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";

import Actions from "./my-profile-actions";
import ReportAccountButton from "./report-account-button";

export type ProfileSocialLink = {
	id: string;
	url: string;
};

const PLATFORM_LABEL: Record<Platform, string> = {
	tiktok: "TikTok",
	instagram: "Instagram",
	facebook: "Facebook",
	twitch: "Twitch",
	youtube: "YouTube",
	x: "X",
	linkedin: "LinkedIn",
	snapchat: "Snapchat",
	pinterest: "Pinterest",
	threads: "Threads",
	kick: "Kick",
	discord: "Discord",
	reddit: "Reddit",
	telegram: "Telegram",
};

const profileActionClass =
	"h-14 gap-3 bg-b-surface1 px-5 text-button text-t-primary hover:shadow-hover flex w-full items-center justify-center rounded-full transition-shadow";

const contactActionClass =
	"h-14 gap-3 bg-b-dark1 px-5 text-button text-t-light fill-t-light hover:bg-b-dark2 flex w-full items-center justify-center rounded-full transition-colors";

type MyProfilePageProps = {
	profile: PublicProfile & { countryCode?: string | null };
	socials?: ProfileSocialLink[];
	mode?: "view" | "preview";
	/** Owner-only floating actions (copy / preview / edit). Guests never see them. */
	isOwner?: boolean;
};

const MyProfilePage = ({
	profile,
	socials,
	mode = "view",
	isOwner = false,
}: MyProfilePageProps) => {
	const searchParams = useSearchParams();
	const isPreview = mode === "preview" || (mode === "view" && searchParams.get("preview") === "1");
	const showOwnerActions = isOwner && !isPreview;
	const avatarSrc = getAvatarSrc(profile.image);
	const socialLinks = (socials ?? profile.socialLinks.map((url) => ({ id: url, url })))
		.map((social) => ({
			...social,
			platform: detectPlatform(social.url),
		}))
		.filter((item): item is ProfileSocialLink & { platform: Platform } => item.platform !== null);
	const businessEmail = profile.businessEmail?.trim() || null;

	return (
		<Layout isFixedHeader isHiddenFooter isLoggedIn={!isPreview}>
			<div className="pt-34 px-6 pb-38 max-2xl:pt-32 max-2xl:px-11 max-2xl:pb-33 max-xl:pt-30 max-lg:pt-28 max-md:pt-22 max-md:px-4 max-md:pb-24">
				<div className="max-w-170 p-12 shadow-hover bg-b-surface4 before:left-6 before:right-6 before:h-3.75 before:bg-b-surface2 max-md:px-8 max-md:pb-4 max-md:before:hidden relative mx-auto rounded-4xl before:absolute before:top-full before:-z-1 before:rounded-b-4xl">
					<div className="mb-8 gap-8 max-md:mb-6 max-md:gap-6 flex w-full flex-col items-center">
						<div className="influencer-avatar influencer-avatar-xl w-44 bg-b-surface1 max-md:w-32 relative aspect-square overflow-hidden">
							{avatarSrc ? (
								<Image
									className="size-full object-cover object-center opacity-100"
									src={avatarSrc}
									width={176}
									height={176}
									unoptimized
									alt={`${profile.name} profile photo`}
								/>
							) : (
								<div className="text-h2 text-t-secondary flex size-full items-center justify-center">
									{getInitials(profile.name)}
								</div>
							)}
						</div>
						<div className="flex w-full justify-center">
							<div className="gap-2.5 inline-flex max-w-full items-center justify-center">
								<h1 className="text-h3 max-md:text-h5 truncate leading-none">{profile.name}</h1>
								<CountryFlag
									countryCode={profile.countryCode}
									size="md"
									className="shrink-0 self-center"
								/>
							</div>
						</div>
					</div>

					{profile.bio ? (
						<div className="mb-8 text-body-lg text-t-primary-body max-md:mb-6 text-center whitespace-pre-wrap">
							{profile.bio}
						</div>
					) : (
						<p className="mb-8 text-body-lg text-t-tertiary max-md:mb-6 text-center">
							No description yet.
						</p>
					)}

					{businessEmail && (
						<a
							className={`${contactActionClass} mb-8 max-md:mb-6`}
							href={`mailto:${businessEmail}`}
						>
							<Mail className="size-5 shrink-0 stroke-[1.75px]" aria-hidden />
							<span>Contact for Business</span>
						</a>
					)}

					{businessEmail && socialLinks.length > 0 && (
						<div className="mb-8 max-md:mb-6 bg-stroke1 h-px w-full" role="separator" />
					)}

					{socialLinks.length > 0 && (
						<div className="gap-3 flex w-full flex-col">
							{socialLinks.map((social) => {
								const href =
									isOwner || isPreview || !socials ? social.url : `/out/social/${social.id}`;

								return (
									<a
										key={social.id}
										className={profileActionClass}
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={`Open ${profile.name} on ${PLATFORM_LABEL[social.platform]}`}
									>
										<SocialPlatformIcon
											platform={social.platform}
											className="size-7 shrink-0"
											colored
										/>
										<span>{PLATFORM_LABEL[social.platform]}</span>
									</a>
								);
							})}
						</div>
					)}
				</div>
				{!isOwner && !isPreview && (
					<ReportAccountButton username={profile.username} publicName={profile.name} />
				)}
			</div>
			{showOwnerActions && <Actions username={profile.username} />}
		</Layout>
	);
};

export default MyProfilePage;
