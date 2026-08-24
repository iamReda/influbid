import { z } from "zod";

export const publicProfileSchema = z.object({
	username: z.string(),
	name: z.string(),
	image: z.string().nullable(),
	bio: z.string().nullable(),
	businessEmail: z.email().nullable(),
	socialLinks: z.array(z.url()),
});

export const updateProfileInputSchema = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	bio: z.string().max(160).nullable().optional(),
	businessEmail: z.email().nullable().optional(),
	socialLinks: z.array(z.url()).min(1).max(10).optional(),
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
