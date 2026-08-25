"use client";

import { config } from "@config";
import { authClient } from "@shared/lib/auth-client";
import { useEffect, useRef } from "react";

/**
 * Records a PROFILE_VIEW via SaaS (session cookies included).
 * The profile owner never increments their own views.
 */
const ProfileViewTracker = ({ username }: { username: string }) => {
	const recordedRef = useRef(false);
	const { data: session, isPending } = authClient.useSession();
	const profileUsername = username.trim().toLowerCase();
	const sessionUser = session?.user as { username?: string | null } | undefined;
	const viewerUsername = sessionUser?.username?.trim().toLowerCase() || null;

	useEffect(() => {
		if (isPending || recordedRef.current) {
			return;
		}

		// Owner: skip before beacon (and SaaS also skips when session cookies arrive).
		if (viewerUsername && viewerUsername === profileUsername) {
			recordedRef.current = true;
			return;
		}

		recordedRef.current = true;
		const saasBase = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");

		void fetch(`${saasBase}/api/analytics/profile-view`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username: profileUsername }),
		}).catch(() => {
			// Ignore beacon failures; analytics should not block profile rendering.
		});
	}, [isPending, profileUsername, viewerUsername]);

	return null;
};

export default ProfileViewTracker;
