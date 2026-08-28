export * from "./postgres";

export const NotificationTarget = {
	IN_APP: "IN_APP",
	EMAIL: "EMAIL",
} as const;

export type NotificationTarget = (typeof NotificationTarget)[keyof typeof NotificationTarget];

export const NotificationType = {
	WELCOME: "WELCOME",
	APP_UPDATE: "APP_UPDATE",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const PendingCreatorStatus = {
	PENDING_PAYMENT: "PENDING_PAYMENT",
	PROCESSING: "PROCESSING",
	COMPLETED: "COMPLETED",
	EXPIRED: "EXPIRED",
} as const;

export type PendingCreatorStatus = (typeof PendingCreatorStatus)[keyof typeof PendingCreatorStatus];

export const CreatorBidType = {
	INITIAL: "INITIAL",
	INCREASE: "INCREASE",
} as const;

export type CreatorBidType = (typeof CreatorBidType)[keyof typeof CreatorBidType];

export const CreatorBidStatus = {
	PENDING: "PENDING",
	PAID: "PAID",
	FAILED: "FAILED",
} as const;

export type CreatorBidStatus = (typeof CreatorBidStatus)[keyof typeof CreatorBidStatus];

export const CreatorPaymentSource = {
	MOCK: "MOCK",
	STRIPE: "STRIPE",
} as const;

export type CreatorPaymentSource = (typeof CreatorPaymentSource)[keyof typeof CreatorPaymentSource];

export const CreatorAnalyticsEventType = {
	PROFILE_VIEW: "PROFILE_VIEW",
	SOCIAL_CLICK: "SOCIAL_CLICK",
	CONTACT_CLICK: "CONTACT_CLICK",
} as const;

export type CreatorAnalyticsEventType =
	(typeof CreatorAnalyticsEventType)[keyof typeof CreatorAnalyticsEventType];

export const CreatorReportReason = {
	ADULT_CONTENT: "ADULT_CONTENT",
	DRUG_RELATED: "DRUG_RELATED",
	ILLEGAL: "ILLEGAL",
	FAKE_OR_IMPERSONATION: "FAKE_OR_IMPERSONATION",
	OTHER: "OTHER",
} as const;

export type CreatorReportReason = (typeof CreatorReportReason)[keyof typeof CreatorReportReason];

export const CreatorReportStatus = {
	OPEN: "OPEN",
	REVIEWED: "REVIEWED",
	DISMISSED: "DISMISSED",
	ACTIONED: "ACTIONED",
} as const;

export type CreatorReportStatus = (typeof CreatorReportStatus)[keyof typeof CreatorReportStatus];

export const CreatorGender = {
	MAN: "MAN",
	WOMAN: "WOMAN",
	PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
} as const;

export type CreatorGender = (typeof CreatorGender)[keyof typeof CreatorGender];
