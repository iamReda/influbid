"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import { useState } from "react";

type Props = {
	onLogin: () => void;
	onResetPassword: () => void;
};

const ResetPassword = ({ onLogin, onResetPassword }: Props) => {
	const [email, setEmail] = useState("");

	return (
		<div className="">
			<div className="mb-10 text-h3 text-center">Reset password</div>
			<Field
				className="mb-6"
				label="Email"
				placeholder="Enter email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>
			<Button className="mb-4 w-full" isSecondary onClick={onResetPassword}>
				Reset password
			</Button>
			<div className="text-hairline font-medium text-t-secondary text-center">
				Have your password?{" "}
				<span
					className="text-t-primary cursor-pointer border-b border-t-primary transition-colors hover:border-transparent"
					onClick={onLogin}
				>
					Login
				</span>
			</div>
		</div>
	);
};

export default ResetPassword;
