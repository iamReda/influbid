import MyProfilePage from "@creators/components/my-profile-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
	title: "My profile",
};

export default function MyProfileRoutePage() {
	return (
		<Suspense fallback={null}>
			<MyProfilePage />
		</Suspense>
	);
}
