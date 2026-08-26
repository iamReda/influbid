"use client";

import { Button, Spinner } from "@repo/ui";
import { Card } from "@repo/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { UserAvatar } from "@shared/components/UserAvatar";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const RANGES = ["today", "7d", "30d", "all"] as const;
type DashboardRange = (typeof RANGES)[number];

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "var(--primary)",
	},
} satisfies ChartConfig;

function formatUsd(cents: number, formatter: ReturnType<typeof useFormatter>) {
	return formatter.number(cents / 100, {
		style: "currency",
		currency: "USD",
	});
}

export function AdminDashboard() {
	const t = useTranslations("admin.dashboard");
	const tPayment = useTranslations("admin.paymentHistory");
	const formatter = useFormatter();
	const [range, setRange] = useQueryState(
		"range",
		parseAsStringEnum([...RANGES]).withDefault("30d"),
	);

	const { data, isLoading } = useQuery(
		orpc.admin.dashboard.get.queryOptions({
			input: { range },
		}),
	);

	const topCategories = useMemo(() => {
		if (!data?.categoryPerformance) {
			return [];
		}

		return [...data.categoryPerformance]
			.sort((a, b) => b.totalPaidRevenueCents - a.totalPaidRevenueCents)
			.slice(0, 5);
	}, [data?.categoryPerformance]);

	const topCreators = useMemo(() => {
		if (!data?.topCreators) {
			return [];
		}

		return [...data.topCreators]
			.sort((a, b) => b.totalBidCents - a.totalBidCents)
			.slice(0, 10)
			.map((creator, index) => ({
				...creator,
				rank: index + 1,
			}));
	}, [data?.topCreators]);

	if (isLoading && !data) {
		return (
			<div className="py-12 flex items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	const overview = data?.overview;
	const revenueSeries =
		data?.revenueSeries.map((point) => ({
			date: point.date,
			revenue: point.revenueCents / 100,
		})) ?? [];

	const kpis = [
		{
			key: "totalCreators",
			label: t("kpis.totalCreators"),
			value: overview ? formatter.number(overview.totalCreators) : "—",
		},
		{
			key: "totalBidRevenue",
			label: t("kpis.totalBidRevenue"),
			value: overview ? formatUsd(overview.totalBidRevenueCents, formatter) : "—",
		},
		{
			key: "bidTransactions",
			label: t("kpis.bidTransactions"),
			value: overview ? formatter.number(overview.bidTransactions) : "—",
		},
		{
			key: "averageBid",
			label: t("kpis.averageBid"),
			value: overview ? formatUsd(overview.averageBidCents, formatter) : "—",
		},
		{
			key: "newCreators",
			label: t("kpis.newCreators"),
			value: overview ? formatter.number(overview.newCreators) : "—",
		},
	] as const;

	return (
		<div className="space-y-6">
			<div className="gap-2 flex flex-wrap">
				{RANGES.map((value) => (
					<Button
						key={value}
						size="sm"
						variant={range === value ? "primary" : "outline"}
						onClick={() => void setRange(value as DashboardRange)}
					>
						{t(`ranges.${value}`)}
					</Button>
				))}
			</div>

			<div className="gap-4 sm:grid-cols-2 xl:grid-cols-5 grid">
				{kpis.map((kpi) => (
					<Card key={kpi.key} className="p-4">
						<p className="text-sm text-muted-foreground">{kpi.label}</p>
						<p className="mt-2 text-2xl font-semibold tracking-tight">{kpi.value}</p>
					</Card>
				))}
			</div>

			<Card className="p-4">
				<div className="mb-4">
					<h2 className="font-semibold text-base">{t("revenue.title")}</h2>
					<p className="text-sm text-muted-foreground">{t("revenue.description")}</p>
				</div>
				{revenueSeries.length === 0 ? (
					<p className="py-8 text-sm text-center text-muted-foreground">{t("empty")}</p>
				) : (
					<ChartContainer config={chartConfig} className="h-64 w-full">
						<AreaChart
							accessibilityLayer
							data={revenueSeries}
							margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
									<stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(value: number) =>
									formatter.number(value, {
										style: "currency",
										currency: "USD",
										maximumFractionDigits: 0,
									})
								}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value) =>
											formatter.number(Number(value), {
												style: "currency",
												currency: "USD",
											})
										}
									/>
								}
							/>
							<Area
								dataKey="revenue"
								type="monotone"
								fill="url(#adminRevenue)"
								stroke="var(--color-revenue)"
								strokeWidth={2}
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</Card>

			<div className="gap-4 lg:grid-cols-2 grid">
				<Card className="p-4">
					<div className="mb-4">
						<h2 className="font-semibold text-base">{t("activity.title")}</h2>
						<p className="text-sm text-muted-foreground">{t("activity.description")}</p>
					</div>
					<div className="gap-3 sm:grid-cols-3 grid">
						<div>
							<p className="text-sm text-muted-foreground">{t("activity.profileViews")}</p>
							<p className="mt-1 text-xl font-semibold">
								{overview ? formatter.number(overview.profileViews) : "—"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("activity.socialClicks")}</p>
							<p className="mt-1 text-xl font-semibold">
								{overview ? formatter.number(overview.socialClicks) : "—"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("activity.ctr")}</p>
							<p className="mt-1 text-xl font-semibold">
								{overview
									? formatter.number(overview.socialCtrPercent / 100, {
											style: "percent",
											maximumFractionDigits: 1,
										})
									: "—"}
							</p>
						</div>
					</div>
				</Card>

				<Card className="p-0 overflow-hidden">
					<div className="p-4 pb-0">
						<h2 className="font-semibold text-base">{t("latestBids.title")}</h2>
						<p className="text-sm text-muted-foreground">{t("latestBids.description")}</p>
					</div>
					{(data?.latestBids.length ?? 0) === 0 ? (
						<p className="p-8 text-sm text-center text-muted-foreground">{t("empty")}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("latestBids.columns.creator")}</TableHead>
									<TableHead>{t("latestBids.columns.type")}</TableHead>
									<TableHead className="text-right">{t("latestBids.columns.amount")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.latestBids.map((bid) => (
									<TableRow key={bid.id}>
										<TableCell>
											<div className="gap-2 flex items-center">
												<UserAvatar
													name={bid.publicName}
													avatarUrl={bid.avatarUrl}
													className="size-8"
												/>
												<div className="min-w-0">
													<p className="font-medium truncate">{bid.publicName}</p>
													<p className="text-xs truncate text-muted-foreground">
														{bid.categoryName}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											{bid.type === "INITIAL"
												? tPayment("type.initial")
												: tPayment("type.increase")}
										</TableCell>
										<TableCell className="font-medium text-right">
											{formatUsd(bid.amountCents, formatter)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
					<div className="p-4 pt-2">
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							render={(props) => (
								<Link {...props} href="/admin/payment-history">
									{t("latestBids.showPaymentHistory")}
								</Link>
							)}
						/>
					</div>
				</Card>
			</div>

			<div className="gap-4 lg:grid-cols-2 grid">
				<Card className="p-0 overflow-hidden">
					<div className="p-4 pb-0">
						<h2 className="font-semibold text-base">{t("topCreators.title")}</h2>
						<p className="text-sm text-muted-foreground">{t("topCreators.description")}</p>
					</div>
					{(topCreators.length ?? 0) === 0 ? (
						<p className="p-8 text-sm text-center text-muted-foreground">{t("empty")}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("topCreators.columns.rank")}</TableHead>
									<TableHead>{t("topCreators.columns.creator")}</TableHead>
									<TableHead className="text-right">{t("topCreators.columns.totalBid")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{topCreators.map((creator) => (
									<TableRow key={creator.id}>
										<TableCell className="font-medium">#{creator.rank}</TableCell>
										<TableCell>
											<div className="gap-2 flex items-center">
												<UserAvatar
													name={creator.publicName}
													avatarUrl={creator.avatarUrl}
													className="size-8"
												/>
												<div className="min-w-0">
													<p className="font-medium truncate">{creator.publicName}</p>
													<p className="text-xs truncate text-muted-foreground">
														{creator.categoryName}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell className="font-medium text-right">
											{formatUsd(creator.totalBidCents, formatter)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</Card>

				<Card className="p-0 overflow-hidden">
					<div className="p-4 pb-0">
						<h2 className="font-semibold text-base">{t("categories.title")}</h2>
						<p className="text-sm text-muted-foreground">{t("categories.description")}</p>
					</div>
					{(topCategories.length ?? 0) === 0 ? (
						<p className="p-8 text-sm text-center text-muted-foreground">{t("empty")}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("categories.columns.category")}</TableHead>
									<TableHead className="text-right">{t("categories.columns.creators")}</TableHead>
									<TableHead className="text-right">{t("categories.columns.revenue")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{topCategories.map((category) => (
									<TableRow key={category.id}>
										<TableCell>
											<div className="gap-2 flex items-center">
												<span
													className="size-2.5 shrink-0 rounded-full"
													style={{
														backgroundColor: category.color ?? "var(--muted-foreground)",
													}}
												/>
												<span className="font-medium">{category.name}</span>
											</div>
										</TableCell>
										<TableCell className="text-right">
											{formatter.number(category.publishedCreators)}
										</TableCell>
										<TableCell className="font-medium text-right">
											{formatUsd(category.totalPaidRevenueCents, formatter)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
					<div className="p-4 pt-2">
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							render={(props) => (
								<Link {...props} href="/admin/categories">
									{t("categories.manageCategories")}
								</Link>
							)}
						/>
					</div>
				</Card>
			</div>
		</div>
	);
}
