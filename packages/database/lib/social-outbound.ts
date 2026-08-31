import { createHash } from "node:crypto";

import { createAnalyticsEvent, getSocialProfileById } from "../prisma/queries/analytics";

export function visitorKeyFromHeaders(headerStore: Headers) {
	const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
	const realIp = headerStore.get("x-real-ip");
	const ua = headerStore.get("user-agent") ?? "unknown";
	const ip = forwarded || realIp || "anonymous";
	return createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

export async function resolveSocialOutboundUrl(
	socialProfileId: string,
	options?: { viewerUserId?: string | null; visitorKeyHash?: string | null },
) {
	const social = await getSocialProfileById(socialProfileId);
	if (!social || social.deletedAt || !social.creator.isPublished) {
		return null;
	}

	const isOwner = options?.viewerUserId && options.viewerUserId === social.creator.userId;
	if (!isOwner) {
		await createAnalyticsEvent({
			creatorId: social.creator.id,
			type: "SOCIAL_CLICK",
			socialProfileId: social.id,
			platformSnapshot: social.platform,
			urlSnapshot: social.url,
			visitorKeyHash: options?.visitorKeyHash ?? null,
		});
	}

	return social.url;
}
