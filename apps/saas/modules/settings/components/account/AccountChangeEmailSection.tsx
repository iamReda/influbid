"use client";

import { useSession } from "@auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import { toast } from "@repo/ui/components/toast";
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	email: z.email(),
});

export function AccountChangeEmailSection() {
	const t = useTranslations();
	const router = useRouter();
	const { user, reloadSession } = useSession();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: user?.email ?? "",
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (user?.email) {
			form.reset({ email: user.email });
		}
	}, [user?.email, form]);

	const onSubmit = form.handleSubmit(async ({ email }) => {
		const { error } = await authClient.changeEmail({
			newEmail: email,
		});

		if (error) {
			toast.add({
				title: t("settings.account.changeEmail.notifications.error"),
				type: "error",
			});
			return;
		}

		await reloadSession();
		toast.add({
			title: t("settings.account.changeEmail.notifications.success"),
			type: "success",
		});
		form.reset({ email });
		router.refresh();
	});

	return (
		<div>
			<div className="mb-3 text-h4">Email</div>
			<p className="text-body text-t-secondary mb-8 leading-snug">
				{t("settings.account.changeEmail.description")}
			</p>
			<form className="gap-5 flex flex-col" onSubmit={onSubmit}>
				<Field
					label="Email"
					type="email"
					isLarge
					required
					autoComplete="email"
					{...form.register("email")}
				/>
				<Button
					className="self-start"
					isSecondary
					type="submit"
					disabled={
						form.formState.isSubmitting ||
						!(form.formState.isValid && form.formState.dirtyFields.email)
					}
				>
					Change email
				</Button>
			</form>
		</div>
	);
}
