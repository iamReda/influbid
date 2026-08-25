import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "../client";
import type { CreatorAnalyticsEventType } from "../schema";
import { creatorAnalyticsEvent } from "../schema/postgres";

export async function createAnalyticsEvent(input: {
	creatorId: string;
	type: CreatorAnalyticsEventType;
	socialProfileId?: string | null;
	platformSnapshot?: string | null;
	urlSnapshot?: string | null;
	visitorKeyHash?: string | null;
}) {
	const [event] = await db
		.insert(creatorAnalyticsEvent)
		.values({
			creatorId: input.creatorId,
			type: input.type,
			socialProfileId: input.socialProfileId ?? null,
			platformSnapshot: input.platformSnapshot ?? null,
			urlSnapshot: input.urlSnapshot ?? null,
			visitorKeyHash: input.visitorKeyHash ?? null,
		})
		.returning();

	if (!event) {
		throw new Error("Failed to create analytics event");
	}

	return event;
}

export async function countAnalyticsEvents(options: {
	creatorId: string;
	type: CreatorAnalyticsEventType;
	from?: Date | null;
	to?: Date | null;
}) {
	const conditions = [
		eq(creatorAnalyticsEvent.creatorId, options.creatorId),
		eq(creatorAnalyticsEvent.type, options.type),
		...(options.from ? [gte(creatorAnalyticsEvent.createdAt, options.from)] : []),
		...(options.to ? [lte(creatorAnalyticsEvent.createdAt, options.to)] : []),
	];

	const [row] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(creatorAnalyticsEvent)
		.where(and(...conditions));

	return row?.count ?? 0;
}

export async function countSocialClicksByPlatform(options: {
	creatorId: string;
	from?: Date | null;
	to?: Date | null;
}) {
	const conditions = [
		eq(creatorAnalyticsEvent.creatorId, options.creatorId),
		eq(creatorAnalyticsEvent.type, "SOCIAL_CLICK"),
		...(options.from ? [gte(creatorAnalyticsEvent.createdAt, options.from)] : []),
		...(options.to ? [lte(creatorAnalyticsEvent.createdAt, options.to)] : []),
	];

	const events = await db
		.select({
			platformSnapshot: creatorAnalyticsEvent.platformSnapshot,
			count: sql<number>`count(*)::int`,
		})
		.from(creatorAnalyticsEvent)
		.where(and(...conditions))
		.groupBy(creatorAnalyticsEvent.platformSnapshot);

	return events.map((row) => ({
		platform: row.platformSnapshot ?? "unknown",
		clicks: row.count,
	}));
}

/** Raw view/click timestamps used to build dashboard chart buckets. */
export async function listAnalyticsTimelineEvents(options: {
	creatorId: string;
	from?: Date | null;
	to?: Date | null;
}) {
	const conditions = [
		eq(creatorAnalyticsEvent.creatorId, options.creatorId),
		inArray(creatorAnalyticsEvent.type, ["PROFILE_VIEW", "SOCIAL_CLICK"]),
		...(options.from ? [gte(creatorAnalyticsEvent.createdAt, options.from)] : []),
		...(options.to ? [lte(creatorAnalyticsEvent.createdAt, options.to)] : []),
	];

	return db
		.select({
			type: creatorAnalyticsEvent.type,
			createdAt: creatorAnalyticsEvent.createdAt,
		})
		.from(creatorAnalyticsEvent)
		.where(and(...conditions))
		.orderBy(asc(creatorAnalyticsEvent.createdAt));
}

export async function getSocialProfileById(id: string) {
	return (
		(await db.query.socialProfile.findFirst({
			where: (social, { eq }) => eq(social.id, id),
			with: {
				creator: {
					columns: { id: true, isPublished: true, userId: true },
				},
			},
		})) ?? null
	);
}
