"use client";

import { Spinner } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVerticalIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { useTranslations } from "next-intl";
import { type DragEvent, useMemo, useState } from "react";

import { IconPicker } from "./IconPicker";

type CategoryRow = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	icon: string | null;
	color: string | null;
	active: boolean;
	order: number;
	creatorsCount: number;
	pendingCreatorsCount: number;
};

type CategoryFormState = {
	name: string;
	slug: string;
	description: string;
	icon: string | null;
	color: string;
	active: boolean;
};

const emptyForm = (): CategoryFormState => ({
	name: "",
	slug: "",
	description: "",
	icon: "tag",
	color: "#6366f1",
	active: true,
});

function slugify(name: string) {
	return (
		name
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 64) || "category"
	);
}

export function CategoryList() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<CategoryRow | null>(null);
	const [form, setForm] = useState<CategoryFormState>(emptyForm);
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [orderedIds, setOrderedIds] = useState<string[] | null>(null);

	const listQueryKey = orpc.admin.categories.list.key();

	const { data, isLoading } = useQuery(orpc.admin.categories.list.queryOptions());

	const categories = useMemo(() => {
		const items = data?.categories ?? [];
		if (!orderedIds) {
			return items;
		}
		const byId = new Map(items.map((item) => [item.id, item]));
		return orderedIds.map((id) => byId.get(id)).filter(Boolean) as CategoryRow[];
	}, [data?.categories, orderedIds]);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: listQueryKey });
	};

	const createMutation = useMutation(
		orpc.admin.categories.create.mutationOptions({
			onSuccess: async () => {
				toast.add({ title: t("admin.categories.notifications.saved"), type: "success" });
				setDialogOpen(false);
				setOrderedIds(null);
				await invalidate();
			},
			onError: () => {
				toast.add({ title: t("admin.categories.notifications.saveError"), type: "error" });
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.admin.categories.update.mutationOptions({
			onSuccess: async () => {
				toast.add({ title: t("admin.categories.notifications.saved"), type: "success" });
				setDialogOpen(false);
				setOrderedIds(null);
				await invalidate();
			},
			onError: () => {
				toast.add({ title: t("admin.categories.notifications.saveError"), type: "error" });
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.categories.delete.mutationOptions({
			onSuccess: async () => {
				toast.add({ title: t("admin.categories.notifications.deleted"), type: "success" });
				setOrderedIds(null);
				await invalidate();
			},
			onError: () => {
				toast.add({ title: t("admin.categories.notifications.deleteError"), type: "error" });
			},
		}),
	);

	const reorderMutation = useMutation(
		orpc.admin.categories.reorder.mutationOptions({
			onSuccess: async () => {
				await invalidate();
			},
			onError: () => {
				setOrderedIds(null);
				toast.add({ title: t("admin.categories.notifications.reorderError"), type: "error" });
			},
		}),
	);

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm());
		setDialogOpen(true);
	};

	const openEdit = (category: CategoryRow) => {
		setEditing(category);
		setForm({
			name: category.name,
			slug: category.slug,
			description: category.description ?? "",
			icon: category.icon,
			color: category.color ?? "#6366f1",
			active: category.active,
		});
		setDialogOpen(true);
	};

	const saveCategory = () => {
		const payload = {
			name: form.name.trim(),
			slug: (form.slug.trim() || slugify(form.name)).toLowerCase(),
			description: form.description.trim() || null,
			icon: form.icon,
			color: form.color,
			active: form.active,
		};

		if (!payload.name) {
			toast.add({ title: t("admin.categories.validation.nameRequired"), type: "error" });
			return;
		}

		if (editing) {
			updateMutation.mutate({ id: editing.id, ...payload });
			return;
		}

		createMutation.mutate(payload);
	};

	const removeCategory = (category: CategoryRow) => {
		confirm({
			title: t("admin.categories.confirmDelete.title"),
			message: t("admin.categories.confirmDelete.message", { name: category.name }),
			confirmLabel: t("admin.categories.confirmDelete.confirm"),
			destructive: true,
			onConfirm: () => {
				deleteMutation.mutate({ id: category.id });
			},
		});
	};

	const onDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
		setDraggedId(id);
		event.dataTransfer.effectAllowed = "move";
	};

	const onDragOver = (event: DragEvent<HTMLDivElement>, overId: string) => {
		event.preventDefault();
		if (!draggedId || draggedId === overId) {
			return;
		}

		const currentIds = (orderedIds ?? categories.map((category) => category.id)).slice();
		const fromIndex = currentIds.indexOf(draggedId);
		const toIndex = currentIds.indexOf(overId);
		if (fromIndex < 0 || toIndex < 0) {
			return;
		}

		currentIds.splice(fromIndex, 1);
		currentIds.splice(toIndex, 0, draggedId);
		setOrderedIds(currentIds);
	};

	const onDragEnd = () => {
		if (!draggedId || !orderedIds) {
			setDraggedId(null);
			return;
		}

		const original = (data?.categories ?? []).map((category) => category.id);
		const changed = orderedIds.some((id, index) => id !== original[index]);
		setDraggedId(null);

		if (changed) {
			reorderMutation.mutate({ orderedIds });
		}
	};

	if (isLoading) {
		return (
			<div className="py-12 flex items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button onClick={openCreate}>
					<PlusIcon className="mr-2 size-4" />
					{t("admin.categories.add")}
				</Button>
			</div>

			<Card className="p-0 overflow-hidden">
				{categories.length === 0 ? (
					<p className="p-6 text-sm text-muted-foreground">{t("admin.categories.empty")}</p>
				) : (
					<div className="divide-y">
						{categories.map((category) => {
							const iconName = (category.icon as IconName | null) ?? "tag";
							return (
								<div
									key={category.id}
									draggable
									onDragStart={(event) => onDragStart(event, category.id)}
									onDragOver={(event) => onDragOver(event, category.id)}
									onDragEnd={onDragEnd}
									className={`gap-3 px-4 py-3 flex items-center ${
										draggedId === category.id ? "opacity-50" : ""
									}`}
								>
									<button
										type="button"
										className="cursor-grab text-muted-foreground active:cursor-grabbing"
										aria-label={t("admin.categories.dragHandle")}
									>
										<GripVerticalIcon className="size-4" />
									</button>

									<span
										className="size-9 flex shrink-0 items-center justify-center rounded-full border"
										style={{
											backgroundColor: category.color ? `${category.color}22` : undefined,
											borderColor: category.color ? `${category.color}55` : undefined,
											color: category.color ?? undefined,
										}}
									>
										<DynamicIcon name={iconName} className="size-4" />
									</span>

									<div className="min-w-0 flex-1">
										<div className="gap-2 flex flex-wrap items-center">
											<span className="font-medium truncate">{category.name}</span>
											{!category.active && (
												<Badge status="warning">{t("admin.categories.inactive")}</Badge>
											)}
										</div>
										<p className="text-xs truncate text-muted-foreground">
											/{category.slug} · {category.creatorsCount}{" "}
											{t("admin.categories.creators", { count: category.creatorsCount })}
										</p>
									</div>

									{category.color && (
										<span
											className="size-4 rounded-full border"
											style={{ backgroundColor: category.color }}
											title={category.color}
										/>
									)}

									<div className="gap-1 flex shrink-0">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => openEdit(category)}
											aria-label={t("admin.categories.edit")}
										>
											<PencilIcon className="size-4" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeCategory(category)}
											aria-label={t("admin.categories.delete")}
										>
											<TrashIcon className="size-4" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editing
								? t("admin.categories.form.updateTitle")
								: t("admin.categories.form.createTitle")}
						</DialogTitle>
					</DialogHeader>

					<div className="gap-4 grid">
						<div className="gap-2 grid">
							<Label htmlFor="category-name">{t("admin.categories.form.name")}</Label>
							<Input
								id="category-name"
								value={form.name}
								onChange={(event) => {
									const name = event.target.value;
									setForm((current) => ({
										...current,
										name,
										slug: editing ? current.slug : slugify(name),
									}));
								}}
							/>
						</div>

						<div className="gap-2 grid">
							<Label htmlFor="category-slug">{t("admin.categories.form.slug")}</Label>
							<Input
								id="category-slug"
								value={form.slug}
								onChange={(event) =>
									setForm((current) => ({ ...current, slug: event.target.value }))
								}
							/>
						</div>

						<div className="gap-2 grid">
							<Label htmlFor="category-description">{t("admin.categories.form.description")}</Label>
							<Input
								id="category-description"
								value={form.description}
								onChange={(event) =>
									setForm((current) => ({ ...current, description: event.target.value }))
								}
							/>
						</div>

						<div className="gap-2 grid">
							<Label>{t("admin.categories.form.icon")}</Label>
							<IconPicker
								value={form.icon}
								color={form.color}
								onChange={(icon) => setForm((current) => ({ ...current, icon }))}
							/>
						</div>

						<div className="gap-2 grid">
							<Label htmlFor="category-color">{t("admin.categories.form.color")}</Label>
							<div className="gap-2 flex items-center">
								<input
									id="category-color"
									type="color"
									className="size-10 rounded p-1 cursor-pointer border bg-transparent"
									value={form.color}
									onChange={(event) =>
										setForm((current) => ({ ...current, color: event.target.value }))
									}
								/>
								<Input
									value={form.color}
									onChange={(event) =>
										setForm((current) => ({ ...current, color: event.target.value }))
									}
								/>
							</div>
						</div>

						<div className="gap-2 flex items-center justify-between">
							<Label htmlFor="category-active">{t("admin.categories.form.active")}</Label>
							<Switch
								id="category-active"
								checked={form.active}
								onCheckedChange={(active) => setForm((current) => ({ ...current, active }))}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							{t("admin.categories.form.cancel")}
						</Button>
						<Button
							type="button"
							onClick={saveCategory}
							disabled={createMutation.isPending || updateMutation.isPending}
						>
							{t("admin.categories.form.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
