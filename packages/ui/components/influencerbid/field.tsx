"use client";

import { useState } from "react";
import type * as React from "react";

import Icon from "./icon";

type FieldProps = {
	className?: string;
	classInput?: string;
	classLabel?: string;
	label?: string;
	isTextarea?: boolean;
	type?: string;
	onResetPassword?: () => void;
	isLarge?: boolean;
	currency?: string;
};

const Field = ({
	className,
	classInput,
	classLabel,
	label,
	isTextarea,
	type,
	onResetPassword,
	isLarge,
	currency,
	...inputProps
}: FieldProps &
	React.InputHTMLAttributes<HTMLInputElement> &
	React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const error = false;

	return (
		<div
			className={`relative ${label ? `${isLarge ? "pt-2.25" : "pt-1.5"}` : ""} ${className || ""}`}
		>
			{label && (
				<div
					className={`top-0 left-6 px-1 text-t-primary font-medium pointer-events-none absolute z-2 ${
						isLarge ? "text-hairline" : "text-small"
					} ${classLabel || "bg-b-surface1"}`}
				>
					{label}
				</div>
			)}
			<div className={`relative ${isTextarea ? "flex" : ""}`}>
				{isTextarea ? (
					<textarea
						className={`px-6.5 py-4 border-stroke1 dark:border-stroke2 text-t-primary font-medium placeholder:text-t-tertiary max-md:text-[1rem] w-full resize-none border-[1.5px] outline-0 transition-colors focus:border-[#A8A8A8]/50! ${
							error ? "border-primary3!" : ""
						} ${
							isLarge
								? "h-77 text-heading-thin tracking-normal! max-md:h-65 rounded-2xl"
								: "h-32 rounded-3xl text-input"
						} ${classInput || ""}`}
						{...inputProps}
					></textarea>
				) : (
					<input
						className={`px-6.5 border-stroke1 dark:border-stroke2 text-t-primary font-medium placeholder:text-t-tertiary max-md:text-[1rem] w-full border-[1.5px] outline-0 transition-colors focus:border-[#A8A8A8]/50! ${
							error ? "!border-primary3!" : ""
						} ${onResetPassword || type === "password" ? "pr-12" : ""} ${
							isLarge
								? "h-16 text-heading-thin tracking-normal! rounded-2xl"
								: "h-12 rounded-3xl text-input"
						} ${currency ? "pl-10" : ""} ${classInput || ""}`}
						type={type === "password" ? (isPasswordVisible ? "text" : "password") : type}
						{...inputProps}
					/>
				)}
				{onResetPassword && (
					<button
						className="right-4 text-0 fill-t-tertiary hover:fill-t-secondary absolute top-1/2 -translate-y-1/2 transition-colors"
						onClick={onResetPassword}
					>
						<Icon className="fill-inherit" name="question-circle" />
					</button>
				)}
				{!onResetPassword && type === "password" && (
					<button
						className="group right-5 absolute top-1/2 -translate-y-1/2"
						type="button"
						onClick={() => setIsPasswordVisible(!isPasswordVisible)}
					>
						<Icon
							className="fill-t-tertiary group-hover:fill-t-primary transition-colors"
							name={isPasswordVisible ? "eye" : "eye-hide"}
						/>
					</button>
				)}
				{currency && (
					<div className="left-7 text-button text-t-tertiary pointer-events-none absolute top-1/2 -translate-y-1/2">
						{currency}
					</div>
				)}
			</div>
		</div>
	);
};

export default Field;
