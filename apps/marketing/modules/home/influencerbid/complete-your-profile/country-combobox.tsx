"use client";

import {
	Combobox,
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import { CountryFlag } from "@repo/ui/components/influencerbid/country-flag";
import Icon from "@repo/ui/components/influencerbid/icon";
import { listCountryOptions, type IsoCountryCode } from "@repo/utils";
import { useMemo, useState } from "react";

type CountryComboboxProps = {
	value: IsoCountryCode | null;
	onChange: (value: IsoCountryCode | null) => void;
	required?: boolean;
	id?: string;
	"aria-label"?: string;
	/** Extra label/input surface classes (e.g. edit form `bg-b-surface1`) */
	classLabel?: string;
	classInput?: string;
};

export function CountryCombobox({
	value,
	onChange,
	required,
	id,
	"aria-label": ariaLabel,
	classLabel,
	classInput,
}: CountryComboboxProps) {
	const [query, setQuery] = useState("");
	const options = useMemo(() => listCountryOptions("en"), []);

	const selected = value ? (options.find((option) => option.code === value) ?? null) : null;

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) {
			return options;
		}
		return options.filter(
			(option) => option.name.toLowerCase().includes(q) || option.code.toLowerCase().includes(q),
		);
	}, [options, query]);

	return (
		<div>
			<label className={`mb-2 text-button text-t-primary block ${classLabel ?? ""}`} htmlFor={id}>
				Country{required ? " *" : ""}
			</label>
			<Combobox
				value={selected}
				onChange={(option) => {
					onChange(option?.code ?? null);
					setQuery("");
				}}
				onClose={() => setQuery("")}
				immediate
			>
				<div className="relative">
					<div
						className={`form-control h-12 pl-4 pr-10 font-medium text-t-primary gap-2.5 flex w-full items-center rounded-3xl ${classInput ?? ""}`}
					>
						{selected && !query ? (
							<CountryFlag countryCode={selected.code} size="sm" title={selected.name} />
						) : null}
						<ComboboxInput
							id={id}
							aria-label={ariaLabel ?? "Country"}
							className="min-w-0 font-medium text-t-primary placeholder:text-t-tertiary max-md:text-[1rem] leading-5 flex-1 bg-transparent text-[0.875rem] outline-0"
							displayValue={(option: { name: string } | null) => option?.name ?? ""}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Select country"
							autoComplete="off"
						/>
					</div>
					<ComboboxButton className="right-3 absolute top-1/2 -translate-y-1/2">
						<Icon className="fill-t-secondary shrink-0" name="chevron" />
					</ComboboxButton>
					<ComboboxOptions className="p-2.5 bg-b-surface2 shadow-hover mt-1 max-h-60 z-100 w-full overflow-auto rounded-3xl outline-none empty:invisible">
						{filtered.map((option) => (
							<ComboboxOption
								key={option.code}
								value={option}
								className="gap-2.5 pl-2.5 pr-3 py-2 text-button text-t-secondary data-focus:bg-b-highlight data-focus:text-t-primary data-selected:text-t-primary flex cursor-pointer items-center rounded-full transition-colors"
							>
								<CountryFlag countryCode={option.code} size="sm" title={option.name} />
								<span className="min-w-0 truncate">{option.name}</span>
								<span className="text-t-tertiary text-small shrink-0">{option.code}</span>
							</ComboboxOption>
						))}
					</ComboboxOptions>
				</div>
			</Combobox>
		</div>
	);
}

export default CountryCombobox;
