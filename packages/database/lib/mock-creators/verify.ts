import { db } from "../../prisma/client";
import {
	getAdminDashboardOverview,
	listActiveCreatorCategories,
	listLeaderboard,
} from "../../prisma/queries";

export async function verifyMockSeed(): Promise<void> {
	const errors: string[] = [];

	const categories = await listActiveCreatorCategories();
	if (categories.length === 0) {
		throw new Error("No active categories — run seed:categories first");
	}

	const mockUsers = await db.user.findMany({
		where: {
			email: { endsWith: "@example.com" },
			OR: [{ role: null }, { role: { not: "admin" } }],
		},
		include: {
			creatorProfile: {
				include: {
					socialProfiles: true,
					bids: true,
					analyticsEvents: {
						select: {
							id: true,
							type: true,
							createdAt: true,
							socialProfileId: true,
						},
					},
					category: { select: { id: true, slug: true } },
				},
			},
		},
	});

	if (mockUsers.length !== 100) {
		errors.push(`Expected 100 mock users, found ${mockUsers.length}`);
	}

	const usernames = new Set<string>();
	const emails = new Set<string>();

	for (const user of mockUsers) {
		const profile = user.creatorProfile;
		if (!profile) {
			errors.push(`User ${user.email} has no CreatorProfile`);
			continue;
		}

		if (!user.username) {
			errors.push(`User ${user.email} missing username`);
		} else if (usernames.has(user.username)) {
			errors.push(`Duplicate username ${user.username}`);
		} else {
			usernames.add(user.username);
		}

		if (!user.businessEmail?.trim()) {
			errors.push(`${user.username ?? user.email}: missing businessEmail for Contact for Business`);
		}

		if (emails.has(user.email)) {
			errors.push(`Duplicate email ${user.email}`);
		} else {
			emails.add(user.email);
		}

		if (!categories.some((c) => c.id === profile.categoryId)) {
			errors.push(`${user.username}: categoryId not in active categories`);
		}

		const activeSocials = profile.socialProfiles.filter((s) => s.deletedAt === null);
		if (activeSocials.length < 1) {
			errors.push(`${user.username}: needs ≥1 active social`);
		}
		if (profile.socialProfiles.length > 10) {
			errors.push(`${user.username}: more than 10 socials`);
		}

		const paidBids = profile.bids
			.filter((b) => b.status === "PAID")
			.sort((a, b) => (a.paidAt?.getTime() ?? 0) - (b.paidAt?.getTime() ?? 0));
		const initialPaid = paidBids.filter((b) => b.type === "INITIAL");
		if (initialPaid.length !== 1) {
			errors.push(
				`${user.username}: expected exactly 1 INITIAL PAID bid, got ${initialPaid.length}`,
			);
		}

		const paidSum = paidBids.reduce((sum, bid) => sum + bid.amountCents, 0);
		if (paidSum !== profile.totalBidCents) {
			errors.push(
				`${user.username}: totalBidCents ${profile.totalBidCents} !== paid sum ${paidSum}`,
			);
		}

		const lastPaid = paidBids[paidBids.length - 1];
		if (lastPaid) {
			if (lastPaid.totalAfterCents !== profile.totalBidCents) {
				errors.push(
					`${user.username}: last totalAfterCents ${lastPaid.totalAfterCents} !== totalBidCents`,
				);
			}
			if (!lastPaid.paidAt || lastPaid.paidAt.getTime() !== profile.bidReachedAt.getTime()) {
				errors.push(`${user.username}: bidReachedAt mismatch with last paid bid`);
			}
		}

		for (const bid of profile.bids) {
			if (bid.createdAt.getTime() < profile.joinedAt.getTime() - 60_000) {
				errors.push(`${user.username}: bid created before joinedAt`);
			}
			if (bid.status === "PAID" && bid.paidAt && bid.paidAt < profile.joinedAt) {
				errors.push(`${user.username}: paidAt before joinedAt`);
			}
			if (bid.status === "FAILED" && bid.totalAfterCents != null) {
				errors.push(`${user.username}: FAILED bid must not set totalAfterCents`);
			}
		}

		const socialIds = new Set(profile.socialProfiles.map((s) => s.id));
		for (const event of profile.analyticsEvents) {
			if (event.createdAt.getTime() < profile.joinedAt.getTime() - 1000) {
				errors.push(`${user.username}: analytics before joinedAt`);
				break;
			}
			if (
				event.type === "SOCIAL_CLICK" &&
				event.socialProfileId &&
				!socialIds.has(event.socialProfileId)
			) {
				errors.push(`${user.username}: SOCIAL_CLICK references unknown social`);
			}
		}
	}

	for (const category of categories) {
		const published = mockUsers.filter(
			(u) => u.creatorProfile?.isPublished && u.creatorProfile.categoryId === category.id,
		).length;
		if (published < 3) {
			errors.push(`Category ${category.slug} has only ${published} published mock creators`);
		}
	}

	const general = await listLeaderboard({ page: 1, pageSize: 20 });
	if (general.total < 50) {
		errors.push(`General leaderboard total too low: ${general.total}`);
	}

	for (const category of categories) {
		const board = await listLeaderboard({ categorySlug: category.slug, pageSize: 10 });
		if (board.total < 3) {
			errors.push(`Category leaderboard ${category.slug} has ${board.total} rows`);
		}
	}

	for (const range of ["today", "7d", "30d", "all"] as const) {
		const overview = await getAdminDashboardOverview(range);
		if (range === "all") {
			if (overview.profileViews < 1000) {
				errors.push(`Admin all-time profileViews too low: ${overview.profileViews}`);
			}
			if (overview.socialClicks < 100) {
				errors.push(`Admin all-time socialClicks too low: ${overview.socialClicks}`);
			}
			if (overview.totalBidRevenueCents < 10_000) {
				errors.push(`Admin all-time revenue too low: ${overview.totalBidRevenueCents}`);
			}
		}
		if (range === "30d" && overview.profileViews < 50) {
			errors.push(`Admin 30d profileViews too low: ${overview.profileViews}`);
		}
		if (range === "7d" && overview.profileViews < 10) {
			errors.push(`Admin 7d profileViews too low: ${overview.profileViews}`);
		}
	}

	const failedCount = await db.creatorBid.count({ where: { status: "FAILED" } });
	const paidAgg = await db.creatorBid.aggregate({
		where: { status: "PAID" },
		_sum: { amountCents: true },
	});
	const failedSum = await db.creatorBid.aggregate({
		where: { status: "FAILED" },
		_sum: { amountCents: true },
	});
	if (failedCount < 1) {
		errors.push("Expected some FAILED bids for admin payment history");
	}
	// Sanity: FAILED amounts exist but are not in PAID aggregate (always true by query)
	if ((failedSum._sum.amountCents ?? 0) > 0 && (paidAgg._sum.amountCents ?? 0) <= 0) {
		errors.push("PAID revenue unexpectedly zero while FAILED exists");
	}

	if (errors.length > 0) {
		const sample = errors.slice(0, 25).join("\n - ");
		throw new Error(`Mock seed verification failed (${errors.length} issues):\n - ${sample}`);
	}
}
