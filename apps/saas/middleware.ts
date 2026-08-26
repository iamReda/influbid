import { config as authConfig } from "@repo/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EXTRA_RESERVED = [
	"login",
	"signup",
	"forgot-password",
	"reset-password",
	"verify",
	"auth",
	"onboarding",
	"choose-plan",
	"checkout-return",
	"new-organization",
	"organization-invitation",
	"quiz",
	"api",
	"image-proxy",
	"u",
	"out",
	"en",
	"_next",
	"favicon.ico",
	"robots.txt",
	"sitemap.xml",
	"success",
] as const;

const RESERVED = new Set(
	[...authConfig.organizations.forbiddenOrganizationSlugs, ...EXTRA_RESERVED].map((slug) =>
		slug.toLowerCase(),
	),
);

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const segments = pathname.split("/").filter(Boolean);

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-pathname", pathname);

	if (segments.length === 1) {
		const slug = segments[0]?.toLowerCase();
		if (slug && !RESERVED.has(slug)) {
			const url = request.nextUrl.clone();
			url.pathname = `/u/${slug}`;
			return NextResponse.rewrite(url, {
				request: { headers: requestHeaders },
			});
		}
	}

	if (segments.length === 2 && segments[1]?.toLowerCase() === "edit") {
		const slug = segments[0]?.toLowerCase();
		if (slug && !RESERVED.has(slug)) {
			const url = request.nextUrl.clone();
			url.pathname = `/u/${slug}/edit`;
			return NextResponse.rewrite(url, {
				request: { headers: requestHeaders },
			});
		}
	}

	return NextResponse.next({
		request: { headers: requestHeaders },
	});
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
