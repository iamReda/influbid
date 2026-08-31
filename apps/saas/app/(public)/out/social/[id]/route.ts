import { auth } from "@repo/auth";
import { resolveSocialOutboundUrl, visitorKeyFromHeaders } from "@repo/database";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const session = await auth.api.getSession({
		headers: request.headers,
		query: { disableCookieCache: true },
	});
	const socialUrl = await resolveSocialOutboundUrl(id, {
		viewerUserId: session?.user.id ?? null,
		visitorKeyHash: visitorKeyFromHeaders(request.headers),
	});

	if (!socialUrl) {
		return new Response("Social profile not found", { status: 404 });
	}

	return NextResponse.redirect(socialUrl, 302);
}
