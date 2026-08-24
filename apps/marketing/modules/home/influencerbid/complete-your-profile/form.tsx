"use client";

import SocialPlatformIcon, {
	type Platform,
} from "@home/influencerbid/bid-form/social-platform-icon";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import Icon from "@repo/ui/components/influencerbid/icon";
import Image from "@repo/ui/components/influencerbid/image";
import { useEffect, useState, type ChangeEvent } from "react";

type ExtraSocial = {
	id: number;
	url: string;
};

const DESCRIPTION_MAX = 160;

const SOCIAL_PLATFORMS: Platform[] = ["tiktok", "instagram", "facebook", "twitch"];

const platformLabels: Record<Platform, string> = {
	tiktok: "TikTok",
	instagram: "Instagram",
	facebook: "Facebook",
	twitch: "Twitch",
};

const detectPlatform = (value: string): Platform | null => {
	const url = value.toLowerCase();

	if (url.includes("tiktok.com")) {
		return "tiktok";
	}

	if (url.includes("instagram.com")) {
		return "instagram";
	}

	if (url.includes("facebook.com") || url.includes("fb.com")) {
		return "facebook";
	}

	if (url.includes("twitch.tv")) {
		return "twitch";
	}

	return null;
};

const SocialUrlField = ({
	value,
	onChange,
	placeholder,
	ariaLabel,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	ariaLabel: string;
}) => {
	const [cycleIndex, setCycleIndex] = useState(0);
	const detectedPlatform = detectPlatform(value.trim());
	const activePlatform = detectedPlatform ?? SOCIAL_PLATFORMS[cycleIndex];
	const isLocked = !!detectedPlatform;

	useEffect(() => {
		if (detectedPlatform) {
			return;
		}

		const interval = setInterval(() => {
			setCycleIndex((current) => (current + 1) % SOCIAL_PLATFORMS.length);
		}, 2000);

		return () => clearInterval(interval);
	}, [detectedPlatform]);

	return (
		<div className="relative">
			<div
				className={`left-4 size-7 pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full transition-colors ${
					isLocked
						? "bg-primary1 text-white"
						: "bg-b-surface1 text-t-secondary shadow-[inset_0_0_0_1.5px_var(--color-stroke1)]"
				}`}
			>
				<SocialPlatformIcon
					key={activePlatform}
					platform={activePlatform}
					className="size-4 shrink-0"
				/>
			</div>
			<input
				type="url"
				className="h-12 border-stroke1 pl-13 pr-6.5 font-medium text-t-primary placeholder:text-t-tertiary max-md:text-[1rem] w-full rounded-3xl border-[1.5px] bg-transparent text-input outline-0 transition-colors focus:border-[#A8A8A8]/50!"
				value={value}
				placeholder={placeholder}
				aria-label={ariaLabel}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
};

const Form = () => {
	const [avatarPreview, setAvatarPreview] = useState("/images/avatar.png");
	const [publicName, setPublicName] = useState("Luna Martinez");
	const [description, setDescription] = useState(
		"Fashion & lifestyle creator sharing daily inspiration, style tips, and brand-friendly content.",
	);
	const [primaryUrl, setPrimaryUrl] = useState("https://instagram.com/lunamartinez");
	const [email, setEmail] = useState("luna@example.com");
	const [extraSocials, setExtraSocials] = useState<ExtraSocial[]>([]);
	const [nextSocialId, setNextSocialId] = useState(1);

	const primaryPlatform = detectPlatform(primaryUrl.trim());

	const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		setAvatarPreview(URL.createObjectURL(file));
	};

	const addSocialProfile = () => {
		setExtraSocials((current) => [...current, { id: nextSocialId, url: "" }]);
		setNextSocialId((current) => current + 1);
	};

	const updateExtraSocial = (id: number, url: string) => {
		setExtraSocials((current) => current.map((item) => (item.id === id ? { ...item, url } : item)));
	};

	const removeExtraSocial = (id: number) => {
		setExtraSocials((current) => current.filter((item) => item.id !== id));
	};

	return (
		<div className="max-w-2xl mx-auto flex w-full flex-col">
			<div className="mb-10 max-md:mb-8">
				<h1 className="text-h2 max-md:text-h3">Complete your profile</h1>
			</div>

			<section className="mb-10 bg-b-surface2 p-5 max-md:mb-8 rounded-3xl">
				<h2 className="mb-5 text-h5 text-t-primary">Profile details</h2>
				<div className="gap-5 max-sm:flex-col flex items-start">
					<div className="shrink-0">
						<div className="influencer-avatar group size-28 bg-b-surface1 after:inset-0 max-md:size-24 relative overflow-hidden after:absolute after:z-1 after:bg-[#141414]/30 after:opacity-0 after:transition-opacity hover:after:opacity-100">
							<Image
								className="size-full object-cover opacity-100"
								src={avatarPreview}
								width={112}
								height={112}
								alt="Profile photo"
							/>
							<input
								className="inset-0 absolute z-3 cursor-pointer opacity-0"
								type="file"
								accept="image/png,image/jpeg"
								aria-label="Upload profile photo"
								onChange={handleAvatarChange}
							/>
							<Icon
								className="absolute top-1/2 left-1/2 z-2 -translate-x-1/2 -translate-y-1/2 fill-[#FDFDFD] opacity-0 transition-opacity group-hover:opacity-100"
								name="camera-stroke"
							/>
						</div>
						<p className="mt-2 max-w-28 leading-tight text-t-tertiary max-md:max-w-24 text-center text-[0.625rem]">
							Click to upload image
						</p>
					</div>
					<div className="min-w-0 gap-5 flex flex-1 flex-col">
						<Field
							label="Public name"
							value={publicName}
							onChange={(event) => setPublicName(event.target.value)}
							name="public-name"
							placeholder="e.g. Luna Martinez"
							required
						/>
						<div>
							<Field
								classInput="h-28!"
								label="Short description"
								value={description}
								onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX))}
								name="short-description"
								placeholder="Share what you create in one short sentence"
								isTextarea
								maxLength={DESCRIPTION_MAX}
							/>
							<div className="mt-2 text-small text-t-tertiary flex justify-between">
								<span>Optional — keep it short and clear.</span>
								<span>
									{description.length}/{DESCRIPTION_MAX}
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="mb-10 max-md:mb-8">
				<h2 className="mb-5 text-h5 text-t-primary">Social profiles</h2>
				<div className="gap-3 flex flex-col">
					<div className="bg-b-surface2 p-4 rounded-3xl">
						<div className="mb-3 gap-2.5 flex items-center">
							<span className="h-6 border-primary1/15 bg-primary1/5 px-2.5 text-hairline text-t-blue flex items-center rounded-full border-[1.5px]">
								Primary
							</span>
							<span className="text-button text-t-primary">
								{primaryPlatform ? platformLabels[primaryPlatform] : "Primary profile"}
							</span>
						</div>
						<SocialUrlField
							value={primaryUrl}
							onChange={setPrimaryUrl}
							placeholder="Paste your main social profile link"
							ariaLabel="Primary social profile URL"
						/>
					</div>

					{extraSocials.map((item) => {
						const platform = detectPlatform(item.url.trim());

						return (
							<div className="bg-b-surface2 p-4 rounded-3xl" key={item.id}>
								{platform && (
									<div className="mb-3 text-button text-t-primary">{platformLabels[platform]}</div>
								)}
								<div className="gap-3 flex items-center">
									<div className="min-w-0 flex-1">
										<SocialUrlField
											value={item.url}
											onChange={(url) => updateExtraSocial(item.id, url)}
											placeholder="Paste another social profile link"
											ariaLabel="Additional social profile URL"
										/>
									</div>
									<Button
										className="shrink-0"
										isCircle
										isStroke
										type="button"
										aria-label="Remove social profile"
										onClick={() => removeExtraSocial(item.id)}
									>
										<Icon name="close" />
									</Button>
								</div>
							</div>
						);
					})}
				</div>

				<Button className="mt-4" isPrimary type="button" icon="plus" onClick={addSocialProfile}>
					Add another social profile
				</Button>
			</section>

			<section className="mb-10 bg-b-surface2 p-5 max-md:mb-8 rounded-3xl">
				<h2 className="mb-5 text-h5 text-t-primary">Email</h2>
				<Field
					label="Email address"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					name="email"
					type="email"
					placeholder="you@example.com"
					required
				/>
				<p className="mt-2 text-small text-t-tertiary">
					Used for account access and important notifications.
				</p>
			</section>

			<section className="mb-10 bg-b-surface2 p-5 xl:hidden max-md:mb-8 rounded-3xl">
				<div className="mb-4 text-h5 text-t-primary">Bid summary</div>
				<div className="gap-3 text-body flex flex-col">
					<div className="gap-3 flex items-center justify-between">
						<span className="text-t-secondary">Your bid</span>
						<span className="text-body-bold text-t-primary">$120</span>
					</div>
					<div className="gap-3 flex items-center justify-between">
						<span className="text-t-secondary">General Rank</span>
						<span className="text-body-bold text-t-primary">#4 General</span>
					</div>
					<div className="gap-3 flex items-center justify-between">
						<span className="text-t-secondary">Category rank</span>
						<span className="text-body-bold text-t-primary">#1 in Fashion</span>
					</div>
				</div>
				<p className="mt-4 text-small text-t-tertiary">
					Your final rank is confirmed after payment.
				</p>
			</section>

			<div>
				<Button className="w-full" isSecondary as="link" href="/">
					Continue to payment
				</Button>
				<p className="mt-3 text-small text-t-tertiary text-center">
					Your profile will go live immediately after successful payment.
				</p>
			</div>
		</div>
	);
};

export default Form;
