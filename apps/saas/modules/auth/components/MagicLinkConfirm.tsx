"use client";

import Button from "@repo/ui/components/influencerbid/button";
import { useSearchParams } from "next/navigation";

/**
 * Intermediate step before Better Auth's one-time `/magic-link/verify` GET.
 * Email security scanners prefetch links and would otherwise consume the token
 * before the user clicks. Form submit is not followed by those scanners.
 */
export function MagicLinkConfirm() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token")?.trim() ?? "";
	const callbackURL = searchParams.get("callbackURL")?.trim() || "/dashboard";
	const errorCallbackURL = searchParams.get("errorCallbackURL")?.trim() || "/login";
	const newUserCallbackURL = searchParams.get("newUserCallbackURL")?.trim();

	if (!token) {
		return (
			<div className="">
				<div className="mb-4 text-h3 text-center">Invalid sign-in link</div>
				<p className="text-body text-t-secondary mb-8 text-center">
					This link is missing a token. Request a new magic link from your signup email, or sign in
					with your password.
				</p>
				<Button className="w-full" isSecondary as="link" href="/login">
					Go to sign in
				</Button>
			</div>
		);
	}

	return (
		<div className="">
			<div className="mb-4 text-h3 text-center">Confirm sign-in</div>
			<p className="text-body text-t-secondary mb-8 text-center">
				Click below to securely open your dashboard. This confirms you opened the email link.
			</p>
			<form method="GET" action="/api/auth/magic-link/verify">
				<input type="hidden" name="token" value={token} />
				<input type="hidden" name="callbackURL" value={callbackURL} />
				<input type="hidden" name="errorCallbackURL" value={errorCallbackURL} />
				{newUserCallbackURL ? (
					<input type="hidden" name="newUserCallbackURL" value={newUserCallbackURL} />
				) : null}
				<Button className="w-full" isSecondary type="submit">
					Continue to dashboard
				</Button>
			</form>
		</div>
	);
}
