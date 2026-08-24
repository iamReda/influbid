"use client";

import Select from "@repo/ui/components/influencerbid/select";
import Layout from "@shared/components/influencerbid/layout";
import SocialPlatformIcon, { type Platform } from "@shared/components/social-platform-icon";
import { ArrowUpRight, Eye, MousePointerClick, Trophy, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

type Period = "week" | "month" | "all";

type ChartPoint = {
	label: string;
	views: number;
	clicks: number;
};

type SocialStat = {
	platform: Platform;
	name: string;
	clicks: number;
	percent: number;
	color: string;
};

const PERIOD_SELECT_OPTIONS = [
	{ id: 0, name: "This week" },
	{ id: 1, name: "This month" },
	{ id: 2, name: "All time" },
];

const PERIOD_BY_OPTION_ID: Record<number, Period> = {
	0: "week",
	1: "month",
	2: "all",
};

const LIVE_STATS = {
	bid: 142,
	globalRank: 18,
	globalDelta: 4,
	categoryRank: 3,
	category: "Fashion",
	categoryDelta: 1,
};

const TRAFFIC_BY_PERIOD: Record<
	Period,
	{
		views: number;
		viewsDelta: string;
		clicks: number;
		clickShare: string;
		chart: ChartPoint[];
		socials: SocialStat[];
	}
> = {
	week: {
		views: 2840,
		viewsDelta: "+12.1%",
		clicks: 968,
		clickShare: "34% of profile visitors",
		chart: [
			{ label: "Mon", views: 320, clicks: 98 },
			{ label: "Tue", views: 410, clicks: 132 },
			{ label: "Wed", views: 380, clicks: 118 },
			{ label: "Thu", views: 460, clicks: 156 },
			{ label: "Fri", views: 520, clicks: 178 },
			{ label: "Sat", views: 390, clicks: 142 },
			{ label: "Sun", views: 360, clicks: 144 },
		],
		socials: [
			{
				platform: "instagram",
				name: "Instagram",
				clicks: 492,
				percent: 51,
				color: "#E4405F",
			},
			{
				platform: "tiktok",
				name: "TikTok",
				clicks: 281,
				percent: 29,
				color: "#111111",
			},
			{
				platform: "facebook",
				name: "Facebook",
				clicks: 136,
				percent: 14,
				color: "#1877F2",
			},
			{
				platform: "twitch",
				name: "Twitch",
				clicks: 59,
				percent: 6,
				color: "#9146FF",
			},
		],
	},
	month: {
		views: 12613,
		viewsDelta: "+18.4%",
		clicks: 4284,
		clickShare: "34% of profile visitors",
		chart: [
			{ label: "W1", views: 2480, clicks: 820 },
			{ label: "W2", views: 2910, clicks: 980 },
			{ label: "W3", views: 3340, clicks: 1140 },
			{ label: "W4", views: 3883, clicks: 1344 },
		],
		socials: [
			{
				platform: "instagram",
				name: "Instagram",
				clicks: 2180,
				percent: 51,
				color: "#E4405F",
			},
			{
				platform: "tiktok",
				name: "TikTok",
				clicks: 1240,
				percent: 29,
				color: "#111111",
			},
			{
				platform: "facebook",
				name: "Facebook",
				clicks: 610,
				percent: 14,
				color: "#1877F2",
			},
			{
				platform: "twitch",
				name: "Twitch",
				clicks: 254,
				percent: 6,
				color: "#9146FF",
			},
		],
	},
	all: {
		views: 48210,
		viewsDelta: "+42.0%",
		clicks: 16402,
		clickShare: "34% of profile visitors",
		chart: [
			{ label: "Jan", views: 5200, clicks: 1680 },
			{ label: "Feb", views: 6100, clicks: 1980 },
			{ label: "Mar", views: 7400, clicks: 2460 },
			{ label: "Apr", views: 8200, clicks: 2780 },
			{ label: "May", views: 9800, clicks: 3320 },
			{ label: "Jun", views: 11510, clicks: 4182 },
		],
		socials: [
			{
				platform: "instagram",
				name: "Instagram",
				clicks: 8365,
				percent: 51,
				color: "#E4405F",
			},
			{
				platform: "tiktok",
				name: "TikTok",
				clicks: 4757,
				percent: 29,
				color: "#111111",
			},
			{
				platform: "facebook",
				name: "Facebook",
				clicks: 2296,
				percent: 14,
				color: "#1877F2",
			},
			{
				platform: "twitch",
				name: "Twitch",
				clicks: 984,
				percent: 6,
				color: "#9146FF",
			},
		],
	},
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

const cardClass = "rounded-4xl bg-b-surface2 p-6 transition-shadow hover:shadow-hover max-md:p-5";

const buildPolyline = (points: number[], width: number, height: number, padding = 8) => {
	const max = Math.max(...points, 1);
	const min = Math.min(...points, 0);
	const range = Math.max(max - min, 1);
	const usableWidth = width - padding * 2;
	const usableHeight = height - padding * 2;

	return points
		.map((value, index) => {
			const x =
				padding +
				(points.length === 1 ? usableWidth / 2 : (index / (points.length - 1)) * usableWidth);
			const y = padding + usableHeight - ((value - min) / range) * usableHeight;
			return `${x},${y}`;
		})
		.join(" ");
};

const PerformanceChart = ({ data }: { data: ChartPoint[] }) => {
	const width = 640;
	const height = 220;
	const viewsLine = buildPolyline(
		data.map((point) => point.views),
		width,
		height,
	);
	const clicksLine = buildPolyline(
		data.map((point) => point.clicks),
		width,
		height,
	);

	return (
		<div className="w-full">
			<div className="mb-4 gap-4 flex flex-wrap items-center">
				<div className="gap-2 text-small text-t-secondary flex items-center">
					<span className="size-2.5 bg-primary1 rounded-full" />
					Profile views
				</div>
				<div className="gap-2 text-small text-t-secondary flex items-center">
					<span className="size-2.5 bg-t-secondary rounded-full" />
					Social clicks
				</div>
			</div>
			<div className="relative w-full overflow-hidden">
				<svg
					className="h-55 max-md:h-48 w-full"
					viewBox={`0 0 ${width} ${height}`}
					role="img"
					aria-label="Profile views and social clicks over time"
				>
					{[0.25, 0.5, 0.75].map((ratio) => (
						<line
							key={ratio}
							x1="0"
							x2={width}
							y1={height * ratio}
							y2={height * ratio}
							stroke="var(--color-stroke-subtle)"
							strokeWidth="1.5"
						/>
					))}
					<polyline
						fill="none"
						stroke="var(--color-primary1)"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
						points={viewsLine}
					/>
					<polyline
						fill="none"
						stroke="var(--color-text-secondary)"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
						points={clicksLine}
					/>
				</svg>
				<div className="mt-3 px-1 text-small text-t-tertiary flex justify-between">
					{data.map((point) => (
						<span key={point.label}>{point.label}</span>
					))}
				</div>
			</div>
		</div>
	);
};

type KpiCardProps = {
	label: string;
	value: string;
	secondary?: string;
	icon: LucideIcon;
	live?: boolean;
};

const KpiCard = ({ label, value, secondary, icon: Icon, live }: KpiCardProps) => (
	<article className={cardClass}>
		<div className="mb-4 gap-3 flex items-start justify-between">
			<div className="text-small text-t-tertiary">{label}</div>
			<span className="size-9 bg-b-surface1 text-t-secondary flex shrink-0 items-center justify-center rounded-full">
				<Icon className="size-4 stroke-[1.75px]" aria-hidden />
			</span>
		</div>
		<div className="text-h4 text-t-primary max-md:text-h5">{value}</div>
		{secondary && (
			<div
				className={`mt-2 text-small ${
					live || secondary.startsWith("+") || secondary.startsWith("↑")
						? "text-t-blue"
						: "text-t-tertiary"
				}`}
			>
				{secondary}
			</div>
		)}
	</article>
);

const DashboardPage = () => {
	const [periodOption, setPeriodOption] = useState(PERIOD_SELECT_OPTIONS[2]);
	const period = PERIOD_BY_OPTION_ID[periodOption.id];
	const traffic = TRAFFIC_BY_PERIOD[period];

	const periodHint = useMemo(() => {
		if (period === "week") {
			return "Traffic for the last 7 days";
		}

		if (period === "month") {
			return "Traffic for the current month";
		}

		return "All-time traffic";
	}, [period]);

	return (
		<Layout isLoggedIn>
			<div className="py-20 max-[1179px]:py-16 max-lg:py-12 max-md:py-8 max-md:overflow-hidden">
				<div className="center max-w-280 max-3xl:max-w-260 max-2xl:max-w-240 max-lg:max-w-200 max-md:max-w-full">
					<div className="mb-10 gap-6 max-md:mb-8 max-md:flex-col max-md:items-stretch flex items-end justify-between">
						<div className="min-w-0">
							<div className="mb-3 text-h1 max-md:mb-2">Dashboard</div>
							<p className="text-body-lg text-t-secondary">
								Track your visibility, profile performance, and ranking.
							</p>
						</div>
						<Select
							className="min-w-40 max-md:w-full shrink-0"
							value={periodOption}
							onChange={setPeriodOption}
							options={PERIOD_SELECT_OPTIONS}
						/>
					</div>

					<div className="mb-6 gap-6 max-xl:grid-cols-2 max-md:mb-5 max-md:gap-4 max-sm:grid-cols-1 grid grid-cols-4">
						<KpiCard
							label="Profile views"
							value={formatNumber(traffic.views)}
							secondary={traffic.viewsDelta}
							icon={Eye}
						/>
						<KpiCard
							label="Social clicks"
							value={formatNumber(traffic.clicks)}
							secondary={traffic.clickShare}
							icon={MousePointerClick}
						/>
						<KpiCard
							label="Global rank"
							value={`#${LIVE_STATS.globalRank}`}
							secondary={`↑ ${LIVE_STATS.globalDelta} positions`}
							icon={Trophy}
							live
						/>
						<KpiCard
							label="Category rank"
							value={`#${LIVE_STATS.categoryRank}`}
							secondary={`${LIVE_STATS.category} · ↑ ${LIVE_STATS.categoryDelta} position`}
							icon={ArrowUpRight}
							live
						/>
					</div>

					<div className="mb-6 gap-6 max-xl:grid-cols-1 max-md:mb-5 max-md:gap-4 grid grid-cols-[1.6fr_1fr]">
						<article className={cardClass}>
							<div className="mb-1 gap-4 flex items-start justify-between">
								<h2 className="text-h5 text-t-primary">Profile performance</h2>
								<span className="text-small text-t-tertiary shrink-0">{periodHint}</span>
							</div>
							<p className="mb-6 text-small text-t-tertiary max-md:mb-5">
								Compare profile views and social clicks over time.
							</p>
							<PerformanceChart data={traffic.chart} />
						</article>

						<article className={cardClass}>
							<h2 className="mb-1 text-h5 text-t-primary">Social performance</h2>
							<p className="mb-6 text-small text-t-tertiary max-md:mb-5">
								See where your audience clicks most.
							</p>
							<div className="gap-5 flex flex-col">
								{traffic.socials.map((item) => (
									<div key={item.platform}>
										<div className="mb-2.5 gap-3 flex items-center justify-between">
											<div className="min-w-0 gap-3 flex items-center">
												<span
													className="size-9 text-white flex shrink-0 items-center justify-center rounded-full"
													style={{
														backgroundColor: item.color,
													}}
												>
													<SocialPlatformIcon platform={item.platform} className="size-4" />
												</span>
												<div className="min-w-0">
													<div className="text-button text-t-primary truncate">{item.name}</div>
													<div className="text-small text-t-tertiary">
														{formatNumber(item.clicks)} clicks
													</div>
												</div>
											</div>
											<div className="text-button text-t-primary shrink-0">{item.percent}%</div>
										</div>
										<div className="h-1.5 bg-b-surface1 overflow-hidden rounded-full">
											<div
												className="bg-primary1 h-full rounded-full"
												style={{
													width: `${item.percent}%`,
												}}
											/>
										</div>
									</div>
								))}
							</div>
						</article>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default DashboardPage;
