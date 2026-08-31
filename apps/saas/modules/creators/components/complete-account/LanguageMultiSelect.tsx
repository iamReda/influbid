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
import { useMemo, useRef, useState } from "react";

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
	const inputRef = useRef<HTMLInputElement>(null);
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
		queueMicrotask(() => {
			inputRef.current?.blur();
		});
	};

	const removeLanguage = (code: IsoLanguageCode) => {
		onChange(value.filter((item) => item !== code));
	};

	return (
		<div>
			<label className="mb-2 text-button font-medium text-t-primary block">{label}</label>
			<Combobox value={null} onChange={addLanguage} immediate>
				<div className="relative">
					<ComboboxInput
						ref={inputRef}
						className="form-control h-12 px-6 pr-12 font-medium text-t-primary placeholder:text-t-tertiary w-full rounded-3xl text-[0.875rem]"
						onChange={(event) => setQuery(event.target.value)}
						displayValue={() => query}
						placeholder={searchPlaceholder}
						autoComplete="off"
					/>
					<ComboboxButton className="group right-4 size-7 absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full">
						<Icon
							className="fill-t-secondary shrink-0 transition-transform group-data-open:rotate-180"
							name="chevron"
						/>
					</ComboboxButton>
					<ComboboxOptions
						anchor={{ to: "bottom start", gap: 6 }}
						className="bg-b-surface2 border-stroke2 p-2.5 shadow-hover max-h-64 z-100 w-(--input-width) overflow-auto rounded-3xl border-[1.5px] outline-none empty:invisible"
					>
						{available.map((option) => (
							<ComboboxOption
								key={option.code}
								value={option.code}
								className="px-4 py-2.5 text-button text-t-secondary data-focus:bg-b-highlight data-focus:text-t-primary flex cursor-pointer items-center justify-between rounded-full transition-colors"
							>
								<span>{option.name}</span>
								<span className="text-small font-medium text-t-tertiary uppercase">
									{option.code}
								</span>
							</ComboboxOption>
						))}
					</ComboboxOptions>
				</div>
			</Combobox>
			{selectedOptions.length > 0 ? (
				<div className="mt-3 gap-2 flex flex-wrap">
					{selectedOptions.map((option) => (
						<button
							key={option.code}
							type="button"
							className="group gap-1.5 h-9 border-primary1/20 bg-primary1/10 px-3.5 text-button font-medium text-t-blue hover:border-primary1/40 inline-flex items-center rounded-full border-[1.5px] transition-colors"
							onClick={() => removeLanguage(option.code)}
							aria-label={`Remove ${option.name}`}
						>
							<span>{option.name}</span>
							<Icon
								className="size-3! fill-t-blue group-hover:fill-t-primary transition-colors"
								name="close-small"
							/>
						</button>
					))}
				</div>
			) : (
				<p className="mt-3 text-small text-t-secondary">{placeholder}</p>
			)}
		</div>
	);
}
