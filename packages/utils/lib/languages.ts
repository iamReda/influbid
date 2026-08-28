import { z } from "zod";

/**
 * Common ISO 639-1 language codes for creator spoken languages.
 * Labels come from Intl.DisplayNames.
 */
export const ISO_LANGUAGE_CODES = [
	"af",
	"am",
	"ar",
	"az",
	"be",
	"bg",
	"bn",
	"bs",
	"ca",
	"cs",
	"cy",
	"da",
	"de",
	"el",
	"en",
	"es",
	"et",
	"eu",
	"fa",
	"fi",
	"fil",
	"fr",
	"ga",
	"gl",
	"gu",
	"he",
	"hi",
	"hr",
	"hu",
	"hy",
	"id",
	"is",
	"it",
	"ja",
	"ka",
	"kk",
	"km",
	"kn",
	"ko",
	"ku",
	"ky",
	"lo",
	"lt",
	"lv",
	"mk",
	"ml",
	"mn",
	"mr",
	"ms",
	"mt",
	"my",
	"ne",
	"nl",
	"no",
	"pa",
	"pl",
	"ps",
	"pt",
	"ro",
	"ru",
	"si",
	"sk",
	"sl",
	"so",
	"sq",
	"sr",
	"sv",
	"sw",
	"ta",
	"te",
	"th",
	"tl",
	"tr",
	"uk",
	"ur",
	"uz",
	"vi",
	"zh",
	"zu",
] as const;

export type IsoLanguageCode = (typeof ISO_LANGUAGE_CODES)[number];

const LANGUAGE_CODE_SET = new Set<string>(ISO_LANGUAGE_CODES);

export function normalizeLanguageCode(value: string): string {
	return value.trim().toLowerCase();
}

export function isIsoLanguageCode(value: string): value is IsoLanguageCode {
	return LANGUAGE_CODE_SET.has(normalizeLanguageCode(value));
}

export function getLanguageName(code: string, locale = "en"): string {
	const normalized = normalizeLanguageCode(code);
	if (!isIsoLanguageCode(normalized)) {
		return normalized;
	}

	try {
		const displayNames = new Intl.DisplayNames([locale], { type: "language" });
		return displayNames.of(normalized) ?? normalized;
	} catch {
		return normalized;
	}
}

export type LanguageOption = {
	code: IsoLanguageCode;
	name: string;
};

let cachedLanguageOptions: LanguageOption[] | null = null;

export function listLanguageOptions(locale = "en"): LanguageOption[] {
	if (locale === "en" && cachedLanguageOptions) {
		return cachedLanguageOptions;
	}

	const options = ISO_LANGUAGE_CODES.map((code) => ({
		code,
		name: getLanguageName(code, locale),
	})).sort((a, b) => a.name.localeCompare(b.name, locale));

	if (locale === "en") {
		cachedLanguageOptions = options;
	}

	return options;
}

export function normalizeLanguageCodes(values: string[]): IsoLanguageCode[] {
	const seen = new Set<string>();
	const result: IsoLanguageCode[] = [];

	for (const value of values) {
		const code = normalizeLanguageCode(value);
		if (!isIsoLanguageCode(code) || seen.has(code)) {
			continue;
		}
		seen.add(code);
		result.push(code);
	}

	return result;
}

export const languageCodeSchema = z
	.string()
	.trim()
	.transform(normalizeLanguageCode)
	.refine(isIsoLanguageCode, { message: "Invalid language code" });

export const languagesSchema = z
	.array(languageCodeSchema)
	.min(1, "Select at least one language")
	.max(10)
	.transform((codes) => normalizeLanguageCodes(codes))
	.refine((codes) => codes.length >= 1, { message: "Select at least one language" });
