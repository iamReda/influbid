type Platform = "tiktok" | "instagram" | "facebook" | "twitch";

const platformColors: Record<Platform, string> = {
	instagram: "#E4405F",
	tiktok: "#111111",
	facebook: "#1877F2",
	twitch: "#9146FF",
};

type SocialPlatformIconProps = {
	platform: Platform;
	className?: string;
	colored?: boolean;
};

const SocialPlatformIcon = ({ platform, className, colored = false }: SocialPlatformIconProps) => {
	const icon = (() => {
		switch (platform) {
			case "tiktok":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.03 2.47 5.5 5.5 5.5s5.5-2.47 5.5-5.5V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.27 4.27 0 0 1-1-.48z" />
					</svg>
				);
			case "instagram":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						width="16"
						height="16"
						aria-hidden
					>
						<rect x="3" y="3" width="18" height="18" rx="5" />
						<circle cx="12" cy="12" r="4" />
						<circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
					</svg>
				);
			case "facebook":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M13.5 22v-8h2.7l.4-3.1h-3.1V9.1c0-.9.2-1.5 1.5-1.5H17V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H8v3.1h2.3v8h3.2z" />
					</svg>
				);
			case "twitch":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M4 3l-2 4v13h5v3l3-3h4l6-6V3H4zm15 10-2.5 2.5h-3L11 17v-3H7V5h12v8zm-2.5-6H14v4h2.5V7zm-5 0H9v4h2.5V7z" />
					</svg>
				);
		}
	})();

	if (colored) {
		return <span style={{ color: platformColors[platform] }}>{icon}</span>;
	}

	return icon;
};

export type { Platform };
export { platformColors };
export default SocialPlatformIcon;
