import { getCreatorRank, type getCreatorProfileByUserId } from "@repo/database";
import type { Locale } from "@repo/i18n";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { getBaseUrl } from "@repo/utils";

const appUrl = getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000);

type CreatorProfileForWelcome = NonNullable<Awaited<ReturnType<typeof getCreatorProfileByUserId>>>;

export function buildMagicLinkConfirmUrl(verifyUrl: string) {
	const url = new URL(verifyUrl);
	const confirmUrl = new URL("/auth/magic-link", appUrl);

	for (const key of ["token", "callbackURL", "errorCallbackURL", "newUserCallbackURL"] as const) {
		const value = url.searchParams.get(key);
		if (value) {
			confirmUrl.searchParams.set(key, value);
		}
	}

	return confirmUrl.toString();
}

export async function sendCreatorWelcomeEmail(options: {
	email: string;
	url: string;
	profile: CreatorProfileForWelcome;
	locale: Locale;
}) {
	const { email, url, profile, locale } = options;

	const [globalRank, categoryRank] = await Promise.all([
		getCreatorRank({
			creatorId: profile.id,
			totalBidCents: profile.totalBidCents,
			bidReachedAt: profile.bidReachedAt,
		}),
		getCreatorRank({
			creatorId: profile.id,
			totalBidCents: profile.totalBidCents,
			bidReachedAt: profile.bidReachedAt,
			categoryId: profile.categoryId,
		}),
	]);

	const sent = await sendEmail({
		to: email,
		templateId: "creatorWelcome",
		context: {
			url,
			publicName: profile.publicName,
			globalRank,
			categoryName: profile.category.name,
			categoryRank,
		},
		locale,
	});

	if (!sent) {
		logger.error("Creator welcome email was not sent", {
			ctx: "sendCreatorWelcomeEmail",
			email,
			creatorId: profile.id,
		});
		throw new Error(`Failed to send welcome email to ${email}`);
	}
}

export async function sendMagicLinkEmail(options: { email: string; url: string; locale: Locale }) {
	const sent = await sendEmail({
		to: options.email,
		templateId: "magicLink",
		context: {
			url: options.url,
		},
		locale: options.locale,
	});

	if (!sent) {
		logger.error("Magic link email was not sent", {
			ctx: "sendMagicLinkEmail",
			email: options.email,
		});
		throw new Error(`Failed to send magic link email to ${options.email}`);
	}
}
