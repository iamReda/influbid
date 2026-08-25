import PaymentSuccessPage from "@home/influencerbid/payment-success";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata() {
	return {
		title: "Payment successful",
	};
}

export default async function SuccessPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ email?: string | string[] }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const query = await searchParams;
	const rawEmail = Array.isArray(query.email) ? query.email[0] : query.email;
	const email = rawEmail?.trim() || "your inbox";

	return <PaymentSuccessPage email={email} />;
}
