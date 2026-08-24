"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { sessionQueryKey } from "@auth/lib/api";
import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationInvitationAlert } from "@organizations/components/OrganizationInvitationAlert";
import { authClient } from "@repo/auth/client";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import { useRouter } from "@shared/hooks/router";
import { getSafeRedirectPath } from "@shared/lib/redirect";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";

import { useSession } from "../hooks/use-session";

const formSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export function LoginForm() {
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();
	const [submitting, setSubmitting] = useState(false);

	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		mode: "onBlur",
		reValidateMode: "onBlur",
		defaultValues: {
			email: email ?? "",
			password: "",
		},
	});

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: getSafeRedirectPath(redirectTo, config.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const onSubmit = form.handleSubmit(async (values) => {
		setSubmitting(true);
		try {
			const { data, error } = await authClient.signIn.email({
				email: values.email,
				password: values.password,
			});

			if (error) {
				throw error;
			}

			if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
				router.replace(withQuery("/verify", Object.fromEntries(searchParams.entries())));
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: sessionQueryKey,
			});

			router.replace(redirectPath);
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
	const passwordError = form.formState.errors.password?.message;

	return (
		<div className="">
			<div className="mb-10 text-h3 text-center">Sign in to Influbid</div>

			{invitationId && <OrganizationInvitationAlert className="mb-6" />}

			{rootError && (
				<p className="text-small text-primary3 mb-4 text-center" role="alert">
					{rootError}
				</p>
			)}

			<form onSubmit={onSubmit}>
				<Field
					className="mb-4"
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
				{emailError && <p className="text-small text-primary3 -mt-2 mb-4">{emailError}</p>}

				<Field
					className="mb-6"
					classLabel="bg-b-surface1"
					label="Password"
					placeholder="Enter password"
					type="password"
					autoComplete="current-password"
					value={form.watch("password")}
					onChange={(e) => form.setValue("password", e.target.value, { shouldDirty: true })}
					required
				/>
				{passwordError && <p className="text-small text-primary3 -mt-4 mb-4">{passwordError}</p>}

				<Button className="mb-4 w-full" isSecondary type="submit" disabled={submitting}>
					{submitting ? "Signing in..." : "Sign in"}
				</Button>
			</form>

			<div className="text-hairline font-medium text-t-secondary text-center">
				Forgot your password?{" "}
				<Link
					href="/forgot-password"
					className="text-t-primary border-b border-t-primary transition-colors hover:border-transparent"
				>
					Reset it
				</Link>
			</div>

			<div className="bg-stroke1 dark:bg-stroke2 my-6 h-px w-full" />

			<p className="text-small text-t-tertiary leading-relaxed text-center">
				Want to sign up? Place a one-time bid of $5 or more — forever your ticket to join a
				community of standout influencers.
			</p>
		</div>
	);
}
