import { createId as cuid } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
// Tables
export const user = sqliteTable("user", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	username: text("username").unique(),
	bio: text("bio"),
	businessEmail: text("businessEmail"),
	socialLinks: text("socialLinks", { mode: "json" }).$type<string[]>(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	role: text("role"),
	banned: integer("banned", { mode: "boolean" }),
	twoFactorEnabled: integer("twoFactorEnabled", { mode: "boolean" }).default(false),
	banReason: text("banReason"),
	banExpires: integer("banExpires", { mode: "timestamp" }),
	onboardingComplete: integer("onboardingComplete", { mode: "boolean" }).notNull().default(false),
	paymentsCustomerId: text("paymentsCustomerId"),
	locale: text("locale"),
	lastActiveOrganizationId: text("lastActiveOrganizationId"),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonatedBy"),
		activeOrganizationId: text("activeOrganizationId"),
		token: text("token").notNull(),
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	},
	(table) => [uniqueIndex("session_token_idx").on(table.token)],
);

export const account = sqliteTable("account", {
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
	expiresAt: integer("expiresAt", { mode: "timestamp" }),
	password: text("password"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

export const passkey = sqliteTable("passkey", {
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
	backedUp: integer("backedUp", { mode: "boolean" }).notNull(),
	transports: text("transports"),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	aaguid: text("aaguid"),
});

export const twoFactor = sqliteTable("twoFactor", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	secret: text("secret").notNull(),
	backupCodes: text("backupCodes").notNull(),
	verified: integer("verified", { mode: "boolean" }).default(false).notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	failedVerificationCount: integer("failedVerificationCount").default(0),
	lockedUntil: integer("lockedUntil", { mode: "timestamp" }),
});

export const organization = sqliteTable(
	"organization",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		logo: text("logo"),
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
		metadata: text("metadata"),
		paymentsCustomerId: text("paymentsCustomerId"),
	},
	(table) => [uniqueIndex("organization_slug_idx").on(table.slug)],
);

export const member = sqliteTable(
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
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	},
	(table) => [uniqueIndex("member_user_org_idx").on(table.userId, table.organizationId)],
);

export const invitation = sqliteTable(
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
		expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		inviterId: text("inviterId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("invitation_organizationId_idx").on(table.organizationId),
		index("invitation_email_idx").on(table.email),
	],
);

export const purchase = sqliteTable("purchase", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	organizationId: text("organizationId").references(() => organization.id, {
		onDelete: "cascade",
	}),
	userId: text("userId").references(() => user.id, {
		onDelete: "cascade",
	}),
	type: text({ enum: ["SUBSCRIPTION", "ONE_TIME"] }).notNull(),
	customerId: text("customerId").notNull(),
	subscriptionId: text("subscriptionId").unique(),
	priceId: text("priceId").notNull(),
	status: text("status"),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const notification = sqliteTable(
	"notification",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text({ enum: ["WELCOME", "APP_UPDATE"] }).notNull(),
		data: text("data", { mode: "json" })
			.$type<Record<string, unknown>>()
			.notNull()
			.$default(() => ({})),
		link: text("link"),
		read: integer("read", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	},
	(table) => [index("notification_userId_idx").on(table.userId)],
);

export const userNotificationPreference = sqliteTable(
	"user_notification_preference",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text({ enum: ["WELCOME", "APP_UPDATE"] }).notNull(),
		target: text({ enum: ["IN_APP", "EMAIL"] }).notNull(),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
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

export const creatorCategory = sqliteTable(
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
		active: integer("active", { mode: "boolean" }).notNull().default(true),
		order: integer("order").notNull().default(0),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	},
	(table) => [index("creator_category_active_order_idx").on(table.active, table.order)],
);

export const creatorProfile = sqliteTable(
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
		joinedAt: integer("joinedAt", { mode: "timestamp" }).notNull(),
		bidReachedAt: integer("bidReachedAt", { mode: "timestamp" }).notNull(),
		accountClaimedAt: integer("accountClaimedAt", { mode: "timestamp" }),
		countryCode: text("countryCode"),
		gender: text({ enum: ["MAN", "WOMAN", "PREFER_NOT_TO_SAY"] }),
		languages: text("languages", { mode: "json" }).$type<string[]>(),
		isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
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

export const socialProfile = sqliteTable(
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
		deletedAt: integer("deletedAt", { mode: "timestamp" }),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("social_profile_creatorId_position_uidx").on(table.creatorId, table.position),
		index("social_profile_creatorId_deletedAt_idx").on(table.creatorId, table.deletedAt),
		index("social_profile_normalizedUrl_idx").on(table.normalizedUrl),
		index("social_profile_creatorId_position_idx").on(table.creatorId, table.position),
	],
);

export const pendingCreator = sqliteTable(
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
		socialProfiles: text("socialProfiles", { mode: "json" }).notNull(),
		countryCode: text("countryCode"),
		bidAmountCents: integer("bidAmountCents").notNull(),
		currency: text("currency").notNull().default("USD"),
		estimatedRank: integer("estimatedRank"),
		status: text({
			enum: ["PENDING_PAYMENT", "PROCESSING", "COMPLETED", "EXPIRED"],
		})
			.notNull()
			.default("PENDING_PAYMENT"),
		paymentReference: text("paymentReference").unique(),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
		expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		index("pending_creator_email_idx").on(table.email),
		index("pending_creator_status_expiresAt_idx").on(table.status, table.expiresAt),
		index("pending_creator_categoryId_idx").on(table.categoryId),
	],
);

