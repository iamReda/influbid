import { MagicLinkConfirm } from "@auth/components/MagicLinkConfirm";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "Confirm sign-in",
	};
}

export default function MagicLinkConfirmPage() {
	return (
		<Suspense fallback={null}>
			<MagicLinkConfirm />
		</Suspense>
	);
}
