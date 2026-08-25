import { db } from "../client";
import { creatorAccountReport } from "../schema/postgres";

export async function createCreatorAccountReport(input: {
	creatorId: string;
	reporterUserId?: string | null;
	reporterName?: string | null;
	reporterEmail?: string | null;
	reason: "ADULT_CONTENT" | "DRUG_RELATED" | "ILLEGAL" | "FAKE_OR_IMPERSONATION" | "OTHER";
	message: string;
}) {
	const [created] = await db
		.insert(creatorAccountReport)
		.values({
			creatorId: input.creatorId,
			reporterUserId: input.reporterUserId ?? null,
			reporterName: input.reporterName ?? null,
			reporterEmail: input.reporterEmail ?? null,
			reason: input.reason,
			message: input.message.trim(),
		})
		.returning();

	return created;
}
