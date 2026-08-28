import { db } from "../client";

export async function getAdminInfluencerByUserId(userId: string) {
	const row = await db.query.user.findFirst({
		where: (u, { eq }) => eq(u.id, userId),
		columns: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			image: true,
			username: true,
			businessEmail: true,
			banned: true,
			banReason: true,
			banExpires: true,
			createdAt: true,
		},
		with: {
			creatorProfile: {
				columns: {
					id: true,
					publicName: true,
					avatarUrl: true,
					description: true,
					totalBidCents: true,
					currency: true,
					joinedAt: true,
					bidReachedAt: true,
					isPublished: true,
					accountClaimedAt: true,
					countryCode: true,
					gender: true,
					languages: true,
				},
				with: {
					category: {
						columns: {
							id: true,
							name: true,
							slug: true,
							color: true,
						},
					},
					socialProfiles: {
						where: (profile, { isNull }) => isNull(profile.deletedAt),
						orderBy: (profile, { asc }) => [asc(profile.position)],
						columns: {
							id: true,
							platform: true,
							url: true,
							position: true,
						},
					},
				},
			},
		},
	});

	return row ?? null;
}
