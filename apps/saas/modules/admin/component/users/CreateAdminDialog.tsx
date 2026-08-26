"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/toast";
import { passwordSchema } from "@repo/utils";
import { PasswordInput } from "@shared/components/PasswordInput";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CreateAdminDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateAdminDialog({ open, onOpenChange }: CreateAdminDialogProps) {
	const t = useTranslations("admin.users.createAdmin");
	const queryClient = useQueryClient();

	const formSchema = z.object({
		name: z.string().trim().min(1, t("validation.nameRequired")),
		email: z.email(t("validation.emailInvalid")),
		password: passwordSchema,
	});

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: "",
				email: "",
				password: "",
			});
		}
	}, [form, open]);

	const createAdminMutation = useMutation(
		orpc.admin.users.createAdmin.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: orpc.admin.users.list.key(),
				});
				toast.add({
					title: t("notifications.success"),
					type: "success",
				});
				onOpenChange(false);
			},
			onError: (error) => {
				const isConflict =
					(typeof error === "object" &&
						error !== null &&
						"code" in error &&
						error.code === "CONFLICT") ||
					error.message.includes("already exists");

				toast.add({
					title: isConflict ? t("notifications.emailExists") : t("notifications.error"),
					type: "error",
				});
			},
		}),
	);

	const onSubmit = form.handleSubmit((values) => {
		createAdminMutation.mutate(values);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("fields.name")}</FormLabel>
									<FormControl>
										<Input autoComplete="name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("fields.email")}</FormLabel>
									<FormControl>
										<Input type="email" autoComplete="email" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("fields.password")}</FormLabel>
									<FormControl>
										<PasswordInput
											autoComplete="new-password"
											showPasswordCriteria
											showGenerateButton
											showCopyButton
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
								{t("cancel")}
							</Button>
							<Button type="submit" variant="primary" loading={createAdminMutation.isPending}>
								{t("submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
