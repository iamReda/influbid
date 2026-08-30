"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	email: z.email(),
});

export function ForgotPasswordForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm({
		resolver: zodResolver(formSchema),
		mode: "onBlur",
		reValidateMode: "onBlur",
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		setSubmitting(true);
		try {
			const redirectTo = new URL("/reset-password", window.location.origin).toString();

			const { error } = await authClient.requestPasswordReset({
				email,
				redirectTo,
			});

			if (error) {
				throw error;
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e ? (e.code as string) : undefined,
				),
			});
		} finally {
			setSubmitting(false);
		}
	});

	const rootError = form.formState.errors.root?.message;
	const emailError = form.formState.errors.email?.message;

	if (form.formState.isSubmitSuccessful && !rootError) {
		return (
			<div className="">
				<div className="mb-10 text-h3 text-center">Check your email</div>
				<p className="text-small text-t-secondary mb-6 leading-relaxed text-center">
					{t("auth.forgotPassword.hints.linkSent.message")}
				</p>
				<div className="text-hairline font-medium text-t-secondary text-center">
					Have your password?{" "}
					<Link
						href="/login"
						className="text-t-primary border-b border-t-primary transition-colors hover:border-transparent"
					>
						Sign in
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="">
			<h1 className="mb-10 text-h3 text-center">Reset password</h1>
			<p className="text-small text-t-secondary mb-6 leading-relaxed text-center">
				{t("auth.forgotPassword.message")}
			</p>

			{rootError && (
				<p className="text-small text-primary3 mb-4 text-center" role="alert">
					{rootError}
				</p>
			)}

			<form onSubmit={onSubmit}>
				<Field
					className="mb-6"
					classLabel="bg-b-surface1"
					label="Email"
					placeholder="Enter email"
					type="email"
					autoComplete="email"
					value={form.watch("email")}
					onChange={(e) => form.setValue("email", e.target.value, { shouldDirty: true })}
					onBlur={() => void form.trigger("email")}
					required
				/>
				{emailError && <p className="text-small text-primary3 -mt-4 mb-4">{emailError}</p>}

				<Button className="mb-4 w-full" isSecondary type="submit" disabled={submitting}>
					{submitting ? "Sending..." : "Reset password"}
				</Button>
			</form>

			<div className="text-hairline font-medium text-t-secondary text-center">
				Have your password?{" "}
				<Link
					href="/login"
					className="text-t-primary border-b border-t-primary transition-colors hover:border-transparent"
				>
					Sign in
				</Link>
			</div>
		</div>
	);
}
