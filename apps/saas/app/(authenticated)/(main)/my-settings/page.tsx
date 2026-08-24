import { redirect } from "next/navigation";

export default function MySettingsRedirectPage() {
	redirect("/account");
}
