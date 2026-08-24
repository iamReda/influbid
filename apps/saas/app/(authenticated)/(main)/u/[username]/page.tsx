import MyProfilePage from "@creators/components/my-profile-page";
import { getPublicProfileByUsername } from "@repo/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
	params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { username } = await params;
	const profile = await getPublicProfileByUsername(username.toLowerCase());

	return {
		title: profile?.name ? `${profile.name} (@${profile.username})` : "Profile",
	};
}

export default async function UsernameProfilePage({ params }: Props) {
	const { username } = await params;
	const profile = await getPublicProfileByUsername(username.toLowerCase());

	if (!profile) {
		notFound();
	}

	return (
		<Suspense fallback={null}>
			<MyProfilePage profile={profile} />
		</Suspense>
	);
}
