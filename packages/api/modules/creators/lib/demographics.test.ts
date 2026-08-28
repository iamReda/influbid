import {
	countryCodeSchema,
	isIsoCountryCode,
	languagesSchema,
	normalizeLanguageCodes,
} from "@repo/utils";
import { describe, expect, it } from "vitest";

describe("creator demographics schemas", () => {
	it("normalizes ISO country codes", () => {
		expect(countryCodeSchema.parse("fr")).toBe("FR");
		expect(countryCodeSchema.parse("  ma ")).toBe("MA");
		expect(isIsoCountryCode("US")).toBe(true);
		expect(countryCodeSchema.safeParse("ZZ").success).toBe(false);
	});

	it("requires unique language codes with at least one entry", () => {
		expect(languagesSchema.parse(["en", "FR", "en"])).toEqual(["en", "fr"]);
		expect(normalizeLanguageCodes(["es", "es", "pt"])).toEqual(["es", "pt"]);
		expect(languagesSchema.safeParse([]).success).toBe(false);
		expect(languagesSchema.safeParse(["zz"]).success).toBe(false);
	});
});
