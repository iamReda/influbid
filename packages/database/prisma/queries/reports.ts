import { db } from "../client";
import type { CreatorReportReason } from "../generated/client";

export async function createCreatorAccountReport(input: {
	creatorId: string;
	reporterUserId?: string | null;
	reporterName?: string | null;
	reporterEmail?: string | null;
	reason: CreatorReportReason;
	message: string;
}) {
	return db.creatorAccountReport.create({
		data: {
			creatorId: input.creatorId,
			reporterUserId: input.reporterUserId ?? null,
			reporterName: input.reporterName ?? null,
			reporterEmail: input.reporterEmail ?? null,
			reason: input.reason,
			message: input.message.trim(),
		},
	});
}
