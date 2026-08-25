export const CREATOR_REPORT_REASONS = [
	{ value: "ADULT_CONTENT", label: "Adult content" },
	{ value: "DRUG_RELATED", label: "Drug-related content" },
	{ value: "ILLEGAL", label: "Illegal content" },
	{ value: "FAKE_OR_IMPERSONATION", label: "Fake account or impersonation" },
	{ value: "OTHER", label: "Other" },
] as const;

export type CreatorReportReasonValue = (typeof CREATOR_REPORT_REASONS)[number]["value"];

export const CREATOR_REPORT_REASON_VALUES = CREATOR_REPORT_REASONS.map(
	(reason) => reason.value,
) as [CreatorReportReasonValue, ...CreatorReportReasonValue[]];
