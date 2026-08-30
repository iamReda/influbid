import { createHash } from "node:crypto";

import { auth } from "@repo/auth";
import {
	createAnalyticsEvent,
	createCreatorAccountReport,
	CREATOR_REPORT_REASON_VALUES,
	getPublishedCreatorByUsername,
	type CreatorReportReason,
} from "@repo/database";
import { logger } from "@repo/logs";
import { webhookHandler as paymentsWebhookHandler } from "@repo/payments";
import { handleLocalUpload, handleS3Upload, isLocalStorageProvider } from "@repo/storage";
import { getBaseUrl } from "@repo/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

import { openApiHandler, rpcHandler } from "./orpc/handler";

export { router } from "./orpc/router";
export { finalizeBidIncrease } from "./modules/creators/lib/finalize-bid-increase";
export { finalizeCreatorPayment } from "./modules/creators/lib/finalize-creator-payment";
export {
	assertMockPaymentsAllowed,
	isMockPaymentsEnabled,
} from "./modules/creators/lib/mock-payments";

const saasOrigin = getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000);
const marketingOrigin = getBaseUrl(process.env.NEXT_PUBLIC_MARKETING_URL, 3001);
const corsOrigins = Array.from(new Set([saasOrigin, marketingOrigin]));

function visitorKeyFromHeaders(headerStore: Headers) {
	const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
	const realIp = headerStore.get("x-real-ip");
	const ua = headerStore.get("user-agent") ?? "unknown";
	const ip = forwarded || realIp || "anonymous";
	return createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

export const app = new Hono()
	.basePath("/api")
	// Logger middleware
	.use(honoLogger((message, ...rest) => logger.log(message, ...rest)))
	// Cors middleware
	.use(
		cors({
			origin: corsOrigins,
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "PUT", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	// Auth handler
	.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw))
	// Public profile view beacon (marketing → SaaS, credentials included)
	.post("/analytics/profile-view", async (c) => {
		const body = (await c.req.json().catch(() => null)) as { username?: string } | null;
		const username = body?.username?.trim().toLowerCase();
		if (!username) {
			return c.json({ ok: false, error: "username_required" }, 400);
		}

		const headerStore = c.req.raw.headers;
		const ua = headerStore.get("user-agent")?.toLowerCase() ?? "";
		const isPrefetch =
			headerStore.get("next-router-prefetch") === "1" ||
			headerStore.get("purpose") === "prefetch" ||
			ua.includes("bot") ||
			ua.includes("crawler") ||
			ua.includes("spider");
		if (isPrefetch) {
			return c.json({ ok: true, skipped: "prefetch" });
		}

		const creator = await getPublishedCreatorByUsername(username);
		if (!creator?.user.username) {
			return c.json({ ok: false, error: "not_found" }, 404);
		}

		const session = await auth.api.getSession({ headers: headerStore });
		const viewerUsername = session?.user?.username?.trim().toLowerCase() || null;
		if (
			(session?.user?.id && session.user.id === creator.userId) ||
			(viewerUsername && viewerUsername === creator.user.username.toLowerCase())
		) {
			return c.json({ ok: true, skipped: "owner" });
		}

		await createAnalyticsEvent({
			creatorId: creator.id,
			type: "PROFILE_VIEW",
			visitorKeyHash: visitorKeyFromHeaders(headerStore),
		});

		return c.json({ ok: true, skipped: null });
	})
	// Public creator account report (marketing + SaaS; credentials included when signed in)
	.post("/creators/report", async (c) => {
		const body = (await c.req.json().catch(() => null)) as {
			username?: string;
			reason?: string;
			message?: string;
			reporterName?: string;
			reporterEmail?: string;
		} | null;

		const username = body?.username?.trim().toLowerCase();
		const reason = body?.reason?.trim();
		const message = body?.message?.trim() ?? "";

		if (!username) {
			return c.json({ ok: false, error: "username_required" }, 400);
		}
		if (!reason || !CREATOR_REPORT_REASON_VALUES.includes(reason as CreatorReportReason)) {
			return c.json({ ok: false, error: "reason_required" }, 400);
		}
		if (message.length < 10 || message.length > 2000) {
			return c.json({ ok: false, error: "message_invalid" }, 400);
		}

		const creator = await getPublishedCreatorByUsername(username);
		if (!creator?.user.username) {
			return c.json({ ok: false, error: "not_found" }, 404);
		}

		const headerStore = c.req.raw.headers;
		const session = await auth.api.getSession({ headers: headerStore });
		const sessionUser = session?.user;
		const viewerUsername = sessionUser?.username?.trim().toLowerCase() || null;

		if (
			(sessionUser?.id && sessionUser.id === creator.userId) ||
			(viewerUsername && viewerUsername === creator.user.username.toLowerCase())
		) {
			return c.json({ ok: false, error: "cannot_report_own_account" }, 403);
		}

		let reporterName: string | null = null;
		let reporterEmail: string | null = null;
		let reporterUserId: string | null = null;

		if (sessionUser?.id) {
			reporterUserId = sessionUser.id;
			reporterName = sessionUser.name?.trim() || null;
			reporterEmail = sessionUser.email?.trim().toLowerCase() || null;
		} else {
			reporterName = body?.reporterName?.trim() || null;
			reporterEmail = body?.reporterEmail?.trim().toLowerCase() || null;
			if (!reporterName || reporterName.length < 2) {
				return c.json({ ok: false, error: "name_required" }, 400);
			}
			if (!reporterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
				return c.json({ ok: false, error: "email_required" }, 400);
			}
		}

		await createCreatorAccountReport({
			creatorId: creator.id,
			reporterUserId,
			reporterName,
			reporterEmail,
			reason: reason as CreatorReportReason,
			message,
		});

		return c.json({ ok: true });
	})
	// Payments webhook handler
	.post("/webhooks/payments", (c) => paymentsWebhookHandler(c.req.raw))
	// Avatar/logo uploads proxied through SaaS (local disk or internal MinIO)
	.put("/storage/upload/:bucket/:path", async (c) => {
		const bucketName = c.req.param("bucket");
		const filePath = decodeURIComponent(c.req.param("path"));
		const expires = Number(c.req.query("expires"));
		const signature = c.req.query("sig");

		if (!bucketName || !filePath || !signature || !Number.isFinite(expires)) {
			return c.text("Bad request", 400);
		}

		try {
			const body = Buffer.from(await c.req.arrayBuffer());
			if (isLocalStorageProvider()) {
				await handleLocalUpload({
					bucketName,
					filePath,
					expiresAt: expires,
					signature,
					body,
				});
			} else {
				await handleS3Upload({
					bucketName,
					filePath,
					expiresAt: expires,
					signature,
					body,
				});
			}
			return c.body(null, 200);
		} catch (error) {
			logger.error(error);
			return c.text("Upload failed", 403);
		}
	})
	// Health check
	.get("/health", (c) => c.text("OK"))
	// oRPC handlers (for RPC and OpenAPI)
	.use("*", async (c, next) => {
		const context = {
			headers: c.req.raw.headers,
		};

		const isRpc = c.req.path.includes("/rpc/");

		const handler = isRpc ? rpcHandler : openApiHandler;

		const prefix = isRpc ? "/api/rpc" : "/api";

		const { matched, response } = await handler.handle(c.req.raw, {
			prefix,
			context,
		});

		if (matched) {
			return c.newResponse(response.body, response);
		}

		await next();
	});
