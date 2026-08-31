"use client";

import { config } from "@config";
import SocialPlatformIcon, {
	PLATFORM_LABEL,
	type Platform,
} from "@home/influencerbid/bid-form/social-platform-icon";
import { getPublicAvatarUrl } from "@home/influencerbid/lib/format";
import { CountryFlag } from "@repo/ui/components/influencerbid/country-flag";
import Image from "@repo/ui/components/influencerbid/image";
import Layout from "@shared/components/influencerbid/layout";
import { Mail } from "lucide-react";

import ReportAccountButton from "./report-account-button";

export type PublicCreatorView = {
	publicName: string;
	username: string;
	avatarUrl: string;
	description: string | null;
	countryCode: string | null;
	businessEmail: string | null;
	categoryName: string;
	generalRank: number;
	categoryRank: number;
	totalBidCents: number;
	socials: Array<{
		id: string;
		platform: string;
		url: string;
	}>;
};

const toPlatform = (value: string): Platform | null => {
	return value in PLATFORM_LABEL ? (value as Platform) : null;
};

const getInitials = (name: string) =>
	name
		.split(" ")
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

const profileActionClass =
	"h-14 gap-3 bg-b-surface1 px-5 text-button text-t-primary hover:shadow-hover flex w-full items-center justify-center rounded-full transition-shadow";

const contactActionClass =
	"h-14 gap-3 bg-b-dark1 px-5 text-button text-t-light fill-t-light hover:bg-b-dark2 flex w-full items-center justify-center rounded-full transition-colors";

const PublicCreatorProfile = ({ creator }: { creator: PublicCreatorView }) => {
	const avatarSrc = getPublicAvatarUrl(creator.avatarUrl);
	const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");
	const socials = creator.socials
		.map((social) => ({
			...social,
			platform: toPlatform(social.platform),
		}))
		.filter(
			(social): social is { id: string; platform: Platform; url: string } =>
				social.platform !== null,
		);
	const businessEmail = creator.businessEmail?.trim() || null;

	return (
		<Layout isFixedHeader isHiddenFooter>
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
									alt={`${creator.publicName} profile photo`}
								/>
							) : (
								<div className="text-h2 text-t-secondary flex size-full items-center justify-center">
									{getInitials(creator.publicName)}
								</div>
							)}
						</div>
						<div className="flex w-full justify-center">
							<div className="gap-2.5 inline-flex max-w-full items-center justify-center">
								<h1 className="text-h3 max-md:text-h5 truncate leading-none">
									{creator.publicName}
								</h1>
								<CountryFlag
									countryCode={creator.countryCode}
									size="md"
									className="shrink-0 self-center"
								/>
							</div>
						</div>
					</div>

					{creator.description ? (
						<div className="mb-8 text-body-lg text-t-primary-body max-md:mb-6 text-center whitespace-pre-wrap">
							{creator.description}
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

					{businessEmail && socials.length > 0 && (
						<div className="mb-8 max-md:mb-6 bg-stroke1 h-px w-full" role="separator" />
					)}

					{socials.length > 0 && (
						<div className="gap-3 flex w-full flex-col">
							{socials.map((social) => (
								<a
									key={social.id}
									className={profileActionClass}
									href={`${saasBase}/out/social/${social.id}`}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Open ${creator.publicName} on ${PLATFORM_LABEL[social.platform]}`}
								>
									<SocialPlatformIcon
										platform={social.platform}
										className="size-7 shrink-0"
										colored
									/>
									<span>{PLATFORM_LABEL[social.platform]}</span>
								</a>
							))}
						</div>
					)}
				</div>
				<ReportAccountButton username={creator.username} publicName={creator.publicName} />
			</div>
		</Layout>
	);
};

export default PublicCreatorProfile;
