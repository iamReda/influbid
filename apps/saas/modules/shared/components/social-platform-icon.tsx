type Platform =
	| "tiktok"
	| "instagram"
	| "facebook"
	| "twitch"
	| "youtube"
	| "x"
	| "linkedin"
	| "snapchat"
	| "pinterest"
	| "threads"
	| "kick"
	| "discord"
	| "reddit"
	| "telegram";

const platformColors: Record<Platform, string> = {
	instagram: "#E4405F",
	tiktok: "#111111",
	facebook: "#1877F2",
	twitch: "#9146FF",
	youtube: "#FF0000",
	x: "#111111",
	linkedin: "#0A66C2",
	snapchat: "#FFFC00",
	pinterest: "#E60023",
	threads: "#111111",
	kick: "#53FC18",
	discord: "#5865F2",
	reddit: "#FF4500",
	telegram: "#26A5E4",
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
			case "youtube":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5v-7l6.3 3.5-6.3 3.5z" />
					</svg>
				);
			case "x":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.5l-5.1-6.7L5.8 22H2.7l7.3-8.3L.7 2h6.7l4.6 6.1L18.9 2zm-1.1 18h1.8L6.3 3.9H4.4L17.8 20z" />
					</svg>
				);
			case "linkedin":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.25h4.52V24H.24V8.25zM8.34 8.25h4.33v2.14h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.01 5.42 6.93V24h-4.52v-7.75c0-1.85-.03-4.22-2.57-4.22-2.57 0-2.97 2.01-2.97 4.09V24H8.34V8.25z" />
					</svg>
				);
			case "snapchat":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M12.07.5c2.7 0 5.05 1.45 6.2 3.8.5 1.02.74 2.16.74 3.36v1.07c0 .2.04.4.1.58.3.9.94 1.62 1.8 2.02.2.1.28.28.22.47-.14.45-.7.8-1.5 1.02-.16.04-.27.2-.24.37.1.55.42 1.4 1.05 1.96.18.16.16.4-.05.5-.9.4-1.9.62-2.95.62-.22 0-.43-.01-.64-.03-.2-.02-.38.1-.42.3-.2.9-.78 1.96-2.16 2.72-.14.08-.2.25-.14.4.18.48.58 1.18 1.55 1.55.2.08.28.3.16.47-.26.36-.9.78-2.2.78s-1.94-.42-2.2-.78c-.12-.17-.04-.4.16-.47.97-.37 1.37-1.07 1.55-1.55.06-.15 0-.32-.14-.4-1.38-.76-1.96-1.82-2.16-2.72-.04-.2-.22-.32-.42-.3-.21.02-.42.03-.64.03-1.05 0-2.05-.22-2.95-.62-.21-.1-.23-.34-.05-.5.63-.56.95-1.41 1.05-1.96.03-.17-.08-.33-.24-.37-.8-.22-1.36-.57-1.5-1.02-.06-.19.02-.37.22-.47.86-.4 1.5-1.12 1.8-2.02.06-.18.1-.38.1-.58V7.66c0-1.2.24-2.34.74-3.36C6.97 1.95 9.32.5 12.02.5h.05z" />
					</svg>
				);
			case "pinterest":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.15 9.42 7.6 11.17-.1-.95-.2-2.4.04-3.44.22-.94 1.4-5.97 1.4-5.97s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.2.6 2.17 1.78 2.17 2.13 0 3.77-2.25 3.77-5.5 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.41 2.56-5.41 5.2 0 1.03.4 2.14.9 2.74.1.12.11.22.08.34-.09.36-.28 1.14-.32 1.3-.05.2-.17.25-.39.15-1.46-.68-2.37-2.81-2.37-4.52 0-3.69 2.68-7.07 7.73-7.07 4.06 0 7.21 2.89 7.21 6.76 0 4.03-2.54 7.28-6.07 7.28-1.18 0-2.3-.62-2.68-1.34l-.73 2.78c-.26 1.01-.97 2.28-1.45 3.05C9.57 23.77 10.76 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z" />
					</svg>
				);
			case "threads":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M16.6 9.4c-.1-2.5-1.5-4.1-4.1-4.2-1.7 0-3.1.7-3.8 1.9l1.5.9c.5-.8 1.3-1.2 2.3-1.2 1.6 0 2.4.9 2.5 2.5-.8-.3-1.6-.4-2.5-.4-2.5 0-4.2 1.3-4.2 3.5 0 2.1 1.7 3.4 3.9 3.4 1.5 0 2.7-.6 3.4-1.7.5.9 1.2 1.3 2.3 1.4v-1.6c-.5-.1-.8-.4-.9-.9.8-1 1.2-2.3 1.1-3.9l-.5.3zm-4.1 4.7c-1.2 0-2-.6-2-1.6 0-1.1.9-1.8 2.5-1.8.8 0 1.5.1 2.2.4-.1 1.9-1.1 3-2.7 3z" />
						<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 21.8c-5.4 0-9.8-4.4-9.8-9.8S6.6 2.2 12 2.2s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8z" />
					</svg>
				);
			case "kick":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M3 3h5.5v6.2L14.2 3H20l-6.8 7.3L20 21h-5.8l-5.7-7.5V21H3V3z" />
					</svg>
				);
			case "discord":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M20.3 4.4A19.8 19.8 0 0 0 15.6 3l-.3.6c1.6.4 3.1 1 4.5 1.8-1.8-1-3.8-1.7-5.9-2C12.6 3.2 11.4 3.2 10.1 3.4 8 3.7 6 4.4 4.2 5.4c1.4-.8 2.9-1.4 4.5-1.8L8.4 3A19.8 19.8 0 0 0 3.7 4.4C1.3 8 0.6 11.5 1 15c1.8 1.3 3.7 2.2 5.7 2.7l.7-1.2c-.8-.3-1.5-.7-2.2-1.1.2.1.3.2.5.3 3.6 1.7 7.5 1.7 11 0 .2-.1.3-.2.5-.3-.7.5-1.4.8-2.2 1.1l.7 1.2c2-.5 3.9-1.4 5.7-2.7.5-4-0.3-7.5-2.4-10.6zM8.7 13.6c-1.1 0-2-.9-2-2.1 0-1.1.9-2.1 2-2.1s2.1.9 2.1 2.1c0 1.1-.9 2.1-2.1 2.1zm6.6 0c-1.1 0-2-.9-2-2.1 0-1.1.9-2.1 2-2.1s2.1.9 2.1 2.1c0 1.1-1 2.1-2.1 2.1z" />
					</svg>
				);
			case "reddit":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.74c.69 0 1.25.56 1.25 1.25a1.25 1.25 0 0 1-2.44.56l-2.53-.8a.75.75 0 0 0-.9.42l-.8 2.1c1.77.1 3.4.67 4.6 1.55.4-.3.9-.47 1.44-.47 1.35 0 2.44 1.1 2.44 2.44 0 .9-.5 1.7-1.25 2.1v.4c0 2.8-3.24 5.08-7.22 5.08s-7.22-2.28-7.22-5.08v-.4A2.44 2.44 0 0 1 4.1 9.8c0-1.35 1.1-2.44 2.44-2.44.55 0 1.05.17 1.45.48 1.2-.88 2.84-1.45 4.6-1.55l.8-2.1a.75.75 0 0 1 .9-.42l2.53.8c.2-.4.62-.68 1.1-.68zM8.7 11.3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm6.6 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM8.9 15.6c.5 1.1 1.7 1.9 3.1 1.9s2.6-.8 3.1-1.9c.1-.2 0-.4-.2-.5-.2-.1-.4 0-.5.2-.4.8-1.3 1.3-2.4 1.3s-2-.5-2.4-1.3c-.1-.2-.3-.3-.5-.2-.2.1-.3.3-.2.5z" />
					</svg>
				);
			case "telegram":
				return (
					<svg
						className={className}
						viewBox="0 0 24 24"
						fill="currentColor"
						width="16"
						height="16"
						aria-hidden
					>
						<path d="M11.9 0C5.3 0 0 5.3 0 11.9s5.3 11.9 11.9 11.9 11.9-5.3 11.9-11.9S18.5 0 11.9 0zm5.9 8.1-2 9.4c-.1.6-.5.8-1 .5l-2.8-2.1-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.9 5.3-4.8c.2-.2 0-.3-.3-.1l-6.5 4.1-2.8-.9c-.6-.2-.6-.6.1-.9l11-4.2c.5-.2 1 .1.8.9z" />
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
