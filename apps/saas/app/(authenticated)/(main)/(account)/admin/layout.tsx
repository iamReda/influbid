import { getSession } from "@auth/lib/server";
import { checkPermission } from "@repo/permissions";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	// Nested layouts can render before the parent authenticated layout calls
	// setup(), so do not use permix.check here. admin.access is user-scoped.
	if (!checkPermission({ user: session.user }, "admin.access")) {
		redirect("/");
	}

	return children;
}
