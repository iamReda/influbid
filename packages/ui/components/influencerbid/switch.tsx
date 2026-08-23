"use client";

import { Switch as HeadlessSwitch } from "@headlessui/react";

type SwitchProps = {
	className?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	"aria-label"?: string;
};

const Switch = ({
	className,
	checked,
	onChange,
	disabled,
	"aria-label": ariaLabel,
}: SwitchProps) => {
	return (
		<HeadlessSwitch
			className={`group h-7 w-12 bg-b-surface3 data-checked:bg-primary1 relative inline-flex shrink-0 cursor-pointer rounded-full shadow-[inset_0_0_0_1.5px_var(--color-stroke2)] transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 data-checked:shadow-none ${
				className || ""
			}`}
			checked={checked}
			onChange={onChange}
			disabled={disabled}
			aria-label={ariaLabel}
		>
			<span
				aria-hidden
				className="top-0.5 left-0.5 size-6 bg-b-surface2 shadow-hover ease-in-out group-data-checked:translate-x-5.5 dark:bg-b-dark2 dark:group-data-checked:bg-b-surface2 pointer-events-none absolute rounded-full transition-transform duration-200"
			/>
		</HeadlessSwitch>
	);
};

export default Switch;
