export function isMockPaymentsEnabled() {
	const enabled = process.env.MOCK_PAYMENTS === "true";
	const isProduction = process.env.NODE_ENV === "production";
	const productionOverride = process.env.ALLOW_MOCK_PAYMENTS_IN_PRODUCTION === "true";

	return enabled && (!isProduction || productionOverride);
}

export function assertMockPaymentsAllowed() {
	if (!isMockPaymentsEnabled()) {
		throw new Error("Mock payments are disabled");
	}
}
