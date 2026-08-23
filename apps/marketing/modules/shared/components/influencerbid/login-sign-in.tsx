"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import Image from "@repo/ui/components/influencerbid/image";
import { useState } from "react";

type Props = {
	onResetPassword: () => void;
	onSignUp: () => void;
	onLogin: () => void;
};

const SignIn = ({ onResetPassword, onSignUp, onLogin }: Props) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<div className="">
			<div className="mb-10 text-h3 text-center">Sign in to Briefberry</div>
			<Button className="w-full" isPrimary onClick={onLogin}>
				<Image
					className="w-6 mr-2 opacity-100"
					src="/images/google.svg"
					width={24}
					height={24}
					alt="Google"
				/>
				Sign in with Google
			</Button>
			<div className="py-6 text-small font-medium text-t-tertiary text-center">
				Or sign in with email
			</div>
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
				onResetPassword={onResetPassword}
				required
			/>
			<Button className="mb-4 w-full" isSecondary onClick={onLogin}>
				Sign in
			</Button>
			<div className="text-hairline font-medium text-t-secondary text-center">
				Need an account?{" "}
				<span
					className="text-t-primary cursor-pointer border-b border-t-primary transition-colors hover:border-transparent"
					onClick={onSignUp}
				>
					Sign up
				</span>
			</div>
		</div>
	);
};

export default SignIn;
