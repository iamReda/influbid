"use client";

import Layout from "@shared/components/influencerbid/layout";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";

const centsToDollars = (cents: number) => Math.round(cents / 100);

const formatAmount = (amount: number) => `$${amount.toLocaleString("en-US")}`;

const formatPaidAt = (value: Date | string | null) => {
	if (!value) {
		return "Pending";
	}

	const date = typeof value === "string" ? new Date(value) : value;
	const datePart = date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	const timePart = date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

	return `${datePart} · ${timePart}`;
};

const descriptionForType = (type: "INITIAL" | "INCREASE") =>
	type === "INITIAL" ? "🎉 First bid" : "Bid increase";

const paymentMetaClass = "text-small text-t-secondary";

const PaymentHistoryPage = () => {
	const { data: bids = [] } = useQuery(orpc.creators.listMyBids.queryOptions());

	const payments = bids.map((bid) => ({
		id: bid.id,
		date: formatPaidAt(bid.paidAt),
		dateTime: bid.paidAt
			? typeof bid.paidAt === "string"
				? bid.paidAt
				: bid.paidAt.toISOString()
			: undefined,
		description: descriptionForType(bid.type),
		amount: centsToDollars(bid.amountCents),
	}));

	const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

	return (
		<Layout isLoggedIn>
			<div className="py-20 max-[1179px]:py-16 max-lg:py-12 max-md:py-8 max-md:overflow-hidden">
				<div className="center max-w-200 max-lg:max-w-175 max-md:max-w-full">
					<div className="mb-12 max-md:mb-8">
						<div className="mb-3 text-h1 max-md:mb-2">Payment History</div>
						<p className="text-body-lg text-t-secondary">Track your ranking bid payments.</p>
					</div>

					<article className="bg-b-surface2 p-6 hover:shadow-hover max-md:p-5 rounded-4xl transition-shadow">
						<div className="mb-6 gap-4 max-md:mb-5 pb-6 max-md:pb-5 border-stroke-subtle flex items-start justify-between border-b">
							<div className="gap-2.5 flex items-center">
								<span className="size-9 bg-b-surface1 text-t-secondary flex shrink-0 items-center justify-center rounded-full">
									<Receipt className="size-4 stroke-[1.75px]" aria-hidden />
								</span>
								<div className="min-w-0">
									<h2 className="text-body-bold text-t-primary">Recent payments</h2>
									<p className={`mt-0.5 ${paymentMetaClass}`}>
										{payments.length} {payments.length === 1 ? "payment" : "payments"}
									</p>
								</div>
							</div>
							<div className="shrink-0 text-right">
								<div className={paymentMetaClass}>Spent</div>
								<div className="mt-0.5 text-body-bold text-t-primary">
									{formatAmount(totalSpent)}
								</div>
							</div>
						</div>

						{payments.length === 0 ? (
							<p className="text-small text-t-tertiary">No payments yet.</p>
						) : (
							<div className="divide-stroke-subtle divide-y">
								{payments.map((payment) => (
									<div
										key={payment.id}
										className="gap-4 py-4 first:pt-0 last:pb-0 flex items-center"
									>
										<div className="min-w-0 flex-1">
											<div className="text-button font-bold text-t-primary truncate">
												{payment.description}
											</div>
											<time className={`mt-1 block ${paymentMetaClass}`} dateTime={payment.dateTime}>
												{payment.date}
											</time>
										</div>
										<span className="text-body-bold text-t-primary shrink-0">
											{formatAmount(payment.amount)}
										</span>
									</div>
								))}
							</div>
						)}
					</article>
				</div>
			</div>
		</Layout>
	);
};

export default PaymentHistoryPage;
