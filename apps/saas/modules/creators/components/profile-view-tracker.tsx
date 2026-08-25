"use client";

import { useEffect, useRef } from "react";

/**
 * Records a PROFILE_VIEW on the current SaaS origin.
 * Mount only for non-owners; the API also skips the profile owner.
 */
const ProfileViewTracker = ({ username }: { username: string }) => {
	const recordedRef = useRef(false);
	const profileUsername = username.trim().toLowerCase();

	useEffect(() => {
		if (recordedRef.current || !profileUsername) {
			return;
		}

		recordedRef.current = true;

		void fetch("/api/analytics/profile-view", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username: profileUsername }),
		}).catch(() => {
			// Ignore beacon failures; analytics should not block profile rendering.
		});
	}, [profileUsername]);

	return null;
};

export default ProfileViewTracker;
