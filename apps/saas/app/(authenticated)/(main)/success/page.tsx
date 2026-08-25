import BidIncreaseSuccessPage from "@ranking/components/bid-increase-success-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Payment successful",
};

export default function SuccessRoutePage() {
	return <BidIncreaseSuccessPage />;
}
