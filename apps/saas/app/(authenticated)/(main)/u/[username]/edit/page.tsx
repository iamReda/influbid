import { getSession } from "@auth/lib/server";
import MyProfileEditPage from "@creators/components/my-profile-edit-page";
import {
	ensureUserUsername,
	getPublishedCreatorByUsername,
	toCreatorEditProfile,
} from "@repo/database";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type Props = {
	params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { username } = await params;
	const creator = await getPublishedCreatorByUsername(username.toLowerCase());

	return {
		title: creator?.publicName ? `Edit ${creator.publicName}` : "Edit profile",
	};
}

export default async function UsernameProfileEditPage({ params }: Props) {
	const { username } = await params;
	const normalizedUsername = username.toLowerCase();
	const creator = await getPublishedCreatorByUsername(normalizedUsername);

	if (!creator || !creator.user.username) {
		notFound();
	}

	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	let sessionUsername = session.user.username as string | null | undefined;

	if (!sessionUsername) {
		const updated = await ensureUserUsername(session.user.id, session.user.name ?? "user");
		sessionUsername = updated?.username;
	}

	if (sessionUsername?.toLowerCase() !== normalizedUsername) {
		notFound();
	}

	return <MyProfileEditPage profile={toCreatorEditProfile(creator)} />;
}
