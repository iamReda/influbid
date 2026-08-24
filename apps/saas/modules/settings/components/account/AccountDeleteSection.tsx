"use client";

import { authClient } from "@repo/auth/client";
import Button from "@repo/ui/components/influencerbid/button";
import { toast } from "@repo/ui/components/toast";
import { InfluencerBidPasswordField } from "@settings/components/influencerbid/InfluencerBidPasswordField";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "next-intl";
import { useState } from "react";

type AccountDeleteSectionProps = {
	userHasPassword: boolean;
};

export function AccountDeleteSection({ userHasPassword }: AccountDeleteSectionProps) {
	const t = useTranslations();
	const router = useRouter();
	const { confirm } = useConfirmationAlert();
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const deleteAccount = async () => {
		setSubmitting(true);

		const { error } = await authClient.deleteUser(userHasPassword ? { password } : {});

		setSubmitting(false);

		if (error) {
			toast.add({
				title: t("settings.account.deleteAccount.notifications.error"),
				type: "error",
			});
			return;
		}

		toast.add({
			title: t("settings.account.deleteAccount.notifications.success"),
			type: "success",
		});
		router.replace("/");
	};

	const onDelete = () => {
		confirm({
			title: t("settings.account.deleteAccount.title"),
			message: t("settings.account.deleteAccount.confirmation"),
			destructive: true,
			onConfirm: deleteAccount,
		});
	};

	return (
		<div>
			<div className="mb-3 text-h4">{t("settings.account.deleteAccount.title")}</div>
			<p className="text-body text-t-secondary mb-8 leading-snug">
				{t("settings.account.deleteAccount.description")}
			</p>
			<div className="gap-5 flex flex-col">
				{userHasPassword && (
					<InfluencerBidPasswordField
						label={t("settings.account.security.changePassword.currentPassword")}
						value={password}
						onChange={setPassword}
						autoComplete="current-password"
						required
					/>
				)}
				<Button
					className="bg-primary3 text-t-light fill-t-light hover:bg-primary3/90 self-start border-transparent disabled:opacity-50"
					type="button"
					disabled={submitting || (userHasPassword && password.length === 0)}
					onClick={onDelete}
				>
					{t("settings.account.deleteAccount.submit")}
				</Button>
			</div>
		</div>
	);
}
