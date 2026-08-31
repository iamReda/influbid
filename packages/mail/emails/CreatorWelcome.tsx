import React from "react";
import { Text } from "react-email";
import { createTranslator } from "use-intl/core";

import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function CreatorWelcome({
	url,
	publicName,
	globalRank,
	categoryName,
	categoryRank,
	locale,
	translations,
}: {
	url: string;
	publicName: string;
	globalRank: number;
	categoryName: string;
	categoryRank: number;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations.creatorWelcome,
	});

	return (
		<Wrapper>
			<Text>{t("greeting", { publicName })}</Text>

			<Text>{t("congratulations")}</Text>

			<Text>{t("rankingsIntro")}</Text>
			<Text>
				{t("globalRank", { globalRank })}
				<br />
				{t("categoryRank", { categoryName, categoryRank })}
			</Text>

			<Text>
				<strong>{t("profileReward")}</strong>
			</Text>

			<Text>{t("rankingsDisclaimer")}</Text>

			<Text>{t("dashboardPrompt")}</Text>

			<PrimaryButton href={url}>{t("accessDashboard")} &rarr;</PrimaryButton>

			<Text>{t("welcome")}</Text>
		</Wrapper>
	);
}

CreatorWelcome.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "https://app.creatorland.example/auth/magic-link?token=preview",
	publicName: "Luna Martinez",
	globalRank: 78,
	categoryName: "Fashion",
	categoryRank: 10,
};

export default CreatorWelcome;
