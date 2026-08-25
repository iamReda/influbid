import { SessionProvider } from "@auth/components/SessionProvider";
import type { PropsWithChildren } from "react";

/**
 * Public SaaS routes (e.g. creator profiles) that anyone can open.
 * Session is optional — guests see the page; signed-in users get header/session UI.
 */
export default function PublicLayout({ children }: PropsWithChildren) {
	return <SessionProvider>{children}</SessionProvider>;
}
