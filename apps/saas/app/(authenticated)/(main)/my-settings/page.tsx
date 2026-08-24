import MySettingsPage from "@settings/components/my-settings-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Account settings",
};

export default function MySettingsRoutePage() {
	return <MySettingsPage />;
}
