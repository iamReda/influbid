import { z } from "zod";

/**
 * ISO 3166-1 alpha-2 country codes used for creator profiles.
 * Labels come from Intl.DisplayNames so we avoid shipping a large static map.
 */
export const ISO_COUNTRY_CODES = [
	"AD",
	"AE",
	"AF",
	"AG",
	"AI",
	"AL",
	"AM",
	"AO",
	"AR",
	"AS",
	"AT",
	"AU",
	"AW",
	"AZ",
	"BA",
	"BB",
	"BD",
	"BE",
	"BF",
	"BG",
	"BH",
	"BI",
	"BJ",
	"BM",
	"BN",
	"BO",
	"BR",
	"BS",
	"BT",
	"BW",
	"BY",
	"BZ",
	"CA",
	"CD",
	"CF",
	"CG",
	"CH",
	"CI",
	"CL",
	"CM",
	"CN",
	"CO",
	"CR",
	"CU",
	"CV",
	"CY",
	"CZ",
	"DE",
	"DJ",
	"DK",
	"DM",
	"DO",
	"DZ",
	"EC",
	"EE",
	"EG",
	"ER",
	"ES",
	"ET",
	"FI",
	"FJ",
	"FK",
	"FM",
	"FO",
	"FR",
	"GA",
	"GB",
	"GD",
	"GE",
	"GF",
	"GG",
	"GH",
	"GI",
	"GL",
	"GM",
	"GN",
	"GP",
	"GQ",
	"GR",
	"GT",
	"GU",
	"GW",
	"GY",
	"HK",
	"HN",
	"HR",
	"HT",
	"HU",
	"ID",
	"IE",
	"IL",
	"IM",
	"IN",
	"IQ",
	"IR",
	"IS",
	"IT",
	"JE",
	"JM",
	"JO",
	"JP",
	"KE",
	"KG",
	"KH",
	"KI",
	"KM",
	"KN",
	"KP",
	"KR",
	"KW",
	"KY",
	"KZ",
	"LA",
	"LB",
	"LC",
	"LI",
	"LK",
	"LR",
	"LS",
	"LT",
	"LU",
	"LV",
	"LY",
	"MA",
	"MC",
	"MD",
	"ME",
	"MG",
	"MH",
	"MK",
	"ML",
	"MM",
	"MN",
	"MO",
	"MQ",
	"MR",
	"MS",
	"MT",
	"MU",
	"MV",
	"MW",
	"MX",
	"MY",
	"MZ",
	"NA",
	"NC",
	"NE",
	"NG",
	"NI",
	"NL",
	"NO",
	"NP",
	"NR",
	"NU",
	"NZ",
	"OM",
	"PA",
	"PE",
	"PF",
	"PG",
	"PH",
	"PK",
	"PL",
	"PM",
	"PR",
	"PS",
	"PT",
	"PW",
	"PY",
	"QA",
	"RE",
	"RO",
	"RS",
	"RU",
	"RW",
	"SA",
	"SB",
	"SC",
	"SD",
	"SE",
	"SG",
	"SI",
	"SK",
	"SL",
	"SM",
	"SN",
	"SO",
	"SR",
	"SS",
	"ST",
	"SV",
	"SX",
	"SY",
	"SZ",
	"TC",
	"TD",
	"TG",
	"TH",
	"TJ",
	"TL",
	"TM",
	"TN",
	"TO",
	"TR",
	"TT",
	"TV",
	"TW",
	"TZ",
	"UA",
	"UG",
	"US",
	"UY",
	"UZ",
	"VA",
	"VC",
	"VE",
	"VG",
	"VI",
	"VN",
	"VU",
	"WS",
	"XK",
	"YE",
	"YT",
	"ZA",
	"ZM",
	"ZW",
] as const;

export type IsoCountryCode = (typeof ISO_COUNTRY_CODES)[number];

const COUNTRY_CODE_SET = new Set<string>(ISO_COUNTRY_CODES);

export function normalizeCountryCode(value: string): string {
	return value.trim().toUpperCase();
}

export function isIsoCountryCode(value: string): value is IsoCountryCode {
	return COUNTRY_CODE_SET.has(normalizeCountryCode(value));
}

export function getCountryName(code: string, locale = "en"): string {
	const normalized = normalizeCountryCode(code);
	if (!isIsoCountryCode(normalized)) {
		return normalized;
	}

	try {
		const displayNames = new Intl.DisplayNames([locale], { type: "region" });
		return displayNames.of(normalized) ?? normalized;
	} catch {
		return normalized;
	}
}

export type CountryOption = {
	code: IsoCountryCode;
	name: string;
};

let cachedCountryOptions: CountryOption[] | null = null;

export function listCountryOptions(locale = "en"): CountryOption[] {
	if (locale === "en" && cachedCountryOptions) {
		return cachedCountryOptions;
	}

	const options = ISO_COUNTRY_CODES.map((code) => ({
		code,
		name: getCountryName(code, locale),
	})).sort((a, b) => a.name.localeCompare(b.name, locale));

	if (locale === "en") {
		cachedCountryOptions = options;
	}

	return options;
}

export const countryCodeSchema = z
	.string()
	.trim()
	.transform(normalizeCountryCode)
	.refine(isIsoCountryCode, { message: "Invalid country code" });
