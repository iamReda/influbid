import { config } from "@config";
import { isReservedPublicSlug } from "@home/influencerbid/lib/reserved-slugs";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

type Props = {
	params: Promise<{ locale: string; username: string }>;
};

export default async function PublicUsernameEditRedirectPage({ params }: Props) {
	const { locale, username } = await params;
	setRequestLocale(locale);

	const normalized = username.toLowerCase();
	if (isReservedPublicSlug(normalized)) {
		notFound();
	}

	const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");
	redirect(`${saasBase}/${normalized}/edit`);
}
