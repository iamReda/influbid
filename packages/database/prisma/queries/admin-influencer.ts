import { db } from "../client";

export async function getAdminInfluencerByUserId(userId: string) {
	return db.user.findUnique({
		where: { id: userId },
		select: {
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
			creatorProfile: {
				select: {
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
					category: {
						select: {
							id: true,
							name: true,
							slug: true,
							color: true,
						},
					},
					socialProfiles: {
						where: { deletedAt: null },
						orderBy: { position: "asc" },
						select: {
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
}
