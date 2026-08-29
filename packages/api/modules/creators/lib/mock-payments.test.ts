import { afterEach, describe, expect, it } from "vitest";

import { assertMockPaymentsAllowed, isMockPaymentsEnabled } from "./mock-payments";

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
	process.env.NODE_ENV = originalNodeEnv;
	delete process.env.MOCK_PAYMENTS;
	delete process.env.ALLOW_MOCK_PAYMENTS_IN_PRODUCTION;
});

describe("mock payment gate", () => {
	it("allows mock payments in development when enabled", () => {
		process.env.NODE_ENV = "development";
		process.env.MOCK_PAYMENTS = "true";

		expect(isMockPaymentsEnabled()).toBe(true);
		expect(() => assertMockPaymentsAllowed()).not.toThrow();
	});

	it("keeps mock payments disabled when the main flag is absent", () => {
		process.env.NODE_ENV = "development";

		expect(isMockPaymentsEnabled()).toBe(false);
		expect(() => assertMockPaymentsAllowed()).toThrow("Mock payments are disabled");
	});

	it("blocks mock payments in production without the explicit override", () => {
		process.env.NODE_ENV = "production";
		process.env.MOCK_PAYMENTS = "true";

		expect(isMockPaymentsEnabled()).toBe(false);
		expect(() => assertMockPaymentsAllowed()).toThrow("Mock payments are disabled");
	});

	it("allows mock payments in production with both explicit flags", () => {
		process.env.NODE_ENV = "production";
		process.env.MOCK_PAYMENTS = "true";
		process.env.ALLOW_MOCK_PAYMENTS_IN_PRODUCTION = "true";

		expect(isMockPaymentsEnabled()).toBe(true);
		expect(() => assertMockPaymentsAllowed()).not.toThrow();
	});
});
