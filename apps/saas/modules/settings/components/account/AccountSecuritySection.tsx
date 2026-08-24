"use client";

import { useSession } from "@auth/hooks/use-session";
import { userAccountQueryKey } from "@auth/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/auth/config";
import Button from "@repo/ui/components/influencerbid/button";
import { toast } from "@repo/ui/components/toast";
import { passwordSchema } from "@repo/utils";
import { InfluencerBidPasswordField } from "@settings/components/influencerbid/InfluencerBidPasswordField";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: passwordSchema,
});

type AccountSecuritySectionProps = {
	userHasPassword: boolean;
};

export function AccountSecuritySection({ userHasPassword }: AccountSecuritySectionProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user } = useSession();
	const [submittingSetPassword, setSubmittingSetPassword] = useState(false);

	const form = useForm({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
		},
		mode: "onChange",
	});

	const onSetPassword = async () => {
		if (!user) {
			return;
		}

		setSubmittingSetPassword(true);

		await authClient.requestPasswordReset(
			{
				email: user.email,
				redirectTo: `${window.location.origin}/reset-password`,
			},
			{
				onSuccess: () => {
					toast.add({
						title: t("settings.account.security.setPassword.notifications.success"),
						type: "success",
					});
				},
				onError: () => {
					toast.add({
						title: t("settings.account.security.setPassword.notifications.error"),
						type: "error",
					});
				},
				onResponse: () => {
					setSubmittingSetPassword(false);
				},
			},
		);
	};

	const onChangePassword = form.handleSubmit(async (values) => {
		const { error } = await authClient.changePassword({
			...values,
			revokeOtherSessions: true,
		});

		if (error) {
			toast.add({
				title: t("settings.account.security.changePassword.notifications.error"),
				type: "error",
			});
			return;
		}

		await queryClient.invalidateQueries({
			queryKey: ["active-sessions"],
		});
		await queryClient.invalidateQueries({
			queryKey: userAccountQueryKey,
		});

		toast.add({
			title: t("settings.account.security.changePassword.notifications.success"),
			type: "success",
		});
		form.reset();
		router.refresh();
	});

	if (!config.enablePasswordLogin) {
		return null;
	}

	return (
		<div>
			<div className="mb-3 text-h4">Password</div>
			<p className="text-body text-t-secondary mb-8 leading-snug">
				{userHasPassword
					? t("settings.account.security.changePassword.description")
					: t("settings.account.security.setPassword.description")}
			</p>
			{userHasPassword ? (
				<form className="gap-5 flex flex-col" onSubmit={onChangePassword}>
					<InfluencerBidPasswordField
						label={t("settings.account.security.changePassword.currentPassword")}
						value={form.watch("currentPassword")}
						onChange={(value) =>
							form.setValue("currentPassword", value, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}
						autoComplete="current-password"
						required
					/>
					<InfluencerBidPasswordField
						label={t("settings.account.security.changePassword.newPassword")}
						value={form.watch("newPassword")}
						onChange={(value) =>
							form.setValue("newPassword", value, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}
						autoComplete="new-password"
						showCriteria
						required
					/>
					<Button
						className="self-start"
						isSecondary
						type="submit"
						disabled={
							form.formState.isSubmitting ||
							!(form.formState.isValid && Object.keys(form.formState.dirtyFields).length > 0)
						}
					>
						{t("settings.account.security.changePassword.submit")}
					</Button>
				</form>
			) : (
				<div>
					<Button
						className="self-start"
						isSecondary
						type="button"
						disabled={submittingSetPassword}
						onClick={() => void onSetPassword()}
					>
						{t("settings.account.security.setPassword.submit")}
					</Button>
				</div>
			)}
		</div>
	);
}
