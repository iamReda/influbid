"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import Image from "@repo/ui/components/influencerbid/image";
import { useState } from "react";

type Props = {
	onSignIn: () => void;
	onCreateAccount: () => void;
};

const CreateAccount = ({ onSignIn, onCreateAccount }: Props) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<div className="">
			<div className="mb-10 text-h3 text-center">Create an account</div>
			<Button className="w-full" isPrimary onClick={onCreateAccount}>
				<Image
					className="w-6 mr-2 opacity-100"
					src="/images/google.svg"
					width={24}
					height={24}
					alt="Google"
				/>
				Sign up with Google
			</Button>
			<div className="py-6 text-small font-medium text-t-tertiary text-center">
				Or use your email
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
				required
			/>
			<Button className="mb-4 w-full" isSecondary onClick={onCreateAccount}>
				Create account
			</Button>
			<div className="text-hairline font-medium text-t-secondary text-center">
				Already have an account?{" "}
				<span
					className="text-t-primary cursor-pointer border-b border-t-primary transition-colors hover:border-transparent"
					onClick={onSignIn}
				>
					Sign in
				</span>
			</div>
		</div>
	);
};

export default CreateAccount;
