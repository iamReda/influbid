import { db } from "../client";
import type { CreatorAnalyticsEventType } from "../generated/client";

export async function createAnalyticsEvent(input: {
	creatorId: string;
	type: CreatorAnalyticsEventType;
	socialProfileId?: string | null;
	platformSnapshot?: string | null;
	urlSnapshot?: string | null;
	visitorKeyHash?: string | null;
}) {
	return db.creatorAnalyticsEvent.create({
		data: {
			creatorId: input.creatorId,
			type: input.type,
			socialProfileId: input.socialProfileId ?? null,
			platformSnapshot: input.platformSnapshot ?? null,
			urlSnapshot: input.urlSnapshot ?? null,
			visitorKeyHash: input.visitorKeyHash ?? null,
		},
	});
}

export async function countAnalyticsEvents(options: {
	creatorId: string;
	type: CreatorAnalyticsEventType;
	from?: Date | null;
	to?: Date | null;
}) {
	return db.creatorAnalyticsEvent.count({
		where: {
			creatorId: options.creatorId,
			type: options.type,
			...(options.from || options.to
				? {
						createdAt: {
							...(options.from ? { gte: options.from } : {}),
							...(options.to ? { lte: options.to } : {}),
						},
					}
				: {}),
		},
	});
}

export async function countSocialClicksByPlatform(options: {
	creatorId: string;
	from?: Date | null;
	to?: Date | null;
}) {
	const events = await db.creatorAnalyticsEvent.groupBy({
		by: ["platformSnapshot"],
		where: {
			creatorId: options.creatorId,
			type: "SOCIAL_CLICK",
			...(options.from || options.to
				? {
						createdAt: {
							...(options.from ? { gte: options.from } : {}),
							...(options.to ? { lte: options.to } : {}),
						},
					}
				: {}),
		},
		_count: { _all: true },
	});

	return events.map((row) => ({
		platform: row.platformSnapshot ?? "unknown",
		clicks: row._count._all,
	}));
}

/** Raw view/click timestamps used to build dashboard chart buckets. */
export async function listAnalyticsTimelineEvents(options: {
	creatorId: string;
	from?: Date | null;
	to?: Date | null;
}) {
	return db.creatorAnalyticsEvent.findMany({
		where: {
			creatorId: options.creatorId,
			type: { in: ["PROFILE_VIEW", "SOCIAL_CLICK"] },
			...(options.from || options.to
				? {
						createdAt: {
							...(options.from ? { gte: options.from } : {}),
							...(options.to ? { lte: options.to } : {}),
						},
					}
				: {}),
		},
		select: {
			type: true,
			createdAt: true,
		},
		orderBy: { createdAt: "asc" },
	});
}

export async function getSocialProfileById(id: string) {
	return db.socialProfile.findUnique({
		where: { id },
		include: {
			creator: {
				select: { id: true, isPublished: true, userId: true },
			},
		},
	});
}
