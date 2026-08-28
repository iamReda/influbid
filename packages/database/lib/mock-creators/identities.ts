import { inferMockDemographics } from "./demographics";

export type MockGender = "male" | "female";

export type MockIdentityBase = {
	publicName: string;
	gender: MockGender;
	/** Short bio ≤ 160 chars */
	description: string;
};

export type MockIdentity = MockIdentityBase & {
	countryCode: string;
	languages: string[];
};

/**
 * 100 fictional creators — no real celebrities.
 * Gender is explicit so avatar portraits can be matched.
 * Country/languages inferred from name origin with deterministic variety.
 */
const MOCK_IDENTITY_BASE: readonly MockIdentityBase[] = [
	{
		publicName: "Maya Chen",
		gender: "female",
		description: "Fashion stylist sharing everyday outfits and city looks.",
	},
	{
		publicName: "Sofia Rivera",
		gender: "female",
		description: "Beauty creator focused on skincare routines and soft glam.",
	},
	{
		publicName: "Alex Carter",
		gender: "male",
		description: "Tech reviewer covering gadgets, apps, and productivity gear.",
	},
	{
		publicName: "Lucas Martin",
		gender: "male",
		description: "Travel vlogger documenting budget trips across Europe.",
	},
	{
		publicName: "Omar Hassan",
		gender: "male",
		description: "Fitness coach posting strength programs and meal ideas.",
	},
	{
		publicName: "Emma Laurent",
		gender: "female",
		description: "Lifestyle creator from Paris sharing cozy home tips.",
	},
	{
		publicName: "Noah Wilson",
		gender: "male",
		description: "Gaming streamer and esports commentator.",
	},
	{
		publicName: "Yuki Tanaka",
		gender: "female",
		description: "Music producer sharing studio sessions and gear reviews.",
	},
	{
		publicName: "Priya Sharma",
		gender: "female",
		description: "Food creator specializing in vegetarian weeknight recipes.",
	},
	{
		publicName: "Diego Alvarez",
		gender: "male",
		description: "Business creator covering startups and remote work.",
	},
	{
		publicName: "Amelia Brooks",
		gender: "female",
		description: "Travel photographer capturing coastal destinations.",
	},
	{
		publicName: "Ethan Park",
		gender: "male",
		description: "Fitness athlete sharing HIIT workouts and recovery tips.",
	},
	{
		publicName: "Chloe Dubois",
		gender: "female",
		description: "Fashion blogger focused on sustainable streetwear.",
	},
	{
		publicName: "Marcus Johnson",
		gender: "male",
		description: "Music artist posting behind-the-scenes studio clips.",
	},
	{
		publicName: "Hana Nakamura",
		gender: "female",
		description: "Beauty educator reviewing K-beauty essentials.",
	},
	{
		publicName: "Felix Andersson",
		gender: "male",
		description: "Tech educator teaching coding and AI tools.",
	},
	{
		publicName: "Isabella Costa",
		gender: "female",
		description: "Lifestyle vlogger sharing morning routines and wellness.",
	},
	{
		publicName: "Jamal Okonkwo",
		gender: "male",
		description: "Gaming creator covering AAA releases and indie gems.",
	},
	{
		publicName: "Nina Petrov",
		gender: "female",
		description: "Food creator exploring Eastern European comfort dishes.",
	},
	{
		publicName: "Ryan OConnor",
		gender: "male",
		description: "Fitness coach specializing in calisthenics progressions.",
	},
	{
		publicName: "Aisha Rahman",
		gender: "female",
		description: "Business mentor sharing freelancing and client tips.",
	},
	{
		publicName: "Theo Nguyen",
		gender: "male",
		description: "Tech creator reviewing smartphones and earbuds.",
	},
	{
		publicName: "Lara Silva",
		gender: "female",
		description: "Travel guide focusing on Latin America road trips.",
	},
	{
		publicName: "Ben Thompson",
		gender: "male",
		description: "Music critic ranking albums and live shows.",
	},
	{
		publicName: "Fatima Al-Sayed",
		gender: "female",
		description: "Fashion creator styling modest street looks.",
	},
	{
		publicName: "Kai Nakamura",
		gender: "male",
		description: "Gaming streamer known for speedruns and co-op nights.",
	},
	{
		publicName: "Olivia Bennett",
		gender: "female",
		description: "Beauty creator sharing drugstore finds under $20.",
	},
	{
		publicName: "Mateo Rossi",
		gender: "male",
		description: "Food creator filming Italian home cooking classics.",
	},
	{
		publicName: "Sakura Ito",
		gender: "female",
		description: "Lifestyle creator posting minimalist apartment tours.",
	},
	{
		publicName: "Daniel Kim",
		gender: "male",
		description: "Business creator explaining SaaS growth tactics.",
	},
	{
		publicName: "Camille Moreau",
		gender: "female",
		description: "Travel creator documenting weekend city breaks.",
	},
	{
		publicName: "Andre Baptiste",
		gender: "male",
		description: "Fitness trainer sharing mobility and warm-ups.",
	},
	{
		publicName: "Zara Ahmed",
		gender: "female",
		description: "Tech creator demystifying personal finance apps.",
	},
	{
		publicName: "Hugo Berg",
		gender: "male",
		description: "Music producer sharing beat-making tutorials.",
	},
	{
		publicName: "Elena Popescu",
		gender: "female",
		description: "Fashion creator featuring thrift flips and DIY.",
	},
	{
		publicName: "Jayden Cole",
		gender: "male",
		description: "Gaming creator covering mobile esports.",
	},
	{
		publicName: "Mei Lin",
		gender: "female",
		description: "Food creator sharing quick Asian fusion bowls.",
	},
	{
		publicName: "Sebastian Vogel",
		gender: "male",
		description: "Travel filmmaker documenting alpine hiking routes.",
	},
	{
		publicName: "Nora Lindqvist",
		gender: "female",
		description: "Lifestyle creator focused on slow living habits.",
	},
	{
		publicName: "Carlos Mendes",
		gender: "male",
		description: "Business coach covering sales pipelines.",
	},
	{
		publicName: "Ava Mitchell",
		gender: "female",
		description: "Beauty creator specializing in bridal makeup looks.",
	},
	{
		publicName: "Kenji Sato",
		gender: "male",
		description: "Tech reviewer testing cameras and lenses.",
	},
	{
		publicName: "Leila Haddad",
		gender: "female",
		description: "Fitness creator sharing yoga flows for beginners.",
	},
	{
		publicName: "Owen Gallagher",
		gender: "male",
		description: "Music creator covering guitar tone and pedals.",
	},
	{
		publicName: "Ines Ferreira",
		gender: "female",
		description: "Travel creator sharing Portugal hidden beaches.",
	},
	{
		publicName: "Tyler Brooks",
		gender: "male",
		description: "Gaming creator reviewing strategy titles.",
	},
	{
		publicName: "Ananya Iyer",
		gender: "female",
		description: "Food creator showcasing South Indian breakfasts.",
	},
	{
		publicName: "Victor Ortega",
		gender: "male",
		description: "Fashion photographer sharing street style edits.",
	},
	{
		publicName: "Mila Kowalski",
		gender: "female",
		description: "Lifestyle creator posting apartment organization tips.",
	},
	{
		publicName: "Samir Patel",
		gender: "male",
		description: "Business creator covering indie product launches.",
	},
	{
		publicName: "Grace Donovan",
		gender: "female",
		description: "Beauty creator reviewing clean beauty brands.",
	},
	{
		publicName: "Liam Sullivan",
		gender: "male",
		description: "Fitness athlete documenting marathon training.",
	},
	{
		publicName: "Yara Mansour",
		gender: "female",
		description: "Tech creator explaining no-code tools.",
	},
	{
		publicName: "Pablo Ruiz",
		gender: "male",
		description: "Travel creator filming van-life stopovers.",
	},
	{
		publicName: "Freya Olsen",
		gender: "female",
		description: "Music creator sharing vocal warm-up routines.",
	},
	{
		publicName: "Nathan Reed",
		gender: "male",
		description: "Gaming streamer hosting weekly tournaments.",
	},
	{
		publicName: "Sanae Bouzid",
		gender: "female",
		description: "Fashion creator styling affordable office wear.",
	},
	{
		publicName: "Igor Volkov",
		gender: "male",
		description: "Food creator filming grill and BBQ techniques.",
	},
	{
		publicName: "Harper Quinn",
		gender: "female",
		description: "Lifestyle creator sharing plant-care diaries.",
	},
	{
		publicName: "Ravi Mehta",
		gender: "male",
		description: "Business educator covering negotiation skills.",
	},
	{
		publicName: "Celeste Romano",
		gender: "female",
		description: "Beauty creator focused on skin barrier repair.",
	},
	{
		publicName: "Jonas Keller",
		gender: "male",
		description: "Tech creator reviewing productivity keyboards.",
	},
	{
		publicName: "Amira Soliman",
		gender: "female",
		description: "Fitness coach sharing postpartum recovery workouts.",
	},
	{
		publicName: "Connor Blake",
		gender: "male",
		description: "Music DJ posting festival set recaps.",
	},
	{
		publicName: "Helena Sousa",
		gender: "female",
		description: "Travel creator documenting food markets abroad.",
	},
	{
		publicName: "Derek Walsh",
		gender: "male",
		description: "Gaming creator covering retro remasters.",
	},
	{
		publicName: "Nadine Weber",
		gender: "female",
		description: "Fashion creator featuring capsule wardrobes.",
	},
	{
		publicName: "Arjun Kapoor",
		gender: "male",
		description: "Food creator sharing spice blend tutorials.",
	},
	{
		publicName: "Bianca Moretti",
		gender: "female",
		description: "Lifestyle creator posting morning journaling tips.",
	},
	{
		publicName: "Erik Johansson",
		gender: "male",
		description: "Business creator covering Nordic startups.",
	},
	{
		publicName: "Talia Cohen",
		gender: "female",
		description: "Beauty creator reviewing SPF and skincare layering.",
	},
	{
		publicName: "Miles Hart",
		gender: "male",
		description: "Fitness coach teaching kettlebell fundamentals.",
	},
	{
		publicName: "Rina Wijaya",
		gender: "female",
		description: "Tech creator explaining cloud storage basics.",
	},
	{
		publicName: "Gabriel Torres",
		gender: "male",
		description: "Travel creator filming city night photography.",
	},
	{
		publicName: "Elise Marchand",
		gender: "female",
		description: "Music creator sharing piano practice plans.",
	},
	{
		publicName: "Brandon Lee",
		gender: "male",
		description: "Gaming creator covering fighting-game frames.",
	},
	{
		publicName: "Noor Farouk",
		gender: "female",
		description: "Fashion stylist posting seasonal color palettes.",
	},
	{
		publicName: "Sven Eriksson",
		gender: "male",
		description: "Food creator filming sourdough bakes.",
	},
	{
		publicName: "Jade Phillips",
		gender: "female",
		description: "Lifestyle creator sharing weekend reset routines.",
	},
	{
		publicName: "Hassan Ibrahim",
		gender: "male",
		description: "Business creator covering ecommerce ops.",
	},
	{
		publicName: "Violet Hayes",
		gender: "female",
		description: "Beauty creator specializing in curly hair care.",
	},
	{
		publicName: "Anton Petrov",
		gender: "male",
		description: "Tech reviewer testing budget laptops.",
	},
	{
		publicName: "Keiko Yamamoto",
		gender: "female",
		description: "Fitness creator sharing desk-stretch sequences.",
	},
	{
		publicName: "Colin Murphy",
		gender: "male",
		description: "Music producer covering sample packs.",
	},
	{
		publicName: "Rosa Delgado",
		gender: "female",
		description: "Travel creator documenting train journeys.",
	},
	{
		publicName: "Zack Reynolds",
		gender: "male",
		description: "Gaming creator reviewing open-world RPGs.",
	},
	{
		publicName: "Ingrid Holm",
		gender: "female",
		description: "Fashion creator featuring Scandinavian basics.",
	},
	{
		publicName: "Farid Abbas",
		gender: "male",
		description: "Food creator sharing Middle Eastern mezze.",
	},
	{
		publicName: "Penny Clark",
		gender: "female",
		description: "Lifestyle creator posting thrift home finds.",
	},
	{
		publicName: "Oliver Grant",
		gender: "male",
		description: "Business creator covering content monetization.",
	},
	{
		publicName: "Dina Khalil",
		gender: "female",
		description: "Beauty creator reviewing fragrance layering.",
	},
	{
		publicName: "Chris Navarro",
		gender: "male",
		description: "Fitness athlete sharing swim training plans.",
	},
	{
		publicName: "Aya Okada",
		gender: "female",
		description: "Tech creator explaining privacy settings.",
	},
	{
		publicName: "Louis Bernard",
		gender: "male",
		description: "Travel creator filming cafe hopping guides.",
	},
	{
		publicName: "Marta Zielinska",
		gender: "female",
		description: "Music creator covering choir warm-ups.",
	},
	{
		publicName: "Dylan Foster",
		gender: "male",
		description: "Gaming creator hosting community game nights.",
	},
	{
		publicName: "Serena Ricci",
		gender: "female",
		description: "Fashion creator styling vintage denim looks.",
	},
	{
		publicName: "Tom Hughes",
		gender: "male",
		description: "Food creator sharing meal-prep for busy weeks.",
	},
	{
		publicName: "Lina Bergstrom",
		gender: "female",
		description: "Lifestyle creator posting Scandinavian interiors.",
	},
	{
		publicName: "Malik Jackson",
		gender: "male",
		description: "Business creator covering creator brand deals.",
	},
] as const;

export const MOCK_IDENTITIES: readonly MockIdentity[] = MOCK_IDENTITY_BASE.map(
	(identity, index) => ({
		...identity,
		...inferMockDemographics(identity, index),
	}),
);

if (MOCK_IDENTITIES.length !== 100) {
	throw new Error(`Expected 100 mock identities, got ${MOCK_IDENTITIES.length}`);
}
