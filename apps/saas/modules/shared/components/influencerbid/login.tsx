"use client";

import { useState } from "react";

import ResetPassword from "./login-reset-password";
import SignIn from "./login-sign-in";

type Props = {
	onLogin: () => void;
};

const Login = ({ onLogin }: Props) => {
	const [step, setStep] = useState<"signIn" | "resetPassword">("signIn");

	return (
		<div className="">
			{step === "signIn" && (
				<SignIn onResetPassword={() => setStep("resetPassword")} onLogin={onLogin} />
			)}
			{step === "resetPassword" && (
				<ResetPassword
					onLogin={() => setStep("signIn")}
					onResetPassword={() => setStep("signIn")}
				/>
			)}
		</div>
	);
};

export default Login;
