import { createId as cuid } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const purchaseTypeEnum = pgEnum("PurchaseType", ["SUBSCRIPTION", "ONE_TIME"]);

export const notificationTypeEnum = pgEnum("NotificationType", ["WELCOME", "APP_UPDATE"]);

export const notificationTargetEnum = pgEnum("NotificationTarget", ["IN_APP", "EMAIL"]);

export const pendingCreatorStatusEnum = pgEnum("PendingCreatorStatus", [
	"PENDING_PAYMENT",
	"PROCESSING",
	"COMPLETED",
	"EXPIRED",
]);

export const creatorBidTypeEnum = pgEnum("CreatorBidType", ["INITIAL", "INCREASE"]);

export const creatorBidStatusEnum = pgEnum("CreatorBidStatus", ["PENDING", "PAID", "FAILED"]);

export const creatorPaymentSourceEnum = pgEnum("CreatorPaymentSource", ["MOCK", "STRIPE"]);

export const creatorAnalyticsEventTypeEnum = pgEnum("CreatorAnalyticsEventType", [
	"PROFILE_VIEW",
	"SOCIAL_CLICK",
	"CONTACT_CLICK",
]);

export const creatorReportReasonEnum = pgEnum("CreatorReportReason", [
	"ADULT_CONTENT",
	"DRUG_RELATED",
	"ILLEGAL",
	"FAKE_OR_IMPERSONATION",
	"OTHER",
]);

export const creatorReportStatusEnum = pgEnum("CreatorReportStatus", [
	"OPEN",
	"REVIEWED",
	"DISMISSED",
	"ACTIONED",
]);

export const user = pgTable("user", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").default(false).notNull(),
	image: text("image"),
	username: text("username").unique(),
	bio: text("bio"),
	businessEmail: text("businessEmail"),
	socialLinks: jsonb("socialLinks"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	role: text("role"),
	banned: boolean("banned").default(false),
	banReason: text("banReason"),
	banExpires: timestamp("banExpires"),
	twoFactorEnabled: boolean("twoFactorEnabled").default(false),
	onboardingComplete: boolean("onboardingComplete"),
	paymentsCustomerId: text("paymentsCustomerId"),
	locale: text("locale"),
	lastActiveOrganizationId: text("lastActiveOrganizationId"),
});

export const session = pgTable(
	"session",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		expiresAt: timestamp("expiresAt").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonatedBy"),
		activeOrganizationId: text("activeOrganizationId"),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		accountId: text("accountId").notNull(),
		providerId: text("providerId").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("accessToken"),
		refreshToken: text("refreshToken"),
		idToken: text("idToken"),
		accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
		refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expiresAt").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const passkey = pgTable(
	"passkey",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		name: text("name"),
		publicKey: text("publicKey").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		credentialID: text("credentialID").notNull(),
		counter: integer("counter").notNull(),
		deviceType: text("deviceType").notNull(),
		backedUp: boolean("backedUp").notNull(),
		transports: text("transports"),
		createdAt: timestamp("createdAt"),
		aaguid: text("aaguid"),
	},
	(table) => [
		index("passkey_userId_idx").on(table.userId),
		index("passkey_credentialID_idx").on(table.credentialID),
	],
);

export const organization = pgTable(
	"organization",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		logo: text("logo"),
		createdAt: timestamp("createdAt").notNull(),
		metadata: text("metadata"),
		paymentsCustomerId: text("paymentsCustomerId"),
	},
	(table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
	"member",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text("role").default("member").notNull(),
		createdAt: timestamp("createdAt").notNull(),
	},
	(table) => [
		index("member_organizationId_idx").on(table.organizationId),
		index("member_userId_idx").on(table.userId),
	],
);

export const invitation = pgTable(
	"invitation",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		role: text("role"),
		status: text("status").default("pending").notNull(),
		expiresAt: timestamp("expiresAt").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		inviterId: text("inviterId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("invitation_organizationId_idx").on(table.organizationId),
		index("invitation_email_idx").on(table.email),
	],
);

export const twoFactor = pgTable(
	"twoFactor",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		secret: text("secret").notNull(),
		backupCodes: text("backupCodes").notNull(),
		verified: boolean("verified").default(false).notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		failedVerificationCount: integer("failedVerificationCount").default(0),
		lockedUntil: timestamp("lockedUntil"),
	},
	(table) => [
		index("twoFactor_secret_idx").on(table.secret),
		index("twoFactor_userId_idx").on(table.userId),
	],
);

export const purchase = pgTable("purchase", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	organizationId: text("organizationId").references(() => organization.id, {
		onDelete: "cascade",
	}),
	userId: text("userId").references(() => user.id, {
		onDelete: "cascade",
	}),
	type: purchaseTypeEnum("type").notNull(),
	customerId: text("customerId").notNull(),
	subscriptionId: text("subscriptionId").unique(),
	priceId: text("priceId").notNull(),
	status: text("status"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt"),
});

