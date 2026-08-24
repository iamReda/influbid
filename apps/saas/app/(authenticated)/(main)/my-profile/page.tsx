import { getSession } from "@auth/lib/server";
import { ensureUserUsername } from "@repo/database";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
	searchParams: Promise<{ preview?: string }>;
};

export default async function MyProfileRedirectPage({ searchParams }: Props) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	let username = session.user.username as string | null | undefined;

	if (!username) {
		const updated = await ensureUserUsername(session.user.id, session.user.name ?? "user");
		username = updated?.username;
	}

	if (!username) {
		redirect("/dashboard");
	}

	const { preview } = await searchParams;

	if (preview === "1") {
		redirect(`/${username}/edit`);
	}

	redirect(`/${username}`);
}
