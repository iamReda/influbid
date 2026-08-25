/** Minimum initial bid and bid increase, in USD cents. */
export const MIN_BID_CENTS = 500;

export const DEFAULT_CURRENCY = "USD";

export function dollarsToCents(dollars: number): number {
	return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
	return cents / 100;
}

export function formatUsdFromCents(cents: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(centsToDollars(cents));
}
