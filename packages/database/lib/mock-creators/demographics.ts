import type { MockGender, MockIdentityBase } from "./identities";

export type MockDemographics = {
	countryCode: string;
	languages: string[];
};

/**
 * Assign realistic country + languages from name origin + index variety.
 * Deterministic — same identity always gets the same demographics.
 */
export function inferMockDemographics(
	identity: Pick<MockIdentityBase, "publicName">,
	index: number,
): MockDemographics {
	const nameParts = identity.publicName.split(" ");
	const surname = (nameParts[nameParts.length - 1] ?? "").toLowerCase();
	const variant = index % 3;

	// Explicit surname / region matches (most specific first)
	if (/chen|lin|mei/.test(surname) || identity.publicName.includes("Mei Lin")) {
		return variant === 0
			? { countryCode: "US", languages: ["en", "zh"] }
			: variant === 1
				? { countryCode: "CN", languages: ["zh", "en"] }
				: { countryCode: "SG", languages: ["en", "zh"] };
	}
	if (/rivera|alvarez|ortega|ruiz|torres|delgado|navarro/.test(surname)) {
		return variant === 0
			? { countryCode: "ES", languages: ["es", "en"] }
			: variant === 1
				? { countryCode: "MX", languages: ["es"] }
				: { countryCode: "US", languages: ["en", "es"] };
	}
	if (
		/carter|wilson|brooks|johnson|thompson|bennett|cole|mitchell|blake|reed|hart|phillips|hayes|reynolds|clark|grant|foster|jackson|hughes/.test(
			surname,
		)
	) {
		return variant === 0
			? { countryCode: "US", languages: ["en"] }
			: variant === 1
				? { countryCode: "US", languages: ["en", "es"] }
				: { countryCode: "GB", languages: ["en"] };
	}
	if (/martin|laurent|dubois|moreau|marchand|bernard/.test(surname)) {
		return variant === 0
			? { countryCode: "FR", languages: ["fr"] }
			: variant === 1
				? { countryCode: "FR", languages: ["fr", "en"] }
				: { countryCode: "CA", languages: ["fr", "en"] };
	}
	if (
		/hassan|rahman|al-sayed|haddad|mansour|bouzid|soliman|farouk|ibrahim|abbas|khalil/.test(surname)
	) {
		if (/bouzid/.test(surname)) {
			return variant === 0
				? { countryCode: "MA", languages: ["ar", "fr"] }
				: { countryCode: "MA", languages: ["ar", "fr", "en"] };
		}
		return variant === 0
			? { countryCode: "MA", languages: ["ar", "fr"] }
			: variant === 1
				? { countryCode: "EG", languages: ["ar", "en"] }
				: { countryCode: "AE", languages: ["ar", "en"] };
	}
	if (/tanaka|nakamura|ito|sato|yamamoto|okada/.test(surname)) {
		return variant === 0
			? { countryCode: "JP", languages: ["ja"] }
			: { countryCode: "JP", languages: ["ja", "en"] };
	}
	if (/sharma|iyer|patel|ahmed|mehta|kapoor/.test(surname)) {
		return variant === 0
			? { countryCode: "IN", languages: ["hi", "en"] }
			: variant === 1
				? { countryCode: "IN", languages: ["en"] }
				: { countryCode: "GB", languages: ["en", "hi"] };
	}
	if (/park|kim|lee/.test(surname) && !/lee/.test(surname)) {
		return { countryCode: "KR", languages: variant === 0 ? ["ko"] : ["ko", "en"] };
	}
	if (/lee/.test(surname)) {
		return variant === 0
			? { countryCode: "US", languages: ["en"] }
			: variant === 1
				? { countryCode: "KR", languages: ["ko", "en"] }
				: { countryCode: "CA", languages: ["en"] };
	}
	if (/andersson|lindqvist|berg|olsen|johansson|eriksson|holm|bergstrom/.test(surname)) {
		return variant === 0
			? { countryCode: "SE", languages: ["sv", "en"] }
			: variant === 1
				? { countryCode: "NO", languages: ["no", "en"] }
				: { countryCode: "DK", languages: ["da", "en"] };
	}
	if (/costa|silva|mendes|ferreira|sousa/.test(surname)) {
		return variant === 0
			? { countryCode: "BR", languages: ["pt"] }
			: variant === 1
				? { countryCode: "PT", languages: ["pt", "en"] }
				: { countryCode: "BR", languages: ["pt", "en"] };
	}
	if (/okonkwo|baptiste/.test(surname)) {
		return variant === 0
			? { countryCode: "NG", languages: ["en"] }
			: { countryCode: "US", languages: ["en"] };
	}
	if (/petrov|volkov/.test(surname)) {
		return { countryCode: "RU", languages: variant === 0 ? ["ru"] : ["ru", "en"] };
	}
	if (/oconnor|gallagher|donovan|sullivan|murphy|walsh|quinn/.test(surname)) {
		return variant === 0
			? { countryCode: "IE", languages: ["en"] }
			: { countryCode: "US", languages: ["en"] };
	}
	if (/nguyen/.test(surname)) {
		return variant === 0
			? { countryCode: "VN", languages: ["vi", "en"] }
			: { countryCode: "US", languages: ["en", "vi"] };
	}
	if (/rossi|romano|moretti|ricci/.test(surname)) {
		return variant === 0
			? { countryCode: "IT", languages: ["it"] }
			: { countryCode: "IT", languages: ["it", "en"] };
	}
	if (/popescu/.test(surname)) {
		return { countryCode: "RO", languages: ["ro", "en"] };
	}
	if (/vogel|keller|weber/.test(surname)) {
		return variant === 0
			? { countryCode: "DE", languages: ["de"] }
			: { countryCode: "DE", languages: ["de", "en"] };
	}
	if (/kowalski|zielinska/.test(surname)) {
		return { countryCode: "PL", languages: ["pl", "en"] };
	}
	if (/cohen/.test(surname)) {
		return variant === 0
			? { countryCode: "IL", languages: ["he", "en"] }
			: { countryCode: "US", languages: ["en", "he"] };
	}
	if (/wijaya/.test(surname)) {
		return { countryCode: "ID", languages: ["id", "en"] };
	}

	// Default spread for remaining Anglo / mixed names
	const fallbacks: MockDemographics[] = [
		{ countryCode: "US", languages: ["en"] },
		{ countryCode: "US", languages: ["en", "es"] },
		{ countryCode: "GB", languages: ["en"] },
		{ countryCode: "CA", languages: ["en", "fr"] },
		{ countryCode: "CA", languages: ["en"] },
		{ countryCode: "AU", languages: ["en"] },
		{ countryCode: "FR", languages: ["fr", "en"] },
		{ countryCode: "ES", languages: ["es", "en"] },
	];

	return fallbacks[index % fallbacks.length]!;
}

export function mapMockGenderToCreatorGender(gender: MockGender): "MAN" | "WOMAN" {
	return gender === "male" ? "MAN" : "WOMAN";
}
