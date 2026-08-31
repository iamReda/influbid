import { isReservedPublicSlug } from "@home/influencerbid/lib/reserved-slugs";
import ProfileViewTracker from "@home/influencerbid/profile-view-tracker";
import PublicCreatorProfile from "@home/influencerbid/public-profile";
import { getCreatorRank, getPublishedCreatorByUsername } from "@repo/database";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = {
	params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { username } = await params;
	if (isReservedPublicSlug(username)) {
		return { title: "Not found" };
	}

	const creator = await getPublishedCreatorByUsername(username.toLowerCase());
	return {
		title: creator ? `${creator.publicName} (@${creator.user.username})` : "Creator",
	};
}

export default async function PublicUsernamePage({ params }: Props) {
	const { locale, username } = await params;
	setRequestLocale(locale);

	const normalized = username.toLowerCase();
	if (isReservedPublicSlug(normalized)) {
		notFound();
	}

	const creator = await getPublishedCreatorByUsername(normalized);
	if (!creator || !creator.user.username) {
		notFound();
	}

	const [generalRank, categoryRank] = await Promise.all([
		getCreatorRank({
			creatorId: creator.id,
			totalBidCents: creator.totalBidCents,
			bidReachedAt: creator.bidReachedAt,
		}),
		getCreatorRank({
			creatorId: creator.id,
			totalBidCents: creator.totalBidCents,
			bidReachedAt: creator.bidReachedAt,
			categoryId: creator.categoryId,
		}),
	]);

	return (
		<>
			<ProfileViewTracker username={creator.user.username} />
			<PublicCreatorProfile
				creator={{
					publicName: creator.publicName,
					username: creator.user.username,
					avatarUrl: creator.user.image ?? creator.avatarUrl,
					description: creator.description,
					countryCode: creator.countryCode,
					businessEmail: creator.user.businessEmail ?? null,
					categoryName: creator.category.name,
					generalRank,
					categoryRank,
					totalBidCents: creator.totalBidCents,
					socials: creator.socialProfiles.map((social) => ({
						id: social.id,
						platform: social.platform,
						url: social.url,
					})),
				}}
			/>
		</>
	);
}