export const notification = pgTable(
	"notification",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
		link: text("link"),
		read: boolean("read").notNull().default(false),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("notification_userId_idx").on(table.userId)],
);

export const userNotificationPreference = pgTable(
	"user_notification_preference",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		target: notificationTargetEnum("target").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("user_notification_preference_userId_idx").on(table.userId),
		uniqueIndex("user_notification_preference_user_type_target_uidx").on(
			table.userId,
			table.type,
			table.target,
		),
	],
);

export const creatorCategory = pgTable(
	"creator_category",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description"),
		icon: text("icon"),
		color: text("color"),
		active: boolean("active").notNull().default(true),
		order: integer("order").notNull().default(0),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("creator_category_active_order_idx").on(table.active, table.order)],
);

export const creatorProfile = pgTable(
	"creator_profile",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		publicName: text("publicName").notNull(),
		avatarUrl: text("avatarUrl").notNull(),
		description: text("description"),
		categoryId: text("categoryId")
			.notNull()
			.references(() => creatorCategory.id),
		totalBidCents: integer("totalBidCents").notNull().default(0),
		currency: text("currency").notNull().default("USD"),
		joinedAt: timestamp("joinedAt").notNull(),
		bidReachedAt: timestamp("bidReachedAt").notNull(),
		accountClaimedAt: timestamp("accountClaimedAt"),
		isPublished: boolean("isPublished").notNull().default(false),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("creator_profile_totalBidCents_bidReachedAt_idx").on(
			table.totalBidCents,
			table.bidReachedAt,
		),
		index("creator_profile_categoryId_totalBidCents_bidReachedAt_idx").on(
			table.categoryId,
			table.totalBidCents,
			table.bidReachedAt,
		),
		index("creator_profile_isPublished_totalBidCents_idx").on(
			table.isPublished,
			table.totalBidCents,
		),
		index("creator_profile_categoryId_isPublished_totalBidCents_idx").on(
			table.categoryId,
			table.isPublished,
			table.totalBidCents,
		),
	],
);

export const socialProfile = pgTable(
	"social_profile",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		creatorId: text("creatorId")
			.notNull()
			.references(() => creatorProfile.id, { onDelete: "cascade" }),
		platform: text("platform").notNull(),
		url: text("url").notNull(),
		normalizedUrl: text("normalizedUrl").notNull(),
		position: integer("position").notNull(),
		deletedAt: timestamp("deletedAt"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("social_profile_creatorId_position_uidx").on(table.creatorId, table.position),
		index("social_profile_creatorId_deletedAt_idx").on(table.creatorId, table.deletedAt),
		index("social_profile_normalizedUrl_idx").on(table.normalizedUrl),
		index("social_profile_creatorId_position_idx").on(table.creatorId, table.position),
	],
);

export const pendingCreator = pgTable(
	"pending_creator",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		email: text("email").notNull(),
		publicName: text("publicName").notNull(),
		avatarUrl: text("avatarUrl").notNull(),
		description: text("description"),
		categoryId: text("categoryId")
			.notNull()
			.references(() => creatorCategory.id),
		socialProfiles: jsonb("socialProfiles").notNull(),
		bidAmountCents: integer("bidAmountCents").notNull(),
		currency: text("currency").notNull().default("USD"),
		estimatedRank: integer("estimatedRank"),
		status: pendingCreatorStatusEnum("status").notNull().default("PENDING_PAYMENT"),
		paymentReference: text("paymentReference").unique(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		expiresAt: timestamp("expiresAt").notNull(),
	},
	(table) => [
		index("pending_creator_email_idx").on(table.email),
		index("pending_creator_status_expiresAt_idx").on(table.status, table.expiresAt),
		index("pending_creator_categoryId_idx").on(table.categoryId),
	],
);

export const creatorBid = pgTable(
	"creator_bid",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		creatorId: text("creatorId")
			.notNull()
			.references(() => creatorProfile.id, { onDelete: "cascade" }),
		type: creatorBidTypeEnum("type").notNull(),
		status: creatorBidStatusEnum("status").notNull(),
		amountCents: integer("amountCents").notNull(),
		currency: text("currency").notNull().default("USD"),
		totalAfterCents: integer("totalAfterCents"),
		paymentSource: creatorPaymentSourceEnum("paymentSource").notNull(),
		providerPaymentId: text("providerPaymentId").unique(),
		idempotencyKey: text("idempotencyKey").notNull().unique(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		paidAt: timestamp("paidAt"),
	},
	(table) => [
		index("creator_bid_creatorId_createdAt_idx").on(table.creatorId, table.createdAt),
		index("creator_bid_creatorId_status_createdAt_idx").on(
			table.creatorId,
			table.status,
			table.createdAt,
		),
		index("creator_bid_status_createdAt_idx").on(table.status, table.createdAt),
	],
);

