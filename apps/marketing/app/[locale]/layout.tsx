import { AnalyticsScript } from "@analytics";
import { config } from "@config";
import { config as i18nConfig } from "@i18n/config";
import { cn, Toaster } from "@repo/ui";
import { ClientProviders } from "@shared/components/ClientProviders";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { DM_Sans, Inter } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

const sansFont = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const headingFont = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
});

const satoshiFont = localFont({
	src: [
		{
			path: "../../public/fonts/Satoshi-Light.woff2",
			weight: "300",
		},
		{
			path: "../../public/fonts/Satoshi-Regular.woff2",
			weight: "400",
		},
		{
			path: "../../public/fonts/Satoshi-Medium.woff2",
			weight: "500",
		},
		{
			path: "../../public/fonts/Satoshi-Bold.woff2",
			weight: "700",
		},
		{
			path: "../../public/fonts/Satoshi-Black.woff2",
			weight: "900",
		},
	],
	variable: "--font-satoshi",
});

const locales = Object.keys(i18nConfig.locales) as string[];

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export default async function MarketingLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;

	if (!locales.includes(locale)) {
		notFound();
	}

	setRequestLocale(locale);

	const messages = await getMessages();

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={cn(sansFont.variable, headingFont.variable, satoshiFont.variable)}
		>
			<body className={cn("font-sans min-h-screen bg-background text-foreground antialiased")}>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<ClientProviders>
						<ThemeProvider
							attribute="class"
							disableTransitionOnChange
							enableSystem
							defaultTheme={config.defaultTheme}
							themes={Array.from(config.enabledThemes)}
						>
							{children}

							<Toaster position="top-right" closeLabel="Close notification" />
							<AnalyticsScript />
						</ThemeProvider>
					</ClientProviders>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
