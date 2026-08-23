"use client";

import { useState } from "react";

import CreateAccount from "./login-create-account";
import ResetPassword from "./login-reset-password";
import SignIn from "./login-sign-in";

type Props = {
	onLogin: () => void;
};

const Login = ({ onLogin }: Props) => {
	const [step, setStep] = useState<"signIn" | "createAccount" | "resetPassword">("signIn");

	return (
		<div className="">
			{step === "signIn" && (
				<SignIn
					onResetPassword={() => setStep("resetPassword")}
					onSignUp={() => setStep("createAccount")}
					onLogin={onLogin}
				/>
			)}
			{step === "createAccount" && (
				<CreateAccount onSignIn={() => setStep("signIn")} onCreateAccount={onLogin} />
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
