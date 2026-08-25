/**
 * Dev-only mock payment gate.
 * Must never succeed in production regardless of env flags.
 */
export function assertMockPaymentsAllowed() {
	const enabled = process.env.MOCK_PAYMENTS === "true";
	const isProduction = process.env.NODE_ENV === "production";

	if (isProduction || !enabled) {
		throw new Error("Mock payments are disabled");
	}
}

export function isMockPaymentsEnabled() {
	return process.env.NODE_ENV !== "production" && process.env.MOCK_PAYMENTS === "true";
}
