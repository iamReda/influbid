"use server";

import { isIsoCountryCode, type IsoCountryCode } from "@repo/utils";
import { headers } from "next/headers";

function isPrivateOrLocalIp(ip: string): boolean {
	const value = ip.trim().toLowerCase();
	if (!value || value === "unknown" || value === "::1" || value === "127.0.0.1") {
		return true;
	}
	if (value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("127.")) {
		return true;
	}
	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) {
		return true;
	}
	if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) {
		return true;
	}
	return false;
}

function countryFromHeaders(headerStore: Headers): IsoCountryCode | null {
	const raw = (
		headerStore.get("cf-ipcountry") ||
		headerStore.get("x-vercel-ip-country") ||
		headerStore.get("cloudfront-viewer-country") ||
		""
	)
		.trim()
		.toUpperCase();

	if (!raw || raw === "XX" || raw === "T1") {
		return null;
	}

	return isIsoCountryCode(raw) ? raw : null;
}

function clientIpFromHeaders(headerStore: Headers): string | null {
	const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
	const realIp = headerStore.get("x-real-ip")?.trim();
	const ip = forwarded || realIp || null;
	if (!ip || isPrivateOrLocalIp(ip)) {
		return null;
	}
	return ip;
}

async function lookupCountryByIp(ip: string): Promise<IsoCountryCode | null> {
	try {
		const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
			headers: { accept: "application/json" },
			signal: AbortSignal.timeout(3000),
			cache: "no-store",
		});
		if (!response.ok) {
			return null;
		}
		const data = (await response.json()) as {
			success?: boolean;
			country_code?: string;
		};
		if (!data.success || !data.country_code) {
			return null;
		}
		const code = data.country_code.trim().toUpperCase();
		return isIsoCountryCode(code) ? code : null;
	} catch {
		return null;
	}
}

/**
 * Best-effort country detection from CDN geo headers or client IP.
 * Returns null when detection is unavailable (e.g. localhost).
 */
export async function detectCountryFromIpAction(): Promise<IsoCountryCode | null> {
	const headerStore = await headers();
	const fromHeader = countryFromHeaders(headerStore);
	if (fromHeader) {
		return fromHeader;
	}

	const ip = clientIpFromHeaders(headerStore);
	if (!ip) {
		return null;
	}

	return lookupCountryByIp(ip);
}
