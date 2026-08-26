"use client";

import { useSession } from "@auth/hooks/use-session";
import { authClient } from "@repo/auth/client";
import type { UserType } from "@repo/database";
import { Spinner } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { Pagination } from "@shared/components/Pagination";
import { UserAvatar } from "@shared/components/UserAvatar";
import { orpc } from "@shared/lib/orpc-query-utils";
import { manualPaginationTableFeatures } from "@shared/lib/table-features";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { flexRender, useTable } from "@tanstack/react-table";
import {
	BanIcon,
	EyeIcon,
	MoreVerticalIcon,
	PlusIcon,
	Repeat1Icon,
	ShieldCheckIcon,
	ShieldXIcon,
	TrashIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

import { EmailVerified } from "../EmailVerified";
import { BanUserDialog } from "./BanUserDialog";
import { CreateAdminDialog } from "./CreateAdminDialog";

const ITEMS_PER_PAGE = 10;
const BAN_STATUS_REFRESH_INTERVAL = 30_000;

type AdminUser = UserType & {
	creatorProfile?: {
		joinedAt: Date | string;
		isPublished: boolean;
		category: {
			name: string;
			slug: string;
		};
	} | null;
};

type UsersAudience = "influencers" | "admins";
type InfluencerStatusFilter = "ALL" | "PUBLISHED" | "DRAFT" | "BANNED";

function isUserActivelyBanned(user: AdminUser, currentTime: number) {
	if (user.banned !== true) {
		return false;
	}

	if (!user.banExpires) {
		return true;
	}

	return new Date(user.banExpires).getTime() > currentTime;
}

function InfluencerStatusBadge({ user, currentTime }: { user: AdminUser; currentTime: number }) {
	const t = useTranslations("admin.users");

	if (isUserActivelyBanned(user, currentTime)) {
		return <Badge status="error">{t("status.banned")}</Badge>;
	}

	if (user.creatorProfile?.isPublished) {
		return <Badge status="success">{t("status.published")}</Badge>;
	}

	return <Badge status="warning">{t("status.draft")}</Badge>;
}

export function UserList() {
	const t = useTranslations();
	const formatter = useFormatter();
	const router = useRouter();
	const { user: currentUser } = useSession();
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();
	const [userToBan, setUserToBan] = useState<AdminUser | null>(null);
	const [createAdminOpen, setCreateAdminOpen] = useState(false);
	const [banStatusTime, setBanStatusTime] = useState(Date.now);
	const [audience, setAudience] = useQueryState(
		"tab",
		parseAsStringEnum<UsersAudience>(["influencers", "admins"]).withDefault("influencers"),
	);
	const [currentPage, setCurrentPage] = useQueryState("currentPage", parseAsInteger.withDefault(1));
	const [searchTerm, setSearchTerm] = useQueryState("query", parseAsString.withDefault(""));
	const [categorySlug, setCategorySlug] = useQueryState(
		"category",
		parseAsString.withDefault("all"),
	);
	const [status, setStatus] = useQueryState(
		"status",
		parseAsStringEnum<InfluencerStatusFilter>(["ALL", "PUBLISHED", "DRAFT", "BANNED"]).withDefault(
			"ALL",
		),
	);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounceValue(searchTerm, 300, {
		leading: true,
		trailing: false,
	});

	useEffect(() => {
		setDebouncedSearchTerm(searchTerm);
	}, [searchTerm]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	useEffect(() => {
		const refreshInterval = window.setInterval(() => {
			setBanStatusTime(Date.now());
		}, BAN_STATUS_REFRESH_INTERVAL);

		return () => window.clearInterval(refreshInterval);
	}, []);

	useEffect(() => {
		if (currentPage > 1) {
			void setCurrentPage(1);
		}
	}, [debouncedSearchTerm, audience, categorySlug, status]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const { data: categoriesData } = useQuery({
		...orpc.admin.categories.list.queryOptions(),
		enabled: audience === "influencers",
	});

	const { data, isLoading } = useQuery(
		orpc.admin.users.list.queryOptions({
			input: {
				limit: ITEMS_PER_PAGE,
				offset: (currentPage - 1) * ITEMS_PER_PAGE,
				query: debouncedSearchTerm || undefined,
				audience,
				categorySlug:
					audience === "influencers" && categorySlug !== "all" ? categorySlug : undefined,
				status: audience === "influencers" ? status : "ALL",
			},
		}),
	);

	const deleteUser = async (id: string) => {
		const removeUser = async () => {
			const { error } = await authClient.admin.removeUser({
				userId: id,
			});

			if (error) {
				throw error;
			}

			await queryClient.invalidateQueries({
				queryKey: orpc.admin.users.list.key(),
			});
		};

		await toast
			.promise(removeUser(), {
				loading: { title: t("admin.users.deleteUser.deleting") },
				success: { title: t("admin.users.deleteUser.deleted") },
				error: { title: t("admin.users.deleteUser.notDeleted") },
			})
			.catch(() => undefined);
	};

	const resendVerificationMail = async (email: string) => {
		const sendVerificationEmail = async () => {
			const { error } = await authClient.sendVerificationEmail({
				email,
			});

			if (error) {
				throw error;
			}
		};

		await toast
			.promise(sendVerificationEmail(), {
				loading: { title: t("admin.users.resendVerificationMail.submitting") },
				success: { title: t("admin.users.resendVerificationMail.success") },
				error: { title: t("admin.users.resendVerificationMail.error") },
			})
			.catch(() => undefined);
	};

	const removeAdminRole = async (id: string) => {
		await authClient.admin.setRole({
			userId: id,
			role: "user",
		});

		await queryClient.invalidateQueries({
			queryKey: orpc.admin.users.list.key(),
		});
	};

	const unbanUser = async (userId: string) => {
		const unban = async () => {
			const { error } = await authClient.admin.unbanUser({
				userId,
			});

			if (error) {
				throw error;
			}

			await queryClient.invalidateQueries({
				queryKey: orpc.admin.users.list.key(),
			});
		};

		await toast
			.promise(unban(), {
				loading: { title: t("admin.users.ban.notifications.unbanning") },
				success: { title: t("admin.users.ban.notifications.unbanSuccess") },
				error: { title: t("admin.users.ban.notifications.unbanError") },
			})
			.catch(() => undefined);
	};

	const renderActions = (user: AdminUser) => (
		<div className="gap-2 flex flex-row justify-end">
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button size="icon" variant="ghost" onClick={(event) => event.stopPropagation()}>
							<MoreVerticalIcon className="size-4" />
						</Button>
					}
				/>
				<DropdownMenuContent>
					{(audience === "influencers" || user.creatorProfile) && (
						<DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
							<EyeIcon className="mr-2 size-4" />
							{t("admin.users.viewProfile")}
						</DropdownMenuItem>
					)}

					{!user.emailVerified && (
						<DropdownMenuItem onClick={() => resendVerificationMail(user.email)}>
							<Repeat1Icon className="mr-2 size-4" />
							{t("admin.users.resendVerificationMail.title")}
						</DropdownMenuItem>
					)}

					{isUserActivelyBanned(user, banStatusTime) ? (
						<DropdownMenuItem onClick={() => unbanUser(user.id)}>
							<ShieldCheckIcon className="mr-2 size-4" />
							{t("admin.users.ban.actions.unban")}
						</DropdownMenuItem>
					) : (
						currentUser?.id !== user.id && (
							<DropdownMenuItem onClick={() => setUserToBan(user)}>
								<BanIcon className="mr-2 size-4" />
								{t("admin.users.ban.actions.ban")}
							</DropdownMenuItem>
						)
					)}

					{user.role === "admin" && currentUser?.id !== user.id ? (
						<DropdownMenuItem onClick={() => removeAdminRole(user.id)}>
							<ShieldXIcon className="mr-2 size-4" />
							{t("admin.users.removeAdminRole")}
						</DropdownMenuItem>
					) : null}

					<DropdownMenuItem
						onClick={() =>
							confirm({
								title: t("admin.users.confirmDelete.title"),
								message: t("admin.users.confirmDelete.message"),
								confirmLabel: t("admin.users.confirmDelete.confirm"),
								destructive: true,
								onConfirm: () => deleteUser(user.id),
							})
						}
					>
						<span className="flex items-center text-destructive hover:text-destructive">
							<TrashIcon className="mr-2 size-4" />
							{t("admin.users.delete")}
						</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);

	const renderUserCell = (user: AdminUser, showAdminLabel = false) => (
		<div className="gap-2 flex items-center">
			<UserAvatar name={user.name ?? user.email} avatarUrl={user.image} />
			<div className="leading-tight">
				<strong className="block">{user.name ?? user.email}</strong>
				<small className="gap-1 flex items-center text-foreground/60">
					<span className="block">{!!user.name && user.email}</span>
					<EmailVerified verified={user.emailVerified} />
					{showAdminLabel ? (
						<strong className="block">{user.role === "admin" ? "Admin" : ""}</strong>
					) : null}
				</small>
			</div>
		</div>
	);

	const adminColumns: ColumnDef<typeof manualPaginationTableFeatures, AdminUser>[] = useMemo(
		() => [
			{
				accessorKey: "user",
				header: "",
				accessorFn: (row) => row.name,
				cell: ({ row }) => renderUserCell(row.original, true),
			},
			{
				accessorKey: "actions",
				header: "",
				cell: ({ row }) => renderActions(row.original),
			},
		],
		[banStatusTime, currentUser?.id, audience, router], // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps
	);

	const influencerColumns: ColumnDef<typeof manualPaginationTableFeatures, AdminUser>[] = useMemo(
		() => [
			{
				accessorKey: "user",
				header: t("admin.users.columns.user"),
				accessorFn: (row) => row.name,
				cell: ({ row }) => renderUserCell(row.original),
			},
			{
				accessorKey: "category",
				header: t("admin.users.columns.category"),
				cell: ({ row }) => row.original.creatorProfile?.category.name ?? "—",
			},
			{
				accessorKey: "joined",
				header: t("admin.users.columns.joined"),
				cell: ({ row }) => {
					const joinedAt = row.original.creatorProfile?.joinedAt;
					if (!joinedAt) {
						return "—";
					}
					return formatter.dateTime(new Date(joinedAt), {
						dateStyle: "medium",
					});
				},
			},
			{
				accessorKey: "status",
				header: t("admin.users.columns.status"),
				cell: ({ row }) => (
					<InfluencerStatusBadge user={row.original} currentTime={banStatusTime} />
				),
			},
			{
				accessorKey: "actions",
				header: "",
				cell: ({ row }) => renderActions(row.original),
			},
		],
		[banStatusTime, currentUser?.id, formatter, t, audience, router], // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps
	);

	const users = useMemo(() => (data?.users ?? []) as AdminUser[], [data?.users]);
	const columns = audience === "influencers" ? influencerColumns : adminColumns;

	const table = useTable({
		features: manualPaginationTableFeatures,
		data: users,
		columns,
		manualPagination: true,
	});

	const categoryOptions = useMemo(
		() =>
			(categoriesData?.categories ?? [])
				.filter((category) => category.active)
				.sort((a, b) => a.order - b.order),
		[categoriesData?.categories],
	);

	const emptyState = (
		<TableRow>
			<TableCell colSpan={columns.length} className="h-24 text-center">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<Spinner className="mr-2 size-4 text-primary" />
						{t("admin.users.loading")}
					</div>
				) : (
					<p>{t("admin.users.empty")}</p>
				)}
			</TableCell>
		</TableRow>
	);

	return (
		<>
			<Tabs value={audience} onValueChange={(value) => void setAudience(value as UsersAudience)}>
				<TabsList className="mb-4">
					<TabsTrigger value="influencers">{t("admin.users.tabs.influencers")}</TabsTrigger>
					<TabsTrigger value="admins">{t("admin.users.tabs.admins")}</TabsTrigger>
				</TabsList>

				<TabsContent value="influencers">
					<Card className="p-6">
						<div className="mb-4 gap-3 flex flex-wrap items-center">
							<Input
								type="search"
								placeholder={t("admin.users.search")}
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								className="max-w-sm"
							/>
							<select
								className="h-10 px-3 text-sm rounded-md border bg-background"
								value={categorySlug}
								onChange={(event) => void setCategorySlug(event.target.value)}
							>
								<option value="all">{t("admin.users.filters.allCategories")}</option>
								{categoryOptions.map((category) => (
									<option key={category.id} value={category.slug}>
										{category.name}
									</option>
								))}
							</select>
							<select
								className="h-10 px-3 text-sm rounded-md border bg-background"
								value={status}
								onChange={(event) => void setStatus(event.target.value as InfluencerStatusFilter)}
							>
								<option value="ALL">{t("admin.users.filters.allStatuses")}</option>
								<option value="PUBLISHED">{t("admin.users.filters.published")}</option>
								<option value="DRAFT">{t("admin.users.filters.draft")}</option>
								<option value="BANNED">{t("admin.users.filters.banned")}</option>
							</select>
						</div>

						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										{table.getHeaderGroups()[0]?.headers.map((header) => (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{table.getRowModel().rows?.length
										? table.getRowModel().rows.map((row) => (
												<TableRow
													key={row.id}
													className="group cursor-pointer"
													onClick={() => router.push(`/admin/users/${row.original.id}`)}
												>
													{row.getVisibleCells().map((cell) => (
														<TableCell
															key={cell.id}
															className="py-2 group-first:rounded-t-md group-last:rounded-b-md"
														>
															{flexRender(cell.column.columnDef.cell, cell.getContext())}
														</TableCell>
													))}
												</TableRow>
											))
										: emptyState}
								</TableBody>
							</Table>
						</div>

						{data?.total && data.total > ITEMS_PER_PAGE ? (
							<Pagination
								className="mt-4"
								totalItems={data.total}
								itemsPerPage={ITEMS_PER_PAGE}
								currentPage={currentPage}
								onChangeCurrentPage={setCurrentPage}
							/>
						) : null}
					</Card>
				</TabsContent>

				<TabsContent value="admins">
					<Card className="p-6">
						<div className="mb-4 gap-3 flex flex-wrap items-center justify-between">
							<Input
								type="search"
								placeholder={t("admin.users.search")}
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								className="max-w-sm"
							/>
							<Button variant="primary" onClick={() => setCreateAdminOpen(true)}>
								<PlusIcon className="size-4" />
								{t("admin.users.createAdmin.trigger")}
							</Button>
						</div>

						<div className="rounded-md border">
							<Table>
								<TableBody>
									{table.getRowModel().rows?.length
										? table.getRowModel().rows.map((row) => (
												<TableRow key={row.id} className="group">
													{row.getVisibleCells().map((cell) => (
														<TableCell
															key={cell.id}
															className="py-2 group-first:rounded-t-md group-last:rounded-b-md"
														>
															{flexRender(cell.column.columnDef.cell, cell.getContext())}
														</TableCell>
													))}
												</TableRow>
											))
										: emptyState}
								</TableBody>
							</Table>
						</div>

						{data?.total && data.total > ITEMS_PER_PAGE ? (
							<Pagination
								className="mt-4"
								totalItems={data.total}
								itemsPerPage={ITEMS_PER_PAGE}
								currentPage={currentPage}
								onChangeCurrentPage={setCurrentPage}
							/>
						) : null}
					</Card>
				</TabsContent>
			</Tabs>

			<BanUserDialog
				open={userToBan !== null}
				onOpenChange={(open) => {
					if (!open) {
						setUserToBan(null);
					}
				}}
				user={userToBan}
			/>

			<CreateAdminDialog open={createAdminOpen} onOpenChange={setCreateAdminOpen} />
		</>
	);
}
