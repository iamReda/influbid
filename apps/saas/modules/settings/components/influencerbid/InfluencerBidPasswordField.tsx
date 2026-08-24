"use client";

import Field from "@repo/ui/components/influencerbid/field";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const passwordCriteria = [
	{
		labelKey: "minLength",
		check: (password: string) => password.length >= 8,
	},
	{
		labelKey: "upperAndLowercase",
		check: (password: string) => /[A-Z]/.test(password) && /[a-z]/.test(password),
	},
	{
		labelKey: "number",
		check: (password: string) => /[0-9]/.test(password),
	},
	{
		labelKey: "specialCharacter",
		check: (password: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
	},
] as const;

type InfluencerBidPasswordFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	autoComplete?: string;
	showCriteria?: boolean;
	isLarge?: boolean;
	required?: boolean;
};

export function InfluencerBidPasswordField({
	label,
	value,
	onChange,
	autoComplete,
	showCriteria = false,
	isLarge = true,
	required,
}: InfluencerBidPasswordFieldProps) {
	const t = useTranslations();

	return (
		<div>
			<Field
				label={label}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				type="password"
				autoComplete={autoComplete}
				isLarge={isLarge}
				required={required}
			/>
			{showCriteria && (
				<div className="mt-2 gap-x-3 gap-y-1 flex flex-wrap">
					{passwordCriteria.map((criterion) => {
						const isMet = criterion.check(value);

						return (
							<div key={criterion.labelKey} className="gap-1 flex items-center">
								{isMet ? (
									<CircleCheckIcon className="size-3.5 text-primary1 shrink-0" />
								) : (
									<CircleXIcon className="size-3.5 text-t-tertiary shrink-0" />
								)}
								<span className={`text-small ${isMet ? "text-t-primary" : "text-t-tertiary"}`}>
									{t(`common.passwordCriteria.${criterion.labelKey}`)}
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
