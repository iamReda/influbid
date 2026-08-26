import { z } from "zod";

export const categorySchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	icon: z.string().nullable(),
	order: z.number().int(),
});

export const categoryCardSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	icon: z.string().nullable(),
	order: z.number().int(),
	influencerCount: z.number().int(),
	topCreators: z.array(
		z.object({
			id: z.string(),
			publicName: z.string(),
			avatarUrl: z.string(),
			totalBidCents: z.number().int(),
			username: z.string().nullable(),
		}),
	),
});

export const leaderboardItemSchema = z.object({
	id: z.string(),
	userId: z.string(),
	rank: z.number().int(),
	publicName: z.string(),
	avatarUrl: z.string(),
	description: z.string().nullable(),
	totalBidCents: z.number().int(),
	joinedAt: z.date(),
	bidReachedAt: z.date(),
	categoryId: z.string(),
	categoryName: z.string(),
	categorySlug: z.string(),
	username: z.string().nullable(),
	platforms: z.array(z.string()),
	profileViewCount: z.number().int(),
	socialClickCount: z.number().int(),
});

export const pendingSocialProfileSchema = z.object({
	platform: z.string().min(1),
	url: z.url(),
	position: z.number().int().nonnegative(),
});

export const creatorEditProfileSchema = z.object({
	username: z.string(),
	publicName: z.string(),
	avatarUrl: z.string(),
	description: z.string().nullable(),
	businessEmail: z.email().nullable(),
	socialProfiles: z.array(
		z.object({
			id: z.string(),
			url: z.url(),
		}),
	),
});

export const updateMyCreatorInputSchema = z.object({
	publicName: z.string().trim().min(1).max(120).optional(),
	description: z.string().max(160).nullable().optional(),
	avatarUrl: z.string().min(1).optional(),
	businessEmail: z.email().nullable().optional(),
	socialUrls: z.array(z.url()).min(1).max(10).optional(),
});

export type CreatorEditProfile = z.infer<typeof creatorEditProfileSchema>;
export type UpdateMyCreatorInput = z.infer<typeof updateMyCreatorInputSchema>;
