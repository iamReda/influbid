"use client";

import { useSession } from "@auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import { toast } from "@repo/ui/components/toast";
import { isValidUsernameFormat, slugifyUsernameBase } from "@repo/utils";
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
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

export function AccountChangeUsernameSection() {
	const t = useTranslations();
	const router = useRouter();
	const { user, reloadSession } = useSession();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: user?.username ?? slugifyUsernameBase(user?.name ?? "user"),
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (user) {
			form.reset({
				username: user.username ?? slugifyUsernameBase(user.name ?? "user"),
			});
		}
	}, [user, form]);

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
		form.reset({ username: normalized });
		router.refresh();
	});

	return (
		<div>
			<div className="mb-3 text-h4">Username</div>
			<p className="text-body text-t-secondary mb-8 leading-snug">
				{t("settings.account.changeUsername.description")}
			</p>
			<form className="gap-5 flex flex-col" onSubmit={onSubmit}>
				<Field
					label="Username"
					type="text"
					isLarge
					required
					autoComplete="username"
					{...form.register("username")}
				/>
				{form.formState.errors.username?.message && (
					<p className="text-small text-primary3 -mt-2">{form.formState.errors.username.message}</p>
				)}
				<Button
					className="self-start"
					isSecondary
					type="submit"
					disabled={
						form.formState.isSubmitting ||
						!(form.formState.isValid && form.formState.dirtyFields.username)
					}
				>
					Change username
				</Button>
			</form>
		</div>
	);
}
