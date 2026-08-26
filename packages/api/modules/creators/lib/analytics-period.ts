export function startOfUtcDay(date: Date) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addUtcDays(date: Date, days: number) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

export function periodRange(period: "week" | "month" | "all", joinedAt?: Date | null) {
	const now = new Date();
	if (period === "week") {
		const to = startOfUtcDay(now);
		return { from: addUtcDays(to, -6), to: addUtcDays(to, 1) };
	}
	if (period === "month") {
		const to = startOfUtcDay(now);
		return { from: addUtcDays(to, -29), to: addUtcDays(to, 1) };
	}
	const to = addUtcDays(startOfUtcDay(now), 1);
	const joined = joinedAt ? startOfUtcDay(joinedAt) : addUtcDays(startOfUtcDay(now), -83);
	const minFrom = addUtcDays(startOfUtcDay(now), -83);
	return { from: joined.getTime() < minFrom.getTime() ? minFrom : joined, to };
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function dayLabel(date: Date, period: "week" | "month" | "all") {
	if (period === "week") {
		return WEEKDAY_LABELS[date.getUTCDay()]!;
	}
	return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export function buildAnalyticsChart(options: {
	period: "week" | "month" | "all";
	from: Date;
	to: Date;
	events: Array<{ type: string; createdAt: Date }>;
}) {
	const { period, from, to, events } = options;
	const dayMs = 24 * 60 * 60 * 1000;
	const totalDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / dayMs));

	const useWeeklyBuckets = period === "all" && totalDays > 21;
	const bucketCount = useWeeklyBuckets ? Math.ceil(totalDays / 7) : totalDays;
	const bucketSizeDays = useWeeklyBuckets ? 7 : 1;

	const buckets = Array.from({ length: bucketCount }, (_, index) => {
		const start = addUtcDays(from, index * bucketSizeDays);
		const end = addUtcDays(start, bucketSizeDays);
		const label = useWeeklyBuckets
			? `W${index + 1}`
			: dayLabel(start, period === "all" ? "month" : period);
		return { start, end, label, views: 0, clicks: 0 };
	});

	for (const event of events) {
		const at = event.createdAt.getTime();
		if (at < from.getTime() || at >= to.getTime()) {
			continue;
		}
		const offsetDays = Math.floor((at - from.getTime()) / dayMs);
		const index = Math.min(
			bucketCount - 1,
			Math.max(0, useWeeklyBuckets ? Math.floor(offsetDays / 7) : offsetDays),
		);
		const bucket = buckets[index];
		if (!bucket) {
			continue;
		}
		if (event.type === "PROFILE_VIEW") {
			bucket.views += 1;
		} else if (event.type === "SOCIAL_CLICK") {
			bucket.clicks += 1;
		}
	}

	return buckets.map(({ label, views, clicks }) => ({ label, views, clicks }));
}

export const PLATFORM_META: Record<string, { name: string; color: string }> = {
	instagram: { name: "Instagram", color: "#E4405F" },
	tiktok: { name: "TikTok", color: "#111111" },
	facebook: { name: "Facebook", color: "#1877F2" },
	twitch: { name: "Twitch", color: "#9146FF" },
	youtube: { name: "YouTube", color: "#FF0000" },
	x: { name: "X", color: "#111111" },
};
