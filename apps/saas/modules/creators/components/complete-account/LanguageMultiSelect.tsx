"use client";

import {
	Combobox,
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import Icon from "@repo/ui/components/influencerbid/icon";
import { listLanguageOptions, type IsoLanguageCode } from "@repo/utils";
import { useMemo, useState } from "react";

type LanguageMultiSelectProps = {
	value: IsoLanguageCode[];
	onChange: (value: IsoLanguageCode[]) => void;
	label: string;
	placeholder: string;
	searchPlaceholder: string;
};

export function LanguageMultiSelect({
	value,
	onChange,
	label,
	placeholder,
	searchPlaceholder,
}: LanguageMultiSelectProps) {
	const [query, setQuery] = useState("");
	const options = useMemo(() => listLanguageOptions("en"), []);

	const selectedSet = useMemo(() => new Set(value), [value]);

	const available = useMemo(() => {
		const q = query.trim().toLowerCase();
		return options.filter((option) => {
			if (selectedSet.has(option.code)) {
				return false;
			}
			if (!q) {
				return true;
			}
			return option.name.toLowerCase().includes(q) || option.code.toLowerCase().includes(q);
		});
	}, [options, query, selectedSet]);

	const selectedOptions = useMemo(
		() => options.filter((option) => selectedSet.has(option.code)),
		[options, selectedSet],
	);

	const addLanguage = (code: IsoLanguageCode | null) => {
		if (!code || selectedSet.has(code)) {
			return;
		}
		onChange([...value, code]);
		setQuery("");
	};

	const removeLanguage = (code: IsoLanguageCode) => {
		onChange(value.filter((item) => item !== code));
	};

	return (
		<div>
			<label className="mb-2 text-sm font-medium block">{label}</label>
			{selectedOptions.length > 0 ? (
				<div className="mb-3 gap-2 flex flex-wrap">
					{selectedOptions.map((option) => (
						<button
							key={option.code}
							type="button"
							className="gap-1.5 h-8 px-3 text-sm inline-flex items-center rounded-full border bg-muted/40 hover:bg-muted"
							onClick={() => removeLanguage(option.code)}
							aria-label={`Remove ${option.name}`}
						>
							<span>{option.name}</span>
							<Icon className="size-3! fill-t-secondary" name="close-small" />
						</button>
					))}
				</div>
			) : (
				<p className="mb-3 text-sm text-muted-foreground">{placeholder}</p>
			)}
			<Combobox value={null} onChange={addLanguage} immediate>
				<div className="relative">
					<ComboboxInput
						className="h-12 px-4 text-sm w-full rounded-full border border-input bg-transparent outline-0"
						onChange={(event) => setQuery(event.target.value)}
						displayValue={() => query}
						placeholder={searchPlaceholder}
						autoComplete="off"
					/>
					<ComboboxButton className="right-3 absolute top-1/2 -translate-y-1/2">
						<Icon className="shrink-0 fill-muted-foreground" name="chevron" />
					</ComboboxButton>
					<ComboboxOptions className="p-2 shadow-md mt-1 max-h-56 z-50 w-full overflow-auto rounded-2xl border bg-popover outline-none empty:invisible">
						{available.map((option) => (
							<ComboboxOption
								key={option.code}
								value={option.code}
								className="px-3 py-2 text-sm flex cursor-pointer items-center justify-between rounded-full data-focus:bg-accent"
							>
								<span>{option.name}</span>
								<span className="text-xs text-muted-foreground">{option.code}</span>
							</ComboboxOption>
						))}
					</ComboboxOptions>
				</div>
			</Combobox>
		</div>
	);
}
