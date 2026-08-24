import PaymentHistoryPage from "@payments/components/payment-history-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Payment history",
};

export default function PaymentHistoryRoutePage() {
	return <PaymentHistoryPage />;
}
