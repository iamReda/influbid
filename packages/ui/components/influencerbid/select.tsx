"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";

import Icon from "./icon";

type SelectOption = {
	id: number;
	name: string;
};

type SelectProps = {
	className?: string;
	classButton?: string;
	value: SelectOption;
	onChange: (value: SelectOption) => void;
	options: SelectOption[];
};

const Select = ({ className, classButton, value, onChange, options }: SelectProps) => {
	return (
		<Listbox className={`${className || ""}`} value={value} onChange={onChange} as="div">
			<ListboxButton
				className={`group h-12 pl-5 pr-3 bg-b-surface2 text-button text-t-secondary data-hover:shadow-hover data-hover:text-t-primary data-open:text-t-primary flex w-full items-center justify-between rounded-full outline-0 transition-all data-open:shadow-none ${
					classButton || ""
				}`}
			>
				{value.name}
				<Icon
					className="ml-3 fill-t-secondary group-data-hover:fill-t-primary group-data-open:fill-t-primary shrink-0 transition-all group-data-open:rotate-180"
					name="chevron"
				/>
			</ListboxButton>
			<ListboxOptions
				className="p-2.5 bg-b-surface2 shadow-hover ease-out z-100 w-(--button-width) origin-top rounded-3xl transition duration-200 outline-none [--anchor-gap:0.25rem] data-closed:scale-95 data-closed:opacity-0"
				anchor="bottom"
				transition
				modal={false}
			>
				{options.map((option) => (
					<ListboxOption
						className="pl-2.5 pr-6 py-2 text-button text-t-secondary after:top-3.5 after:right-2.5 after:size-2 after:bg-t-blue data-focus:bg-b-highlight data-focus:text-t-primary data-selected:text-t-primary relative w-full cursor-pointer rounded-full text-left transition-colors after:absolute after:rounded-full after:opacity-0 after:transition-opacity data-selected:after:opacity-100"
						key={option.id}
						value={option}
					>
						{option.name}
					</ListboxOption>
				))}
			</ListboxOptions>
		</Listbox>
	);
};

export default Select;
