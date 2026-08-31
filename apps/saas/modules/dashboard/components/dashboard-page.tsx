"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
import Select from "@repo/ui/components/influencerbid/select";
import Layout from "@shared/components/influencerbid/layout";
import SocialPlatformIcon, { type Platform } from "@shared/components/social-platform-icon";
import { getCategoryUi } from "@shared/lib/category-ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, Trophy, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Period = "week" | "month" | "all";

type ChartPoint = {
	label: string;
	views: number;
	clicks: number;
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

const EMPTY_CHART_BY_PERIOD: Record<Period, ChartPoint[]> = {
	week: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => ({
		label,
		views: 0,
		clicks: 0,
	})),
	month: Array.from({ length: 30 }, (_, index) => ({
		label: `${index + 1}`,
		views: 0,
		clicks: 0,
	})),
	all: Array.from({ length: 12 }, (_, index) => ({
		label: `W${index + 1}`,
		views: 0,
		clicks: 0,
	})),
};

const KNOWN_PLATFORMS = new Set<Platform>([
	"tiktok",
	"instagram",
	"facebook",
	"twitch",
	"youtube",
	"x",
	"linkedin",
	"snapchat",
	"pinterest",
	"threads",
	"kick",
	"discord",
	"reddit",
	"telegram",
]);

const toPlatform = (value: string): Platform =>
	KNOWN_PLATFORMS.has(value as Platform) ? (value as Platform) : "instagram";

const centsToDollars = (cents: number) => Math.round(cents / 100);

const formatNumber = (value: number) => value.toLocaleString("en-US");

const cardClass = "rounded-4xl bg-b-surface2 p-6 transition-shadow hover:shadow-hover max-md:p-5";

const dashboardMetaClass = "text-body text-t-secondary";
const dashboardMetaSmallClass = "text-small text-t-secondary";

const performanceChartConfig = {
	profileViews: {
		label: "Profile views",
		color: "var(--color-primary1)",
	},
	socialClicks: {
		label: "Social clicks",
		color: "var(--color-primary2)",
	},
} satisfies ChartConfig;

/** Top-3 badge colors — same as marketing leaderboard. */
const rankIconClass = (rank: number) => {
	if (rank === 1) {
		return "bg-[#f5c542] text-[#1b1b1b]";
	}
	if (rank === 2) {
		return "bg-[#c8ced8] text-[#1b1b1b]";
	}
	if (rank === 3) {
		return "bg-[#d89563] text-[#1b1b1b]";
	}
	return "bg-b-surface1 text-t-secondary";
};

type PerformanceChartProps = {
	data: ChartPoint[];
};

const PerformanceChart = ({ data }: PerformanceChartProps) => {
	const series = data.map((point) => ({
		date: point.label,
		profileViews: point.views,
		socialClicks: point.clicks,
	}));
	const hasActivity = data.some((point) => point.views > 0 || point.clicks > 0);

	if (!hasActivity) {
		return (
			<p className={`py-8 text-center ${dashboardMetaClass}`}>No traffic in this period yet</p>
		);
	}

	return (
		<ChartContainer config={performanceChartConfig} className="h-56 w-full">
			<AreaChart
				accessibilityLayer
				data={series}
				margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
			>
				<defs>
					<linearGradient id="creatorProfileViews" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--color-profileViews)" stopOpacity={0.3} />
						<stop offset="100%" stopColor="var(--color-profileViews)" stopOpacity={0} />
					</linearGradient>
					<linearGradient id="creatorSocialClicks" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--color-socialClicks)" stopOpacity={0.3} />
						<stop offset="100%" stopColor="var(--color-socialClicks)" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} />
				<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
				<YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
				<Area
					dataKey="profileViews"
					type="monotone"
					fill="url(#creatorProfileViews)"
					stroke="var(--color-profileViews)"
					strokeWidth={2}
				/>
				<Area
					dataKey="socialClicks"
					type="monotone"
					fill="url(#creatorSocialClicks)"
					stroke="var(--color-socialClicks)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
};

type KpiCardProps = {
	label: string;
	value: string;
	secondary?: string;
	icon: LucideIcon;
	iconClassName?: string;
	live?: boolean;
};

const KpiCard = ({ label, value, secondary, icon: Icon, iconClassName, live }: KpiCardProps) => (
	<article className={cardClass}>
		<div className="mb-4 gap-3 flex items-center justify-between">
			<div className="text-button text-t-primary">{label}</div>
			<span
				className={`size-9 flex shrink-0 items-center justify-center rounded-full ${
					iconClassName ?? "bg-b-surface1 text-t-secondary"
				}`}
			>
				<Icon className="size-4 stroke-[1.75px]" aria-hidden />
			</span>
		</div>
		<div className="text-h4 text-t-primary max-md:text-h5">{value}</div>
		{secondary && (
			<div
				className={
					live || secondary.startsWith("+") || secondary.startsWith("↑")
						? "mt-2 text-small text-t-blue"
						: `mt-2 ${dashboardMetaSmallClass}`
				}
			>
				{secondary}
			</div>
		)}
	</article>
);

