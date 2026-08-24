"use client";

import Layout from "@shared/components/influencerbid/layout";
import { Receipt } from "lucide-react";

type Payment = {
	id: string;
	date: string;
	description: "Ranking bid" | "Bid increase";
	amount: number;
};

const payments: Payment[] = [
	{
		id: "pay-1",
		date: "Aug 18, 2026 · 2:34 PM",
		description: "Bid increase",
		amount: 142,
	},
	{
		id: "pay-2",
		date: "Aug 9, 2026 · 11:08 AM",
		description: "Bid increase",
		amount: 89,
	},
	{
		id: "pay-3",
		date: "Jul 27, 2026 · 6:51 PM",
		description: "Ranking bid",
		amount: 76,
	},
];

const formatAmount = (amount: number) => `$${amount.toLocaleString("en-US")}`;

const PaymentHistoryPage = () => {
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
						<div className="mb-5 gap-4 max-md:mb-4 flex items-start justify-between">
							<div className="gap-2.5 flex items-center">
								<span className="size-9 bg-b-surface1 text-t-secondary flex shrink-0 items-center justify-center rounded-full">
									<Receipt className="size-4 stroke-[1.75px]" aria-hidden />
								</span>
								<div className="min-w-0">
									<h2 className="text-body-bold text-t-primary">Recent payments</h2>
									<p className="mt-0.5 text-small text-t-tertiary">{payments.length} payments</p>
								</div>
							</div>
							<div className="shrink-0 text-right">
								<div className="text-small text-t-tertiary">Spent</div>
								<div className="mt-0.5 text-body-bold text-t-primary">
									{formatAmount(totalSpent)}
								</div>
							</div>
						</div>

						<div className="divide-stroke-subtle divide-y">
							{payments.map((payment) => (
								<div key={payment.id} className="gap-4 py-4 first:pt-0 last:pb-0 flex items-center">
									<div className="min-w-0 flex-1">
										<div className="text-button font-bold text-t-primary truncate">
											{payment.description}
										</div>
										<time className="mt-1 text-small text-t-tertiary block" dateTime={payment.date}>
											{payment.date}
										</time>
									</div>
									<span className="text-body-bold text-t-primary shrink-0">
										{formatAmount(payment.amount)}
									</span>
								</div>
							))}
						</div>
					</article>
				</div>
			</div>
		</Layout>
	);
};

export default PaymentHistoryPage;
