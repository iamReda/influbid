"use client";

import { config } from "@config";
import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import { useState } from "react";

type Props = {
	onResetPassword: () => void;
	onLogin: () => void;
};

const SignIn = ({ onResetPassword, onLogin }: Props) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<div className="">
			<div className="mb-10 text-h3 text-center">Sign in to {config.appName}</div>
			<Field
				className="mb-4"
				label="Email"
				placeholder="Enter email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>
			<Field
				className="mb-6"
				label="Password"
				placeholder="Enter password"
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
			<Button className="mb-4 w-full" isSecondary onClick={onLogin}>
				Sign in
			</Button>
			<div className="text-hairline font-medium text-t-secondary text-center">
				Forgot your password?{" "}
				<span
					className="text-t-primary cursor-pointer border-b border-t-primary transition-colors hover:border-transparent"
					onClick={onResetPassword}
				>
					Reset it
				</span>
			</div>
			<div className="bg-stroke1 dark:bg-stroke2 my-6 h-px w-full" />
			<p className="text-small text-t-tertiary leading-relaxed text-center">
				Want to sign up? Place a one-time bid of $5 or more — forever your ticket to join a
				community of standout influencers.
			</p>
		</div>
	);
};

export default SignIn;
