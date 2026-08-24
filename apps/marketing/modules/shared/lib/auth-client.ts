"use client";

import { config } from "@config";
import { createAuthClient } from "better-auth/react";

const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");

export const authClient = createAuthClient({
	baseURL: saasBase,
});