export const creatorBid = sqliteTable(
	"creator_bid",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		creatorId: text("creatorId")
			.notNull()
			.references(() => creatorProfile.id, { onDelete: "cascade" }),
		type: text({ enum: ["INITIAL", "INCREASE"] }).notNull(),
		status: text({ enum: ["PENDING", "PAID", "FAILED"] }).notNull(),
		amountCents: integer("amountCents").notNull(),
		currency: text("currency").notNull().default("USD"),
		totalAfterCents: integer("totalAfterCents"),
		paymentSource: text({ enum: ["MOCK", "STRIPE"] }).notNull(),
		providerPaymentId: text("providerPaymentId").unique(),
		idempotencyKey: text("idempotencyKey").notNull().unique(),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		paidAt: integer("paidAt", { mode: "timestamp" }),
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

export const creatorAnalyticsEvent = sqliteTable(
	"creator_analytics_event",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		creatorId: text("creatorId")
			.notNull()
			.references(() => creatorProfile.id, { onDelete: "cascade" }),
		type: text({
			enum: ["PROFILE_VIEW", "SOCIAL_CLICK", "CONTACT_CLICK"],
		}).notNull(),
		socialProfileId: text("socialProfileId").references(() => socialProfile.id, {
			onDelete: "set null",
		}),
		platformSnapshot: text("platformSnapshot"),
		urlSnapshot: text("urlSnapshot"),
		visitorKeyHash: text("visitorKeyHash"),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
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

export const creatorAccountReport = sqliteTable(
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
		reason: text({
			enum: ["ADULT_CONTENT", "DRUG_RELATED", "ILLEGAL", "FAKE_OR_IMPERSONATION", "OTHER"],
		}).notNull(),
		message: text("message").notNull(),
		status: text({
			enum: ["OPEN", "REVIEWED", "DISMISSED", "ACTIONED"],
		})
			.notNull()
			.default("OPEN"),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdateFn(() => new Date()),
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

// Relations
export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey),
	members: many(member),
	invitations: many(invitation),
	twoFactors: many(twoFactor),

	purchases: many(purchase),
	memberships: many(member),
	notifications: many(notification),
	notificationPreferences: many(userNotificationPreference),
	creatorProfile: one(creatorProfile),
	creatorAccountReports: many(creatorAccountReport),
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

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
	user: one(user, {
		fields: [twoFactor.userId],
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
