"use client";

import Link, { LinkProps } from "next/link";
import React from "react";

import Icon from "./icon";

type CommonProps = {
	className?: string;
	icon?: string;
	children?: React.ReactNode;
	isPrimary?: boolean;
	isSecondary?: boolean;
	isStroke?: boolean;
	isCircle?: boolean;
};

type ButtonAsButton = {
	as?: "button";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonAsAnchor = {
	as: "a";
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

type ButtonAsLink = {
	as: "link";
} & LinkProps;

type ButtonProps = CommonProps & (ButtonAsButton | ButtonAsAnchor | ButtonAsLink);

const Button: React.FC<ButtonProps> = ({
	className,
	icon,
	children,
	isPrimary,
	isSecondary,
	isStroke,
	isCircle,
	as = "button",
	...props
}) => {
	const isLink = as === "link";
	const Component: React.ElementType = isLink ? Link : as;

	return (
		<Component
			className={`h-12 px-6.5 text-button hover:shadow-hover inline-flex cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-all disabled:pointer-events-none ${
				isPrimary
					? "bg-b-surface2 text-t-secondary fill-t-secondary hover:text-t-primary hover:fill-t-primary border-transparent dark:relative dark:after:absolute dark:after:inset-[-1.5px] dark:after:rounded-full dark:after:border-[1.5px] dark:after:border-[#FDFDFD]/10 dark:after:mask-linear-170 dark:after:mask-linear-from-1% dark:after:mask-linear-to-70% dark:after:opacity-0 dark:after:transition-opacity dark:hover:after:opacity-100"
					: ""
			} ${
				isSecondary
					? "bg-b-dark1 text-t-light fill-t-light hover:bg-b-dark2 border-transparent"
					: ""
			} ${
				isStroke
					? "border-stroke2 text-t-secondary fill-t-secondary hover:border-stroke-highlight hover:text-t-primary hover:fill-t-primary dark:border-stroke2 dark:hover:border-stroke-highlight bg-transparent hover:shadow-none!"
					: ""
			} ${isCircle ? "gap-0! w-12 px-0!" : ""} ${className || ""}`}
			{...(isLink ? (props as LinkProps) : props)}
		>
			{icon && <Icon className="mr-2 fill-inherit" name={icon} />}
			{children}
		</Component>
	);
};

export default Button;
