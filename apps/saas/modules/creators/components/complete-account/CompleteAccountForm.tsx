"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import Button from "@repo/ui/components/influencerbid/button";
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
import { Mars, Venus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
	const selectedLanguages = useWatch({
		control: demographicsForm.control,
		name: "languages",
	});
	const selectedGender = useWatch({
		control: demographicsForm.control,
		name: "gender",
	});
	const canContinue = (selectedLanguages?.length ?? 0) > 0 && Boolean(selectedGender);
	const password = useWatch({
		control: passwordForm.control,
		name: "password",
	});
	const confirmPassword = useWatch({
		control: passwordForm.control,
		name: "confirmPassword",
	});
	const canSubmit = Boolean(password?.trim()) && Boolean(confirmPassword?.trim());

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
			<div className="mb-8 text-center">
				<h1 className="text-h3 text-t-primary">
					{step === 1 ? t("steps.profile.title") : t("steps.password.title")}
				</h1>
				<p className="mt-2 text-body text-t-secondary">
					{step === 1 ? t("steps.profile.message") : t("steps.password.message")}
				</p>
			</div>

			<div className="mb-8">
				<div className="mb-2 flex items-center justify-between">
					<span className="text-small font-medium text-t-secondary">
						{t("step", { step, total: 2 })}
					</span>
					<span className="text-small font-medium text-t-blue">{step * 50}%</span>
				</div>
				<div className="bg-b-surface3 h-2 overflow-hidden rounded-full">
					<div
						className="bg-primary1 h-full rounded-full transition-[width] duration-300"
						style={{ width: `${step * 50}%` }}
					/>
				</div>
			</div>

			{step === 1 ? (
				<Form {...demographicsForm}>
					<form className="gap-7 flex flex-col" onSubmit={onDemographicsSubmit}>
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
									<FormLabel className="text-button font-medium text-t-primary">
										{t("gender.label")}
									</FormLabel>
									<FormControl>
										<div className="gap-2.5 max-sm:grid-cols-1 grid grid-cols-3">
											{CREATOR_GENDERS.map((gender) => (
												<label
													key={gender}
													className={`gap-2 h-12 px-4 text-button font-medium flex cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-all ${
														field.value === gender
															? "border-primary1 bg-primary1/10 text-t-blue"
															: "border-stroke2 bg-b-surface2 text-t-secondary hover:border-stroke-highlight hover:text-t-primary"
													}`}
												>
													<input
														type="radio"
														className="sr-only"
														name="gender"
														value={gender}
														checked={field.value === gender}
														onChange={() => field.onChange(gender)}
													/>
													{gender === "MAN" ? (
														<Mars className="size-4 shrink-0 stroke-2" aria-hidden />
													) : null}
													{gender === "WOMAN" ? (
														<Venus className="size-4 shrink-0 stroke-2" aria-hidden />
													) : null}
													{genderLabels[gender]}
												</label>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							className={`w-full ${canContinue ? "" : "cursor-not-allowed! opacity-40"}`}
							isSecondary
							type="submit"
							disabled={!canContinue}
						>
							{t("continue")}
						</Button>
					</form>
				</Form>
			) : (
				<Form {...passwordForm}>
					<form className="gap-7 flex flex-col" onSubmit={onPasswordSubmit}>
						<FormField
							control={passwordForm.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-button font-medium text-t-primary">
										{t("password.label")}
									</FormLabel>
									<FormControl>
										<PasswordInput
											value={field.value}
											onChange={field.onChange}
											autoComplete="new-password"
											inputClassName="form-control h-12! rounded-3xl! bg-b-surface2! px-6! text-input! text-t-primary! shadow-none!"
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
									<FormLabel className="text-button font-medium text-t-primary">
										{t("password.confirm")}
									</FormLabel>
									<FormControl>
										<PasswordInput
											value={field.value}
											onChange={field.onChange}
											autoComplete="new-password"
											inputClassName="form-control h-12! rounded-3xl! bg-b-surface2! px-6! text-input! text-t-primary! shadow-none!"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="gap-3 max-sm:flex-col-reverse flex">
							<Button
								className="flex-1"
								isStroke
								type="button"
								onClick={() => setStep(1)}
								disabled={completeMutation.isPending}
							>
								{t("back")}
							</Button>
							<Button
								className={`flex-1 ${canSubmit ? "" : "cursor-not-allowed! opacity-40"}`}
								isSecondary
								type="submit"
								disabled={!canSubmit || completeMutation.isPending}
							>
								{completeMutation.isPending ? "…" : t("submit")}
							</Button>
						</div>
					</form>
				</Form>
			)}
		</div>
	);
}
