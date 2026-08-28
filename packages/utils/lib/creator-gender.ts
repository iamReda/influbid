import { z } from "zod";

export const CREATOR_GENDERS = ["MAN", "WOMAN", "PREFER_NOT_TO_SAY"] as const;

export type CreatorGenderValue = (typeof CREATOR_GENDERS)[number];

export const creatorGenderSchema = z.enum(CREATOR_GENDERS);
