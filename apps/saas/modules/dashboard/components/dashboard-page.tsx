"use client";

import Select from "@repo/ui/components/influencerbid/select";
import Layout from "@shared/components/influencerbid/layout";
import SocialPlatformIcon, { type Platform } from "@shared/components/social-platform-icon";
import { getCategoryUi } from "@shared/lib/category-ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, Trophy, type LucideIcon } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

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

type ChartCoords = { x: number; y: number; value: number };

const buildSeriesCoords = (
	points: number[],
	width: number,
	height: number,
	yMax: number,
	padding = 12,
): ChartCoords[] => {
	const usableWidth = width - padding * 2;
	const usableHeight = height - padding * 2;
	const max = Math.max(yMax, 1);

	return points.map((value, index) => {
		const x =
			padding +
			(points.length === 1 ? usableWidth / 2 : (index / (points.length - 1)) * usableWidth);
		const y = padding + usableHeight - (value / max) * usableHeight;
		return { x, y, value };
	});
};

const coordsToPolyline = (coords: ChartCoords[]) =>
	coords.map((point) => `${point.x},${point.y}`).join(" ");

const PerformanceChart = ({ data }: { data: ChartPoint[] }) => {
	const width = 640;
	const height = 220;
	const padding = 12;
	const chartAreaRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const yMax = Math.max(...data.flatMap((point) => [point.views, point.clicks]), 1);
	const viewsCoords = buildSeriesCoords(
		data.map((point) => point.views),
		width,
		height,
		yMax,
		padding,
	);
	const clicksCoords = buildSeriesCoords(
		data.map((point) => point.clicks),
		width,
		height,
		yMax,
		padding,
	);
	const labelStep = data.length > 14 ? Math.ceil(data.length / 7) : data.length > 8 ? 2 : 1;
	const hasActivity = data.some((point) => point.views > 0 || point.clicks > 0);
	const activePoint = activeIndex !== null ? data[activeIndex] : null;
	const activeViews = activeIndex !== null ? viewsCoords[activeIndex] : null;
	const activeClicks = activeIndex !== null ? clicksCoords[activeIndex] : null;

	const resolveActiveIndex = (clientX: number) => {
		const el = chartAreaRef.current;
		if (!el || data.length === 0) {
			return;
		}

		const rect = el.getBoundingClientRect();
		if (rect.width <= 0) {
			return;
		}

		const svgX = ((clientX - rect.left) / rect.width) * width;
		let nearest = 0;
		let bestDistance = Number.POSITIVE_INFINITY;

		for (let index = 0; index < viewsCoords.length; index += 1) {
			const distance = Math.abs(viewsCoords[index].x - svgX);
			if (distance < bestDistance) {
				bestDistance = distance;
				nearest = index;
			}
		}

		setActiveIndex(nearest);
	};

	const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		resolveActiveIndex(event.clientX);
	};

	const handlePointerLeave = () => {
		setActiveIndex(null);
	};

	const tooltipLeftPercent = activeViews && data.length > 0 ? (activeViews.x / width) * 100 : 50;
	const tooltipNearRight = tooltipLeftPercent > 72;

	return (
		<div className="min-w-0 w-full">
			<div className="mb-4 gap-4 flex flex-wrap items-center">
				<div className="gap-2 text-small text-t-secondary flex items-center">
					<span className="size-2.5 bg-primary1 rounded-full" />
					Profile views
				</div>
				<div className="gap-2 text-small text-t-secondary flex items-center">
					<span className="size-2.5 bg-primary2 rounded-full" />
					Social clicks
				</div>
			</div>
			<div className="min-w-0 relative w-full">
				<div
					ref={chartAreaRef}
					className="relative w-full cursor-crosshair touch-pan-y"
					onPointerMove={handlePointerMove}
					onPointerLeave={handlePointerLeave}
					onPointerDown={handlePointerMove}
				>
					<svg
						className="h-55 max-md:h-48 pointer-events-none w-full"
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
						{activeViews && (
							<line
								x1={activeViews.x}
								x2={activeViews.x}
								y1={padding}
								y2={height - padding}
								stroke="var(--color-stroke-subtle)"
								strokeWidth="1.5"
								strokeDasharray="4 4"
							/>
						)}
						{hasActivity ? (
							<>
								<polyline
									fill="none"
									stroke="var(--color-primary1)"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
									points={coordsToPolyline(viewsCoords)}
								/>
								<polyline
									fill="none"
									stroke="var(--color-primary2)"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
									points={coordsToPolyline(clicksCoords)}
								/>
								{viewsCoords.map((point, index) => (
									<circle
										key={`view-${index}`}
										cx={point.x}
										cy={point.y}
										r={activeIndex === index ? 5 : point.value > 0 ? 3.5 : 0}
										fill="var(--color-primary1)"
									/>
								))}
								{clicksCoords.map((point, index) => (
									<circle
										key={`click-${index}`}
										cx={point.x}
										cy={point.y}
										r={activeIndex === index ? 5 : point.value > 0 ? 3.5 : 0}
										fill="var(--color-primary2)"
									/>
								))}
							</>
						) : (
							<text
								x={width / 2}
								y={height / 2}
								textAnchor="middle"
								fill="var(--color-text-tertiary)"
								fontSize="14"
							>
								No traffic in this period yet
							</text>
						)}
					</svg>

					{activePoint && activeViews && activeClicks && (
						<div
							className={`top-2 min-w-40 bg-b-surface1 px-3.5 py-3 shadow-hover pointer-events-none absolute z-10 rounded-2xl ${
								tooltipNearRight ? "-translate-x-full" : "translate-x-0"
							}`}
							style={{ left: `${tooltipLeftPercent}%` }}
							role="status"
							aria-live="polite"
						>
							<div className="mb-2 text-button text-t-primary">{activePoint.label}</div>
							<div className="gap-1.5 flex flex-col">
								<div className="gap-2 text-small text-t-secondary flex items-center justify-between">
									<span className="gap-2 flex items-center">
										<span className="size-2 bg-primary1 rounded-full" />
										Profile views
									</span>
									<span className="text-button text-t-primary tabular-nums">
										{formatNumber(activePoint.views)}
									</span>
								</div>
								<div className="gap-2 text-small text-t-secondary flex items-center justify-between">
									<span className="gap-2 flex items-center">
										<span className="size-2 bg-primary2 rounded-full" />
										Social clicks
									</span>
									<span className="text-button text-t-primary tabular-nums">
										{formatNumber(activePoint.clicks)}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
				{/* Absolute labels so dense month series cannot widen the card */}
				<div className="mt-3 h-4 relative w-full overflow-hidden">
					{data.map((point, index) => {
						const show = index % labelStep === 0 || index === data.length - 1;
						if (!show) {
							return null;
						}
						const left = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
						return (
							<span
								key={`${point.label}-${index}`}
								className={`text-small top-0 absolute -translate-x-1/2 whitespace-nowrap ${
									activeIndex === index ? "text-t-primary" : "text-t-tertiary"
								}`}
								style={{ left: `${left}%` }}
							>
								{point.label}
							</span>
						);
					})}
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
	const ctrPercent = analytics?.ctrPercent ?? 0;
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
							secondary={views > 0 ? `${ctrPercent}% of profile visitors` : periodHint}
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
								<span className="text-small text-t-tertiary shrink-0">{periodHint}</span>
							</div>
							<p className="mb-6 text-small text-t-tertiary max-md:mb-5">
								Compare profile views and social clicks over time.
							</p>
							<PerformanceChart data={chart} />
						</article>

						<article className={`${cardClass} min-w-0`}>
							<h2 className="mb-1 text-h5 text-t-primary">Social performance</h2>
							<p className="mb-6 text-small text-t-tertiary max-md:mb-5">
								See where your audience clicks most.
							</p>
							<div className="gap-5 flex flex-col">
								{socials.length === 0 ? (
									<p className="text-small text-t-tertiary">
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
