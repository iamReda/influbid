"use client";

import { config } from "@config";
import type { auth } from "@repo/auth";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");

export const authClient = createAuthClient({
	baseURL: saasBase,
	plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
});
