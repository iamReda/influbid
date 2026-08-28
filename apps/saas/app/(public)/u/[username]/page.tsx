import { getSession } from "@auth/lib/server";
import MyProfilePage from "@creators/components/my-profile-page";
import ProfileViewTracker from "@creators/components/profile-view-tracker";
import { getPublishedCreatorByUsername } from "@repo/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
	params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { username } = await params;
	const creator = await getPublishedCreatorByUsername(username.toLowerCase());

	return {
		title: creator?.publicName ? `${creator.publicName} (@${creator.user.username})` : "Profile",
	};
}

export default async function UsernameProfilePage({ params }: Props) {
	const { username } = await params;
	const creator = await getPublishedCreatorByUsername(username.toLowerCase());

	if (!creator || !creator.user.username) {
		notFound();
	}

	const session = await getSession();
	const sessionUsername = (session?.user?.username as string | null | undefined)?.toLowerCase();
	const isOwner =
		Boolean(session?.user?.id && session.user.id === creator.userId) ||
		Boolean(sessionUsername && sessionUsername === creator.user.username.toLowerCase());

	const profile = {
		username: creator.user.username,
		name: creator.publicName,
		image: creator.avatarUrl,
		bio: creator.description,
		businessEmail: creator.user.businessEmail ?? null,
		socialLinks: creator.socialProfiles.map((social) => social.url),
		countryCode: creator.countryCode,
	};

	const socials = creator.socialProfiles.map((social) => ({
		id: social.id,
		url: social.url,
	}));

	return (
		<>
			{!isOwner && <ProfileViewTracker username={creator.user.username} />}
			<Suspense fallback={null}>
				<MyProfilePage profile={profile} socials={socials} isOwner={isOwner} />
			</Suspense>
		</>
	);
}
