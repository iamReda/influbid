import { db } from "../../prisma/client";

const MOCK_EMAIL_SUFFIX = "@example.com";

/**
 * Remove only previously seeded mock creators.
 * Scoped to @example.com users that are not admins.
 * Also clears leftover PendingCreator rows with @example.com emails.
 */
export async function cleanupMockCreators(): Promise<{
	deletedUsers: number;
	deletedPending: number;
}> {
	const pendingResult = await db.pendingCreator.deleteMany({
		where: {
			email: { endsWith: MOCK_EMAIL_SUFFIX },
		},
	});

	const mockUsers = await db.user.findMany({
		where: {
			email: { endsWith: MOCK_EMAIL_SUFFIX },
			OR: [{ role: null }, { role: { not: "admin" } }],
		},
		select: { id: true, role: true, email: true },
	});

	const ids = mockUsers.filter((user) => user.role !== "admin").map((user) => user.id);

	if (ids.length === 0) {
		return { deletedUsers: 0, deletedPending: pendingResult.count };
	}

	const deleted = await db.user.deleteMany({
		where: { id: { in: ids } },
	});

	return { deletedUsers: deleted.count, deletedPending: pendingResult.count };
}