export const creatorAnalyticsEvent = pgTable(
	"creator_analytics_event",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		creatorId: text("creatorId")
			.notNull()
			.references(() => creatorProfile.id, { onDelete: "cascade" }),
		type: creatorAnalyticsEventTypeEnum("type").notNull(),
		socialProfileId: text("socialProfileId").references(() => socialProfile.id, {
			onDelete: "set null",
		}),
		platformSnapshot: text("platformSnapshot"),
		urlSnapshot: text("urlSnapshot"),
		visitorKeyHash: text("visitorKeyHash"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("creator_analytics_event_creatorId_createdAt_idx").on(table.creatorId, table.createdAt),
		index("creator_analytics_event_creatorId_type_createdAt_idx").on(
			table.creatorId,
			table.type,
			table.createdAt,
		),
		index("creator_analytics_event_socialProfileId_createdAt_idx").on(
			table.socialProfileId,
			table.createdAt,
		),
		index("creator_analytics_event_creatorId_type_visitorKeyHash_createdAt_idx").on(
			table.creatorId,
			table.type,
			table.visitorKeyHash,
			table.createdAt,
		),
	],
);

export const creatorAccountReport = pgTable(
	"creator_account_report",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		creatorId: text("creatorId")
			.notNull()
			.references(() => creatorProfile.id, { onDelete: "cascade" }),
		reporterUserId: text("reporterUserId").references(() => user.id, { onDelete: "set null" }),
		reporterName: text("reporterName"),
		reporterEmail: text("reporterEmail"),
		reason: creatorReportReasonEnum("reason").notNull(),
		message: text("message").notNull(),
		status: creatorReportStatusEnum("status").notNull().default("OPEN"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("creator_account_report_creatorId_createdAt_idx").on(table.creatorId, table.createdAt),
		index("creator_account_report_status_createdAt_idx").on(table.status, table.createdAt),
		index("creator_account_report_reporterUserId_createdAt_idx").on(
			table.reporterUserId,
			table.createdAt,
		),
	],
);

export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey),
	members: many(member),
	invitations: many(invitation),
	twoFactors: many(twoFactor),
	purchases: many(purchase),
	notifications: many(notification),
	notificationPreferences: many(userNotificationPreference),
	creatorProfile: one(creatorProfile),
	creatorAccountReports: many(creatorAccountReport),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id],
	}),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	invitations: many(invitation),

	purchases: many(purchase),
}));

export const memberRelations = relations(member, ({ one }) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id],
	}),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id],
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
	}),
}));

export const purchaseRelations = relations(purchase, ({ one }) => ({
	organization: one(organization, {
		fields: [purchase.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [purchase.userId],
		references: [user.id],
	}),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id],
	}),
}));

export const userNotificationPreferenceRelations = relations(
	userNotificationPreference,
	({ one }) => ({
		user: one(user, {
			fields: [userNotificationPreference.userId],
			references: [user.id],
		}),
	}),
);

export const creatorCategoryRelations = relations(creatorCategory, ({ many }) => ({
	creators: many(creatorProfile),
	pendingCreators: many(pendingCreator),
}));

export const creatorProfileRelations = relations(creatorProfile, ({ one, many }) => ({
	user: one(user, {
		fields: [creatorProfile.userId],
		references: [user.id],
	}),
	category: one(creatorCategory, {
		fields: [creatorProfile.categoryId],
		references: [creatorCategory.id],
	}),
	socialProfiles: many(socialProfile),
	bids: many(creatorBid),
	analyticsEvents: many(creatorAnalyticsEvent),
	accountReports: many(creatorAccountReport),
}));

export const socialProfileRelations = relations(socialProfile, ({ one, many }) => ({
	creator: one(creatorProfile, {
		fields: [socialProfile.creatorId],
		references: [creatorProfile.id],
	}),
	analyticsEvents: many(creatorAnalyticsEvent),
}));

export const pendingCreatorRelations = relations(pendingCreator, ({ one }) => ({
	category: one(creatorCategory, {
		fields: [pendingCreator.categoryId],
		references: [creatorCategory.id],
	}),
}));

export const creatorBidRelations = relations(creatorBid, ({ one }) => ({
	creator: one(creatorProfile, {
		fields: [creatorBid.creatorId],
		references: [creatorProfile.id],
	}),
}));

export const creatorAnalyticsEventRelations = relations(creatorAnalyticsEvent, ({ one }) => ({
	creator: one(creatorProfile, {
		fields: [creatorAnalyticsEvent.creatorId],
		references: [creatorProfile.id],
	}),
	socialProfile: one(socialProfile, {
		fields: [creatorAnalyticsEvent.socialProfileId],
		references: [socialProfile.id],
	}),
}));

export const creatorAccountReportRelations = relations(creatorAccountReport, ({ one }) => ({
	creator: one(creatorProfile, {
		fields: [creatorAccountReport.creatorId],
		references: [creatorProfile.id],
	}),
	reporterUser: one(user, {
		fields: [creatorAccountReport.reporterUserId],
		references: [user.id],
	}),
}));
