"use client";

import { authClient } from "@repo/auth/client";
import { Button, Spinner } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { UserAvatar } from "@shared/components/UserAvatar";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	BanIcon,
	ExternalLinkIcon,
	MoreVerticalIcon,
	ShieldCheckIcon,
	TrashIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useState } from "react";

import { BanUserDialog } from "./BanUserDialog";

const PERIODS = ["week", "month", "all"] as const;

function formatUsd(cents: number, currency: string, formatter: ReturnType<typeof useFormatter>) {
	return formatter.number(cents / 100, {
		style: "currency",
		currency,
	});
}

function statusBadge(status: "PENDING" | "PAID" | "FAILED") {
	if (status === "PAID") {
		return "success" as const;
	}
	if (status === "FAILED") {
		return "error" as const;
	}
	return "warning" as const;
}

function BackToUsersButton({ label }: { label: string }) {
	return (
		<Button
			variant="outline"
			size="sm"
			render={(props) => (
				<Link {...props} href="/admin/users?tab=influencers">
					<ArrowLeftIcon className="size-4" />
					{label}
				</Link>
			)}
		/>
	);
}

export function AdminInfluencerProfile({ userId }: { userId: string }) {
	const t = useTranslations("admin.influencerProfile");
	const tUsers = useTranslations("admin.users");
	const tPayment = useTranslations("admin.paymentHistory");
	const formatter = useFormatter();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();
	const [banDialogOpen, setBanDialogOpen] = useState(false);
	const [period, setPeriod] = useQueryState(
		"period",
		parseAsStringEnum([...PERIODS]).withDefault("all"),
	);

	const { data, isLoading, error, refetch } = useQuery(
		orpc.admin.users.getInfluencer.queryOptions({
			input: { userId, period },
		}),
	);

	const deleteUser = async () => {
		const removeUser = async () => {
			const { error: removeError } = await authClient.admin.removeUser({
				userId,
			});

			if (removeError) {
				throw removeError;
			}

			await queryClient.invalidateQueries({
				queryKey: orpc.admin.users.list.key(),
			});
			router.push("/admin/users?tab=influencers");
		};

		await toast
			.promise(removeUser(), {
				loading: { title: tUsers("deleteUser.deleting") },
				success: { title: tUsers("deleteUser.deleted") },
				error: { title: tUsers("deleteUser.notDeleted") },
			})
			.catch(() => undefined);
	};

	const unbanUser = async () => {
		const unban = async () => {
			const { error: unbanError } = await authClient.admin.unbanUser({
				userId,
			});

			if (unbanError) {
				throw unbanError;
			}

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: orpc.admin.users.list.key(),
				}),
				refetch(),
			]);
		};

		await toast
			.promise(unban(), {
				loading: { title: tUsers("ban.notifications.unbanning") },
				success: { title: tUsers("ban.notifications.unbanSuccess") },
				error: { title: tUsers("ban.notifications.unbanError") },
			})
			.catch(() => undefined);
	};

	if (isLoading && !data) {
		return (
			<div className="py-12 flex items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="space-y-4">
				<BackToUsersButton label={t("backToUsers")} />
				<Card className="p-6">
					<p className="text-sm text-muted-foreground">{t("notFound")}</p>
				</Card>
			</div>
		);
	}

	const { user, profile, analytics, payments } = data;
	const isBanned =
		user.banned === true && (!user.banExpires || new Date(user.banExpires).getTime() > Date.now());

	return (
		<div className="space-y-6">
			<div className="gap-3 flex items-center justify-between">
				<BackToUsersButton label={t("backToUsers")} />

				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button size="icon" variant="outline">
								<MoreVerticalIcon className="size-4" />
							</Button>
						}
					/>
					<DropdownMenuContent align="end">
						{isBanned ? (
							<DropdownMenuItem onClick={() => void unbanUser()}>
								<ShieldCheckIcon className="mr-2 size-4" />
								{tUsers("ban.actions.unban")}
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
								<BanIcon className="mr-2 size-4" />
								{tUsers("ban.actions.ban")}
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={() =>
								confirm({
									title: tUsers("confirmDelete.title"),
									message: tUsers("confirmDelete.message"),
									confirmLabel: tUsers("confirmDelete.confirm"),
									destructive: true,
									onConfirm: () => deleteUser(),
								})
							}
						>
							<span className="flex items-center text-destructive hover:text-destructive">
								<TrashIcon className="mr-2 size-4" />
								{tUsers("delete")}
							</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Card className="p-6">
				<div className="gap-4 flex flex-wrap items-start justify-between">
					<div className="gap-4 flex items-center">
						<UserAvatar
							name={profile.publicName}
							avatarUrl={profile.avatarUrl}
							className="size-16"
						/>
						<div className="min-w-0">
							<h2 className="text-xl font-semibold tracking-tight">{profile.publicName}</h2>
							<p className="text-sm text-muted-foreground">
								{user.username ? `@${user.username}` : user.email}
							</p>
							<div className="mt-2 gap-2 flex flex-wrap items-center">
								{isBanned ? (
									<Badge status="error">{t("status.banned")}</Badge>
								) : profile.isPublished ? (
									<Badge status="success">{t("status.active")}</Badge>
								) : (
									<Badge status="warning">{t("status.draft")}</Badge>
								)}
								<span className="text-sm text-muted-foreground">{profile.category.name}</span>
							</div>
						</div>
					</div>
					<div className="text-right">
						<p className="text-sm text-muted-foreground">{t("totalBid")}</p>
						<p className="text-2xl font-semibold">
							{formatUsd(profile.totalBidCents, profile.currency, formatter)}
						</p>
					</div>
				</div>

				<div className="mt-6 gap-4 sm:grid-cols-2 lg:grid-cols-4 grid">
					<div>
						<p className="text-sm text-muted-foreground">{t("fields.email")}</p>
						<p className="mt-1 text-sm font-medium break-all">{user.email}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">{t("fields.businessEmail")}</p>
						<p className="mt-1 text-sm font-medium break-all">{user.businessEmail ?? "—"}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">{t("fields.joined")}</p>
						<p className="mt-1 text-sm font-medium">
							{formatter.dateTime(new Date(profile.joinedAt), { dateStyle: "medium" })}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">{t("fields.ranks")}</p>
						<p className="mt-1 text-sm font-medium">
							#{profile.generalRank} · #{profile.categoryRank} {profile.category.name}
						</p>
					</div>
				</div>

				{profile.description ? (
					<div className="mt-6">
						<p className="text-sm text-muted-foreground">{t("fields.description")}</p>
						<p className="mt-1 text-sm whitespace-pre-wrap">{profile.description}</p>
					</div>
				) : null}

				{profile.socialProfiles.length > 0 ? (
					<div className="mt-6">
						<p className="mb-2 text-sm text-muted-foreground">{t("fields.socials")}</p>
						<div className="gap-2 flex flex-wrap">
							{profile.socialProfiles.map((social) => (
								<a
									key={social.id}
									href={social.url}
									target="_blank"
									rel="noreferrer"
									className="gap-1.5 h-8 px-3 text-sm inline-flex items-center rounded-full border hover:bg-muted"
								>
									{social.platform}
									<ExternalLinkIcon className="size-3.5" />
								</a>
							))}
						</div>
					</div>
				) : null}
			</Card>

			<Card className="p-6">
				<div className="mb-4 gap-3 flex flex-wrap items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">{t("stats.title")}</h3>
						<p className="text-sm text-muted-foreground">{t("stats.description")}</p>
					</div>
					<div className="gap-2 flex flex-wrap">
						{PERIODS.map((value) => (
							<Button
								key={value}
								size="sm"
								variant={period === value ? "primary" : "outline"}
								onClick={() => void setPeriod(value)}
							>
								{t(`stats.periods.${value}`)}
							</Button>
						))}
					</div>
				</div>

				<div className="gap-4 sm:grid-cols-3 grid">
					<div className="p-4 rounded-2xl border">
						<p className="text-sm text-muted-foreground">{t("stats.views")}</p>
						<p className="mt-1 text-2xl font-semibold">{formatter.number(analytics.views)}</p>
					</div>
					<div className="p-4 rounded-2xl border">
						<p className="text-sm text-muted-foreground">{t("stats.clicks")}</p>
						<p className="mt-1 text-2xl font-semibold">{formatter.number(analytics.clicks)}</p>
					</div>
					<div className="p-4 rounded-2xl border">
						<p className="text-sm text-muted-foreground">{t("stats.ctr")}</p>
						<p className="mt-1 text-2xl font-semibold">
							{formatter.number(analytics.ctrPercent / 100, {
								style: "percent",
								maximumFractionDigits: 0,
							})}
						</p>
					</div>
				</div>

				{analytics.socials.length > 0 ? (
					<div className="mt-6">
						<p className="mb-3 text-sm font-medium">{t("stats.byPlatform")}</p>
						<div className="gap-2 flex flex-col">
							{analytics.socials.map((social) => (
								<div
									key={social.platform}
									className="gap-3 px-3 py-2 flex items-center justify-between rounded-xl border"
								>
									<div className="gap-2 flex items-center">
										<span
											className="size-2.5 rounded-full"
											style={{ backgroundColor: social.color }}
										/>
										<span className="text-sm font-medium">{social.name}</span>
									</div>
									<div className="text-sm text-muted-foreground">
										{formatter.number(social.clicks)} ({social.percent}%)
									</div>
								</div>
							))}
						</div>
					</div>
				) : null}
			</Card>

			<Card className="p-0 overflow-hidden">
				<div className="p-6 pb-4">
					<h3 className="font-semibold text-base">{t("payments.title")}</h3>
					<p className="text-sm text-muted-foreground">{t("payments.description")}</p>
				</div>
				{payments.length === 0 ? (
					<p className="px-6 pb-6 text-sm text-muted-foreground">{t("payments.empty")}</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{tPayment("columns.datetime")}</TableHead>
								<TableHead>{tPayment("columns.type")}</TableHead>
								<TableHead>{tPayment("columns.amount")}</TableHead>
								<TableHead>{tPayment("columns.status")}</TableHead>
								<TableHead>{tPayment("columns.source")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payments.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell>
										{formatter.dateTime(new Date(payment.paidAt ?? payment.createdAt), {
											dateStyle: "medium",
											timeStyle: "short",
										})}
									</TableCell>
									<TableCell>
										{payment.type === "INITIAL"
											? tPayment("type.initial")
											: tPayment("type.increase")}
									</TableCell>
									<TableCell>
										{formatUsd(payment.amountCents, payment.currency, formatter)}
									</TableCell>
									<TableCell>
										<Badge status={statusBadge(payment.status)}>
											{payment.status === "PAID"
												? tPayment("status.success")
												: payment.status === "FAILED"
													? tPayment("status.failed")
													: tPayment("status.pending")}
										</Badge>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground uppercase">
										{payment.paymentSource}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			<BanUserDialog
				open={banDialogOpen}
				onOpenChange={(open) => {
					setBanDialogOpen(open);
					if (!open) {
						void Promise.all([
							queryClient.invalidateQueries({
								queryKey: orpc.admin.users.list.key(),
							}),
							refetch(),
						]);
					}
				}}
				user={{
					id: user.id,
					name: profile.publicName,
					email: user.email,
				}}
			/>
		</div>
	);
}
