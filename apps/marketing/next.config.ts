import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const saasBase = (process.env.NEXT_PUBLIC_SAAS_URL ?? "http://localhost:3000").replace(/\/$/, "");

const nextConfig: NextConfig = {
	experimental: {
		useTypeScriptCli: true,
	},
	transpilePackages: ["@repo/i18n", "@repo/ui", "@repo/database", "@repo/api", "@repo/storage"],
	images: {
		// Next.js 16 blocks optimizing images from private IPs (localhost) by default.
		dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
		remotePatterns: [
			{
				protocol: "https",
				hostname: "placehold.co",
			},
			{
				protocol: "https",
				hostname: "picsum.photos",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "3000",
				pathname: "/image-proxy/**",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "3000",
				pathname: "/image-proxy/**",
			},
		],
	},
	async rewrites() {
		return [
			{
				source: "/image-proxy/:path*",
				destination: `${saasBase}/image-proxy/:path*`,
			},
		];
	},
};

export default withContentCollections(withNextIntl(nextConfig));
