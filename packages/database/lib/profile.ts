export type PublicProfile = {
	username: string;
	name: string;
	image: string | null;
	bio: string | null;
	businessEmail: string | null;
	socialLinks: string[];
};

export function parseSocialLinks(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function toPublicProfile(user: {
	username: string | null;
	name: string;
	image: string | null;
	email: string;
	bio: string | null;
	businessEmail: string | null;
	socialLinks: unknown;
}): PublicProfile | null {
	if (!user.username) {
		return null;
	}

	return {
		username: user.username,
		name: user.name,
		image: user.image,
		bio: user.bio,
		businessEmail: user.businessEmail,
		socialLinks: parseSocialLinks(user.socialLinks),
	};
}
