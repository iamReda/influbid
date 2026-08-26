"use client";

import { Button, Spinner } from "@repo/ui";
import { Card } from "@repo/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Pagination } from "@shared/components/Pagination";
import { UserAvatar } from "@shared/components/UserAvatar";
import { getCategoryUi } from "@shared/lib/category-ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, type LucideIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo } from "react";

const ITEMS_PER_PAGE = 25;
const ALL_CATEGORIES = "all";

function formatUsd(cents: number, formatter: ReturnType<typeof useFormatter>) {
	return formatter.number(cents / 100, {
		style: "currency",
		currency: "USD",
	});
}

export function AdminLeaderboardList() {
	const t = useTranslations("admin.leaderboard");
	const formatter = useFormatter();
	const [currentPage, setCurrentPage] = useQueryState("currentPage", parseAsInteger.withDefault(1));
	const [categorySlug, setCategorySlug] = useQueryState(
		"category",
		parseAsString.withDefault(ALL_CATEGORIES),
	);

	const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery(
		orpc.admin.categories.list.queryOptions(),
	);

	const categoryFilters = useMemo(() => {
		const activeCategories = (categoriesData?.categories ?? [])
			.filter((category) => category.active)
			.sort((a, b) => a.order - b.order);

		return [
			{ value: ALL_CATEGORIES, label: t("filters.all"), icon: LayoutGrid as LucideIcon },
			...activeCategories.map((category) => ({
				value: category.slug,
				label: category.name,
				icon: getCategoryUi(category.slug).icon,
			})),
		];
	}, [categoriesData?.categories, t]);

	useEffect(() => {
		if (currentPage > 1) {
			void setCurrentPage(1);
		}
	}, [categorySlug]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const { data, isLoading } = useQuery(
		orpc.creators.listLeaderboard.queryOptions({
			input: {
				categorySlug: categorySlug === ALL_CATEGORIES ? undefined : categorySlug,
				page: currentPage,
				pageSize: ITEMS_PER_PAGE,
			},
		}),
	);

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	return (
		<div className="space-y-4">
			<div className="gap-2 flex flex-wrap">
				{isCategoriesLoading ? (
					<Spinner className="size-5" />
				) : (
					categoryFilters.map((filter) => {
						const FilterIcon = filter.icon;
						const isActive = categorySlug === filter.value;

						return (
							<Button
								key={filter.value}
								size="sm"
								variant={isActive ? "primary" : "outline"}
								onClick={() => void setCategorySlug(filter.value)}
							>
								<FilterIcon className="size-3.5" />
								{filter.label}
							</Button>
						);
					})
				)}
			</div>

			<Card className="p-0 overflow-hidden">
				{isLoading ? (
					<div className="py-12 flex items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : items.length === 0 ? (
					<p className="p-8 text-sm text-center text-muted-foreground">{t("empty")}</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-16">{t("columns.rank")}</TableHead>
								<TableHead>{t("columns.creator")}</TableHead>
								<TableHead>{t("columns.category")}</TableHead>
								<TableHead className="text-right">{t("columns.totalBid")}</TableHead>
								<TableHead className="text-right">{t("columns.socialClicks")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">#{item.rank}</TableCell>
									<TableCell>
										<div className="gap-2 flex items-center">
											<UserAvatar
												name={item.publicName}
												avatarUrl={item.avatarUrl}
												className="size-8"
											/>
											<div className="min-w-0">
												<p className="font-medium truncate">{item.publicName}</p>
												{item.username ? (
													<p className="text-xs truncate text-muted-foreground">@{item.username}</p>
												) : null}
											</div>
										</div>
									</TableCell>
									<TableCell>{item.categoryName}</TableCell>
									<TableCell className="font-medium text-right">
										{formatUsd(item.totalBidCents, formatter)}
									</TableCell>
									<TableCell className="text-right">
										{formatter.number(item.socialClickCount)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			{total > ITEMS_PER_PAGE ? (
				<Pagination
					currentPage={currentPage}
					totalItems={total}
					itemsPerPage={ITEMS_PER_PAGE}
					onChangeCurrentPage={(page) => void setCurrentPage(page)}
				/>
			) : null}
		</div>
	);
}
