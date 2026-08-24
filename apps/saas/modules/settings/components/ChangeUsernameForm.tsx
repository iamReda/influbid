"use client";

import { useSession } from "@auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/toast";
import { isValidUsernameFormat, slugifyUsernameBase } from "@repo/utils";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	username: z
		.string()
		.min(3)
		.max(36)
		.refine((value) => isValidUsernameFormat(value), {
			message: "Use lowercase letters, numbers, and hyphens only",
		}),
});

export function ChangeUsernameForm() {
	const { user, reloadSession } = useSession();
	const t = useTranslations();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: user?.username ?? slugifyUsernameBase(user?.name ?? "user"),
		},
	});

	const onSubmit = form.handleSubmit(async ({ username }) => {
		const normalized = username.toLowerCase();

		const { error } = await authClient.updateUser({
			username: normalized,
		});

		if (error) {
			toast.add({
				title: t("settings.account.changeUsername.notifications.error"),
				type: "error",
			});
			return;
		}

		await reloadSession();

		toast.add({
			title: t("settings.account.changeUsername.notifications.success"),
			type: "success",
		});

		form.reset({
			username: normalized,
		});
	});

	return (
		<SettingsItem
			title={t("settings.account.changeUsername.title")}
			description={t("settings.account.changeUsername.description")}
		>
			<form onSubmit={onSubmit}>
				<div className="gap-2 flex items-center">
					<span className="text-sm text-foreground/60">/</span>
					<Input type="text" autoComplete="username" {...form.register("username")} />
				</div>
				{form.formState.errors.username?.message && (
					<p className="mt-2 text-sm text-destructive">{form.formState.errors.username.message}</p>
				)}

				<div className="mt-4 flex justify-end">
					<Button
						type="submit"
						loading={form.formState.isSubmitting}
						disabled={!(form.formState.isValid && form.formState.dirtyFields.username)}
					>
						{t("settings.save")}
					</Button>
				</div>
			</form>
		</SettingsItem>
	);
}
