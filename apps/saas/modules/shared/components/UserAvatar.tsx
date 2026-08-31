import { config as storageConfig } from "@repo/storage/config";
import { cn } from "@repo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { useEffect, useMemo, useState } from "react";

export const USER_AVATAR_UPDATED_EVENT = "user-avatar-updated";

export const UserAvatar = ({
	name,
	avatarUrl,
	className,
	ref,
}: React.ComponentProps<typeof Avatar> & {
	name: string;
	avatarUrl?: string | null;
	className?: string;
}) => {
	const [revision, setRevision] = useState(0);
	const initials = useMemo(
		() =>
			name
				.split(" ")
				.slice(0, 2)
				.map((n) => n[0])
				.join(""),
		[name],
	);

	const avatarSrc = useMemo(() => {
		if (!avatarUrl) {
			return undefined;
		}

		const src = avatarUrl.startsWith("http")
			? avatarUrl
			: `/image-proxy/${storageConfig.bucketNames.avatars}/${avatarUrl}`;

		if (revision === 0 || avatarUrl.startsWith("http")) {
			return src;
		}

		const separator = src.includes("?") ? "&" : "?";
		return `${src}${separator}v=${revision}`;
	}, [avatarUrl, revision]);

	useEffect(() => {
		const refreshAvatar = (event: Event) => {
			const updatedPath = (event as CustomEvent<string>).detail;
			if (updatedPath === avatarUrl) {
				setRevision(Date.now());
			}
		};

		window.addEventListener(USER_AVATAR_UPDATED_EVENT, refreshAvatar);
		return () => window.removeEventListener(USER_AVATAR_UPDATED_EVENT, refreshAvatar);
	}, [avatarUrl]);

	return (
		<Avatar ref={ref} className={cn("size-8 rounded-full", className)}>
			<AvatarImage src={avatarSrc} />
			<AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
		</Avatar>
	);
};

UserAvatar.displayName = "UserAvatar";
