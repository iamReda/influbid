type FloatingIconConfig = {
	src: string;
	alt: string;
	animationClass: string;
	offsetClass?: string;
};

const iconSizeClass = "w-[clamp(3rem,3.9vw,4.25rem)] h-[clamp(3rem,3.9vw,4.25rem)]";

const leftIcons: FloatingIconConfig[] = [
	{
		src: "/images/start/snapchat.png?v=2",
		alt: "Snapchat",
		animationClass: "start-float-a",
		offsetClass: "ml-0",
	},
	{
		src: "/images/start/tiktok.png?v=4",
		alt: "TikTok",
		animationClass: "start-float-b",
		offsetClass: "ml-3",
	},
	{
		src: "/images/start/twitch.png?v=2",
		alt: "Twitch",
		animationClass: "start-float-c",
		offsetClass: "ml-1.5",
	},
];

const rightIcons: FloatingIconConfig[] = [
	{
		src: "/images/start/instagram.png?v=2",
		alt: "Instagram",
		animationClass: "start-float-d",
		offsetClass: "mr-0",
	},
	{
		src: "/images/start/youtube.png?v=2",
		alt: "YouTube",
		animationClass: "start-float-e",
		offsetClass: "mr-3",
	},
	{
		src: "/images/start/facebook.png?v=2",
		alt: "Facebook",
		animationClass: "start-float-f",
		offsetClass: "mr-1.5",
	},
];

const renderIcon = (icon: FloatingIconConfig) => (
	<div
		key={icon.alt}
		className={`start-float-icon shrink-0 ${icon.animationClass} ${iconSizeClass} ${icon.offsetClass ?? ""}`}
	>
		{/* eslint-disable-next-line @next/next/no-img-element -- local transparent PNGs must skip next/image optimization */}
		<img
			className="size-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
			src={icon.src}
			width={68}
			height={68}
			alt=""
			decoding="async"
			draggable={false}
		/>
	</div>
);

const StartFloatingIcons = () => (
	<div className="inset-x-0 top-0 max-md:hidden pointer-events-none absolute z-10" aria-hidden>
		<div className="top-0 max-3xl:left-[calc(50%-36rem)] max-lg:left-8 gap-16 absolute left-[calc(50%-40rem)] flex flex-col items-center">
			{leftIcons.map(renderIcon)}
		</div>
		<div className="top-0 max-3xl:right-[calc(50%-36rem)] max-lg:right-8 gap-16 absolute right-[calc(50%-40rem)] flex flex-col items-center">
			{rightIcons.map(renderIcon)}
		</div>
	</div>
);

export default StartFloatingIcons;
