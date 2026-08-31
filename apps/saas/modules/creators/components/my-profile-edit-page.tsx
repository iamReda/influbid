"use client";

import { useSession } from "@auth/hooks/use-session";
import { MAX_SOCIAL_LINKS, MIN_SOCIAL_LINKS, detectPlatform } from "@creators/lib/profile";
import type { CreatorEditProfile } from "@repo/api/modules/creators/types";
import { authClient } from "@repo/auth/client";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import Icon from "@repo/ui/components/influencerbid/icon";
import Switch from "@repo/ui/components/influencerbid/switch";
import { toast } from "@repo/ui/components/toast";
import { isIsoCountryCode, type IsoCountryCode } from "@repo/utils";
import Layout from "@shared/components/influencerbid/layout";
import { USER_AVATAR_UPDATED_EVENT } from "@shared/components/UserAvatar";
import { useRouter } from "@shared/hooks/router";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import CountryCombobox from "./country-combobox";
import { ProfileAvatarUpload } from "./profile-avatar-upload";
import { SocialUrlField } from "./social-url-field";

const DESCRIPTION_MAX = 160;

type SocialEntry = {
	id: number;
	url: string;
};

type MyProfileEditPageProps = {
	profile: CreatorEditProfile;
};

const MyProfileEditPage = ({ profile }: MyProfileEditPageProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user, reloadSession } = useSession();
	const [publicName, setPublicName] = useState(profile.publicName);
	const [description, setDescription] = useState(profile.description ?? "");
	const [countryCode, setCountryCode] = useState<IsoCountryCode | null>(() =>
		profile.countryCode && isIsoCountryCode(profile.countryCode) ? profile.countryCode : null,
	);
	const [contactEnabled, setContactEnabled] = useState(Boolean(profile.businessEmail));
	const [businessEmail, setBusinessEmail] = useState(profile.businessEmail ?? "");
	const [socials, setSocials] = useState<SocialEntry[]>(() => {
		const links =
			profile.socialProfiles.length > 0 ? profile.socialProfiles.map((social) => social.url) : [""];
		return links.map((url, index) => ({ id: index + 1, url }));
	});
	const [nextSocialId, setNextSocialId] = useState(() =>
		Math.max(profile.socialProfiles.length, MIN_SOCIAL_LINKS),
	);
	const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
	const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const socialInputRefs = useRef(new Map<number, HTMLInputElement>());

	const avatarImage = profile.avatarUrl;

	const updateCreatorMutation = useMutation(orpc.creators.updateMyCreator.mutationOptions());
	const getSignedUploadUrlMutation = useMutation(orpc.users.avatarUploadUrl.mutationOptions());

	useEffect(() => {
		return () => {
			if (avatarPreviewUrl) {
				URL.revokeObjectURL(avatarPreviewUrl);
			}
		};
	}, [avatarPreviewUrl]);

	const socialLinks = useMemo(
		() => socials.map((item) => item.url.trim()).filter(Boolean),
		[socials],
	);

	const canAddSocial = socials.length < MAX_SOCIAL_LINKS;
	const canRemoveSocial = socials.length > MIN_SOCIAL_LINKS;

	const addSocialProfile = () => {
		const emptySocial = socials.find((item) => !item.url.trim());

		if (emptySocial) {
			socialInputRefs.current.get(emptySocial.id)?.focus();
			return;
		}

		if (!canAddSocial) {
			return;
		}

		const id = nextSocialId + 1;
		setSocials((current) => [...current, { id, url: "" }]);
		setNextSocialId(id);

		window.setTimeout(() => {
			socialInputRefs.current.get(id)?.focus();
		}, 0);
	};

	const updateSocial = (id: number, url: string) => {
		setSocials((current) => current.map((item) => (item.id === id ? { ...item, url } : item)));
	};

	const removeSocial = (id: number) => {
		if (!canRemoveSocial) {
			return;
		}

		setSocials((current) => current.filter((item) => item.id !== id));
	};

	const onContactEnabledChange = (enabled: boolean) => {
		setContactEnabled(enabled);

		if (enabled && !businessEmail.trim()) {
			setBusinessEmail(user?.email ?? "");
		}
	};

	const onAvatarCropped = (blob: Blob) => {
		if (avatarPreviewUrl) {
			URL.revokeObjectURL(avatarPreviewUrl);
		}

		setAvatarPreviewUrl(URL.createObjectURL(blob));
		setPendingAvatarBlob(blob);
	};

	const uploadPendingAvatar = async () => {
		if (!pendingAvatarBlob) {
			return null;
		}

		const { signedUploadUrl, path } = await getSignedUploadUrlMutation.mutateAsync({});
		const response = await fetch(signedUploadUrl, {
			method: "PUT",
			body: pendingAvatarBlob,
			headers: {
				"Content-Type": "image/png",
			},
		});

		if (!response.ok) {
			throw new Error("Failed to upload image");
		}

		return path;
	};

	const onSave = async () => {
		const trimmedName = publicName.trim();
		const trimmedEmail = businessEmail.trim();

		if (!trimmedName) {
			toast.add({
				title: "Public name is required",
				type: "error",
			});
			return;
		}

		if (!countryCode) {
			toast.add({
				title: "Country is required",
				type: "error",
			});
			return;
		}

		if (socialLinks.length < MIN_SOCIAL_LINKS) {
			toast.add({
				title: "Add at least one social profile link",
				type: "error",
			});
			return;
		}

		if (socialLinks.length > MAX_SOCIAL_LINKS) {
			toast.add({
				title: `You can add up to ${MAX_SOCIAL_LINKS} social profiles`,
				type: "error",
			});
			return;
		}

		for (const url of socialLinks) {
			try {
				new URL(url);
			} catch {
				toast.add({
					title: "Enter valid social profile URLs",
					type: "error",
				});
				return;
			}

			if (!detectPlatform(url)) {
				toast.add({
					title: "Use a supported social network URL",
					type: "error",
				});
				return;
			}
		}

		if (contactEnabled && !trimmedEmail) {
			toast.add({
				title: "Business email is required when contact is enabled",
				type: "error",
			});
			return;
		}

		setSaving(true);

		try {
			let avatarUrl: string | undefined;

			if (pendingAvatarBlob) {
				const path = await uploadPendingAvatar();
				if (path) {
					avatarUrl = path;
				}
			}

			await updateCreatorMutation.mutateAsync({
				publicName: trimmedName,
				description: description.trim() ? description.trim() : null,
				countryCode,
				businessEmail: contactEnabled ? trimmedEmail : null,
				socialUrls: socialLinks,
				...(avatarUrl ? { avatarUrl } : {}),
			});

			if (avatarUrl) {
				const { error: avatarError } = await authClient.updateUser({ image: avatarUrl });
				if (avatarError) {
					throw avatarError;
				}
				await reloadSession();
				window.dispatchEvent(new CustomEvent(USER_AVATAR_UPDATED_EVENT, { detail: avatarUrl }));
			}

			await queryClient.invalidateQueries({
				queryKey: orpc.creators.getMyCreator.key(),
			});
			await queryClient.invalidateQueries({
				queryKey: orpc.creators.getMyCreatorForEdit.key(),
			});

			toast.add({
				title: "Profile updated",
				type: "success",
			});
			router.push(`/${profile.username}`);
			router.refresh();
		} catch {
			toast.add({
				title: "Could not update profile",
				type: "error",
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Layout isLoggedIn>
			<div className="px-6 py-12 max-md:py-8">
				<div className="max-w-lg mx-auto w-full">
					<div className="mb-15 text-h1 max-md:mb-8">Edit profile</div>

					<div className="gap-20 max-md:gap-14 flex flex-col">
						<div>
							<div className="mb-3 text-h4">Profile details</div>
							<p className="text-body text-t-secondary mb-8 leading-snug">
								Your photo, public name, and short description appear at the top of your profile.
							</p>
							<div className="gap-5 flex flex-col">
								<ProfileAvatarUpload
									name={publicName}
									image={avatarImage}
									previewUrl={avatarPreviewUrl}
									saving={saving}
									onCropped={onAvatarCropped}
								/>
								<Field
									classLabel="bg-b-surface1"
									label="Public name"
									value={publicName}
									onChange={(event) => setPublicName(event.target.value)}
									name="public-name"
									placeholder="e.g. Luna Martinez"
									isLarge
									required
								/>
								<div>
									<Field
										classLabel="bg-b-surface1"
										classInput="h-28!"
										label="Short description"
										value={description}
										onChange={(event) =>
											setDescription(event.target.value.slice(0, DESCRIPTION_MAX))
										}
										name="short-description"
										placeholder="Share what you create in one short sentence"
										isTextarea
										isLarge
										maxLength={DESCRIPTION_MAX}
									/>
									<div className="mt-2 text-small text-t-tertiary flex justify-between">
										<span>Optional — keep it short and clear.</span>
										<span>
											{description.length}/{DESCRIPTION_MAX}
										</span>
									</div>
								</div>
								<CountryCombobox
									id="edit-country"
									value={countryCode}
									onChange={setCountryCode}
									required
									classLabel="bg-b-surface1"
								/>
							</div>
						</div>

						<div>
							<div className="mb-3 text-h4">Social profiles</div>
							<p className="text-body text-t-secondary mb-8 leading-snug">
								Add at least one social link (up to {MAX_SOCIAL_LINKS}). Icons update from the URL
								domain.
							</p>
							<div className="gap-5 flex flex-col">
								{socials.map((item) => (
									<div className="gap-3 flex items-center" key={item.id}>
										<div className="min-w-0 flex-1">
											<SocialUrlField
												value={item.url}
												onChange={(url) => updateSocial(item.id, url)}
												placeholder="Paste a social profile link"
												ariaLabel="Social profile URL"
												inputRef={(element) => {
													if (element) {
														socialInputRefs.current.set(item.id, element);
													} else {
														socialInputRefs.current.delete(item.id);
													}
												}}
											/>
										</div>
										{canRemoveSocial && (
											<button
												className="size-12 inline-flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
												type="button"
												aria-label="Remove social profile"
												onClick={() => removeSocial(item.id)}
											>
												<Icon className="fill-primary3" name="close" />
											</button>
										)}
									</div>
								))}
							</div>

							{canAddSocial && (
								<Button
									className="mt-5"
									isPrimary
									type="button"
									icon="plus"
									onClick={addSocialProfile}
								>
									Add new
								</Button>
							)}
						</div>

						<div>
							<div className="mb-8 text-h4">Contact for Business</div>
							<div className={`${contactEnabled ? "mb-8" : ""} gap-4 flex items-start`}>
								<Switch
									className="mt-0.5"
									checked={contactEnabled}
									onChange={onContactEnabledChange}
									aria-label="Show contact button on public profile"
								/>
								<p className="text-body text-t-primary min-w-0 leading-snug flex-1">
									Show a contact button so brands and people can reach you for business.
								</p>
							</div>
							{contactEnabled && (
								<Field
									classLabel="bg-b-surface1"
									label="Email address"
									value={businessEmail}
									onChange={(event) => setBusinessEmail(event.target.value)}
									name="business-email"
									type="email"
									placeholder="you@example.com"
									isLarge
									required
								/>
							)}
						</div>

						<div className="gap-3 flex flex-wrap">
							<Button
								className="self-start"
								isSecondary
								type="button"
								disabled={saving}
								onClick={() => void onSave()}
							>
								{saving ? "Saving..." : "Save profile"}
							</Button>
							<Button className="self-start" isStroke as="link" href={`/${profile.username}`}>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default MyProfileEditPage;
