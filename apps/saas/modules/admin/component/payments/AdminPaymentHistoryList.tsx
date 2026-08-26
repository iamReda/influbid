"use client";

import { Spinner } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
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
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";

const ITEMS_PER_PAGE = 25;

function statusBadge(status: "PENDING" | "PAID" | "FAILED") {
	if (status === "PAID") {
		return "success" as const;
	}
	if (status === "FAILED") {
		return "error" as const;
	}
	return "warning" as const;
}

export function AdminPaymentHistoryList() {
	const t = useTranslations();
	const formatter = useFormatter();
	const [currentPage, setCurrentPage] = useQueryState("currentPage", parseAsInteger.withDefault(1));
	const [searchTerm, setSearchTerm] = useQueryState("query", parseAsString.withDefault(""));
	const [status, setStatus] = useQueryState(
		"status",
		parseAsStringEnum(["ALL", "PAID", "FAILED", "PENDING"]).withDefault("ALL"),
	);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounceValue(searchTerm, 300, {
		leading: true,
		trailing: false,
	});

	useEffect(() => {
		setDebouncedSearchTerm(searchTerm);
	}, [searchTerm]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	useEffect(() => {
		if (currentPage > 1) {
			void setCurrentPage(1);
		}
	}, [debouncedSearchTerm, status]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const { data, isLoading } = useQuery(
		orpc.admin.paymentHistory.list.queryOptions({
			input: {
				limit: ITEMS_PER_PAGE,
				offset: (currentPage - 1) * ITEMS_PER_PAGE,
				query: debouncedSearchTerm || undefined,
				status: status === "ALL" ? undefined : status,
			},
		}),
	);

	const payments = data?.payments ?? [];
	const total = data?.total ?? 0;

	return (
		<div className="space-y-4">
			<div className="gap-3 flex flex-wrap items-center">
				<Input
					className="max-w-sm"
					placeholder={t("admin.paymentHistory.search")}
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
				/>
				<select
					className="h-10 px-3 text-sm rounded-md border bg-background"
					value={status}
					onChange={(event) =>
						setStatus(event.target.value as "ALL" | "PAID" | "FAILED" | "PENDING")
					}
				>
					<option value="ALL">{t("admin.paymentHistory.filters.all")}</option>
					<option value="PAID">{t("admin.paymentHistory.filters.success")}</option>
					<option value="FAILED">{t("admin.paymentHistory.filters.failed")}</option>
					<option value="PENDING">{t("admin.paymentHistory.filters.pending")}</option>
				</select>
			</div>

			<Card className="p-0 overflow-hidden">
				{isLoading ? (
					<div className="py-12 flex items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : payments.length === 0 ? (
					<p className="p-6 text-sm text-muted-foreground">{t("admin.paymentHistory.empty")}</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.paymentHistory.columns.influencer")}</TableHead>
								<TableHead>{t("admin.paymentHistory.columns.datetime")}</TableHead>
								<TableHead>{t("admin.paymentHistory.columns.type")}</TableHead>
								<TableHead>{t("admin.paymentHistory.columns.amount")}</TableHead>
								<TableHead>{t("admin.paymentHistory.columns.status")}</TableHead>
								<TableHead>{t("admin.paymentHistory.columns.source")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payments.map((payment) => {
								const displayStatus =
									payment.status === "PAID"
										? t("admin.paymentHistory.status.success")
										: payment.status === "FAILED"
											? t("admin.paymentHistory.status.failed")
											: t("admin.paymentHistory.status.pending");

								return (
									<TableRow key={payment.id}>
										<TableCell>
											<div className="gap-3 flex items-center">
												<UserAvatar
													name={payment.influencer.publicName}
													avatarUrl={payment.influencer.avatarUrl}
												/>
												<div className="min-w-0">
													<div className="font-medium truncate">
														{payment.influencer.publicName}
													</div>
													<div className="text-xs truncate text-muted-foreground">
														{payment.influencer.username
															? `@${payment.influencer.username}`
															: payment.influencer.email}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											{formatter.dateTime(new Date(payment.paidAt ?? payment.createdAt), {
												dateStyle: "medium",
												timeStyle: "short",
											})}
										</TableCell>
										<TableCell>
											{payment.type === "INITIAL"
												? t("admin.paymentHistory.type.initial")
												: t("admin.paymentHistory.type.increase")}
										</TableCell>
										<TableCell>
											{formatter.number(payment.amountCents / 100, {
												style: "currency",
												currency: payment.currency,
											})}
										</TableCell>
										<TableCell>
											<Badge status={statusBadge(payment.status)}>{displayStatus}</Badge>
										</TableCell>
										<TableCell className="text-xs text-muted-foreground uppercase">
											{payment.paymentSource}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</Card>

			{total > ITEMS_PER_PAGE && (
				<Pagination
					totalItems={total}
					itemsPerPage={ITEMS_PER_PAGE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}
		</div>
	);
}
