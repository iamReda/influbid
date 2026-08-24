import { auth } from "@repo/auth";
import { logger } from "@repo/logs";
import { webhookHandler as paymentsWebhookHandler } from "@repo/payments";
import { handleLocalUpload, isLocalStorageProvider } from "@repo/storage";
import { getBaseUrl } from "@repo/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

import { openApiHandler, rpcHandler } from "./orpc/handler";

export { router } from "./orpc/router";

const saasOrigin = getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000);
const marketingOrigin = getBaseUrl(process.env.NEXT_PUBLIC_MARKETING_URL, 3001);
const corsOrigins = Array.from(new Set([saasOrigin, marketingOrigin]));

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
	// Payments webhook handler
	.post("/webhooks/payments", (c) => paymentsWebhookHandler(c.req.raw))
	// Local filesystem avatar/logo uploads (when STORAGE_PROVIDER=local)
	.put("/storage/upload/:bucket/:path", async (c) => {
		if (!isLocalStorageProvider()) {
			return c.text("Local storage is not enabled", 404);
		}

		const bucketName = c.req.param("bucket");
		const filePath = decodeURIComponent(c.req.param("path"));
		const expires = Number(c.req.query("expires"));
		const signature = c.req.query("sig");

		if (!bucketName || !filePath || !signature || !Number.isFinite(expires)) {
			return c.text("Bad request", 400);
		}

		try {
			const body = Buffer.from(await c.req.arrayBuffer());
			await handleLocalUpload({
				bucketName,
				filePath,
				expiresAt: expires,
				signature,
				body,
			});
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