const DashboardPage = () => {
	const [periodOption, setPeriodOption] = useState(PERIOD_SELECT_OPTIONS[2]);
	const period = PERIOD_BY_OPTION_ID[periodOption.id];

	const { data: creator, isPending: creatorPending } = useQuery(
		orpc.creators.getMyCreator.queryOptions(),
	);
	const { data: analytics } = useQuery({
		...orpc.creators.getMyAnalytics.queryOptions({
			input: { period },
		}),
		placeholderData: (previous) => previous,
	});

	const periodHint = useMemo(() => {
		if (period === "week") {
			return "Last 7 days";
		}

		if (period === "month") {
			return "Last 30 days";
		}

		return "Since you joined";
	}, [period]);

	const views = analytics?.views ?? 0;
	const clicks = analytics?.clicks ?? 0;
	const chart =
		analytics?.chart && analytics.chart.length > 0
			? analytics.chart
			: EMPTY_CHART_BY_PERIOD[period];
	const socials = analytics?.socials ?? [];

	const globalRank = creator?.generalRank ?? 0;
	const categoryRank = creator?.categoryRank ?? 0;
	const categoryName = creator?.categoryName ?? "—";
	const categorySlug = creator?.categorySlug ?? "";
	const CategoryIcon = getCategoryUi(categorySlug).icon;
	const currentBidDollars = creator ? centsToDollars(creator.totalBidCents) : 0;

	const subtitle = creatorPending
		? "\u00a0"
		: creator
			? "Track your visibility, profile performance, and ranking."
			: "Create a ranking bid to unlock analytics";

	return (
		<Layout isLoggedIn>
			<div className="py-20 max-[1179px]:py-16 max-lg:py-12 max-md:py-8 max-md:overflow-hidden">
				<div className="center max-w-280 max-3xl:max-w-260 max-2xl:max-w-240 max-lg:max-w-200 max-md:max-w-full min-w-0">
					<div className="mb-10 gap-6 max-md:mb-8 max-md:flex-col max-md:items-stretch flex items-end justify-between">
						<div className="min-w-0">
							<div className="mb-3 text-h1 max-md:mb-2">Dashboard</div>
							<p className="text-body-lg text-t-secondary">{subtitle}</p>
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
							value={creatorPending && !analytics ? "—" : formatNumber(views)}
							secondary="Views"
							icon={Eye}
						/>
						<KpiCard
							label="Social clicks"
							value={creatorPending && !analytics ? "—" : formatNumber(clicks)}
							secondary="Clicks"
							icon={MousePointerClick}
						/>
						<KpiCard
							label="Global rank"
							value={creatorPending ? "—" : `#${globalRank}`}
							secondary={creator ? `$${currentBidDollars}` : undefined}
							icon={Trophy}
							iconClassName={rankIconClass(globalRank)}
							live
						/>
						<KpiCard
							label="Category rank"
							value={creatorPending ? "—" : `#${categoryRank}`}
							secondary={creator ? categoryName : undefined}
							icon={CategoryIcon}
							iconClassName={rankIconClass(categoryRank)}
							live
						/>
					</div>

					<div className="mb-6 gap-6 max-xl:grid-cols-1 max-md:mb-5 max-md:gap-4 min-w-0 grid grid-cols-[1.6fr_1fr]">
						<article className={`${cardClass} min-w-0 overflow-hidden`}>
							<div className="mb-1 gap-4 flex items-start justify-between">
								<h2 className="text-h5 text-t-primary">Profile performance</h2>
								<span className={`${dashboardMetaSmallClass} shrink-0`}>{periodHint}</span>
							</div>
							<p className={`mb-6 max-md:mb-5 ${dashboardMetaClass}`}>
								Compare profile views and social clicks over time.
							</p>
							<PerformanceChart data={chart} />
						</article>

						<article className={`${cardClass} min-w-0`}>
							<h2 className="mb-1 text-h5 text-t-primary">Social performance</h2>
							<p className={`mb-6 max-md:mb-5 ${dashboardMetaClass}`}>
								See where your audience clicks most.
							</p>
							<div className="gap-5 flex flex-col">
								{socials.length === 0 ? (
									<p className={dashboardMetaClass}>
										{creatorPending && !analytics ? "\u00a0" : "No social clicks yet."}
									</p>
								) : (
									socials.map((item) => {
										const platform = toPlatform(item.platform);
										return (
											<div key={item.platform}>
												<div className="mb-2.5 gap-3 flex items-center justify-between">
													<div className="min-w-0 gap-3 flex items-center">
														<span
															className="size-9 text-white flex shrink-0 items-center justify-center rounded-full"
															style={{
																backgroundColor: item.color,
															}}
														>
															<SocialPlatformIcon platform={platform} className="size-4" />
														</span>
														<div className="min-w-0">
															<div className="text-button text-t-primary truncate">{item.name}</div>
															<div className={dashboardMetaSmallClass}>
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
										);
									})
								)}
							</div>
						</article>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default DashboardPage;
