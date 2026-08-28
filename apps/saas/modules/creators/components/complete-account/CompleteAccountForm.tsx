"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Progress } from "@repo/ui/components/progress";
import { toast } from "@repo/ui/components/toast";
import {
	CREATOR_GENDERS,
	creatorGenderSchema,
	isIsoLanguageCode,
	normalizeLanguageCodes,
	passwordSchema,
	type CreatorGenderValue,
	type IsoLanguageCode,
} from "@repo/utils";
import { PasswordInput } from "@shared/components/PasswordInput";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LanguageMultiSelect } from "./LanguageMultiSelect";

const demographicsSchema = z.object({
	gender: creatorGenderSchema,
	languages: z
		.array(z.string())
		.min(1, "Select at least one language")
		.max(10)
		.refine((codes) => codes.every(isIsoLanguageCode), {
			message: "Select valid languages",
		})
		.transform((codes) => normalizeLanguageCodes(codes) as IsoLanguageCode[]),
});

const passwordStepSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type DemographicsValues = z.input<typeof demographicsSchema>;
type DemographicsOutput = z.output<typeof demographicsSchema>;

type PasswordValues = z.infer<typeof passwordStepSchema>;

export function CompleteAccountForm() {
	const t = useTranslations("completeAccount");
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [demographics, setDemographics] = useState<DemographicsOutput | null>(null);

	const demographicsForm = useForm<DemographicsValues, unknown, DemographicsOutput>({
		resolver: zodResolver(demographicsSchema),
		defaultValues: {
			gender: undefined as unknown as CreatorGenderValue,
			languages: [],
		},
	});

	const passwordForm = useForm<PasswordValues>({
		resolver: zodResolver(passwordStepSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	const completeMutation = useMutation(orpc.creators.completeFirstAccess.mutationOptions());

	const genderLabels = useMemo(
		() =>
			({
				MAN: t("gender.man"),
				WOMAN: t("gender.woman"),
				PREFER_NOT_TO_SAY: t("gender.preferNotToSay"),
			}) as Record<CreatorGenderValue, string>,
		[t],
	);

	const onDemographicsSubmit = demographicsForm.handleSubmit((values) => {
		setDemographics(values);
		setStep(2);
	});

	const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
		if (!demographics) {
			setStep(1);
			return;
		}

		try {
			await completeMutation.mutateAsync({
				gender: demographics.gender,
				languages: demographics.languages,
				password: values.password,
			});
			await clearCache();
			toast.add({ title: t("notifications.success"), type: "success" });
			router.replace("/dashboard");
		} catch {
			toast.add({ title: t("notifications.error"), type: "error" });
		}
	});

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">{t("title")}</h1>
			<p className="mt-2 mb-6 text-foreground/60">{t("message")}</p>

			<div className="mb-6 gap-3 flex items-center">
				<Progress value={(step / 2) * 100} className="h-2" />
				<span className="text-xs shrink-0 text-foreground/60">{t("step", { step, total: 2 })}</span>
			</div>

			{step === 1 ? (
				<Form {...demographicsForm}>
					<form className="gap-6 flex flex-col" onSubmit={onDemographicsSubmit}>
						<FormField
							control={demographicsForm.control}
							name="languages"
							render={({ field }) => (
								<FormItem>
									<LanguageMultiSelect
										value={(field.value ?? []) as IsoLanguageCode[]}
										onChange={field.onChange}
										label={t("languages.label")}
										placeholder={t("languages.placeholder")}
										searchPlaceholder={t("languages.search")}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={demographicsForm.control}
							name="gender"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("gender.label")}</FormLabel>
									<FormControl>
										<div className="gap-2 flex flex-col">
											{CREATOR_GENDERS.map((gender) => (
												<label
													key={gender}
													className={`h-12 px-4 text-sm flex cursor-pointer items-center rounded-full border transition-colors ${
														field.value === gender
															? "border-primary bg-primary/5"
															: "border-input hover:bg-muted/40"
													}`}
												>
													<input
														type="radio"
														className="mr-3"
														name="gender"
														value={gender}
														checked={field.value === gender}
														onChange={() => field.onChange(gender)}
													/>
													{genderLabels[gender]}
												</label>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit">{t("continue")}</Button>
					</form>
				</Form>
			) : (
				<Form {...passwordForm}>
					<form className="gap-6 flex flex-col" onSubmit={onPasswordSubmit}>
						<p className="text-sm text-foreground/60">{t("password.description")}</p>

						<FormField
							control={passwordForm.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("password.label")}</FormLabel>
									<FormControl>
										<PasswordInput
											value={field.value}
											onChange={field.onChange}
											autoComplete="new-password"
											showPasswordCriteria
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={passwordForm.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("password.confirm")}</FormLabel>
									<FormControl>
										<PasswordInput
											value={field.value}
											onChange={field.onChange}
											autoComplete="new-password"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="gap-3 flex">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => setStep(1)}
								disabled={completeMutation.isPending}
							>
								{t("back")}
							</Button>
							<Button type="submit" className="flex-1" loading={completeMutation.isPending}>
								{t("submit")}
							</Button>
						</div>
					</form>
				</Form>
			)}
		</div>
	);
}
