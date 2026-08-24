"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import Layout from "@shared/components/influencerbid/layout";
import { useState } from "react";

const SettingsScreen = () => {
	const [email, setEmail] = useState("kohaku.tora@email.com");
	const [currentPassword, setCurrentPassword] = useState("1234567");
	const [newPassword, setNewPassword] = useState("1234567");
	const [confirmPassword, setConfirmPassword] = useState("1234567");

	return (
		<Layout isLoggedIn>
			<div className="px-6 py-12 max-md:py-8">
				<div className="max-w-lg mx-auto w-full">
					<div className="mb-15 text-h1 max-md:mb-8">Account settings</div>
					<div className="mb-15 max-md:mb-8">
						<div className="mb-8 text-h4">Email</div>
						<div className="gap-5 flex flex-col">
							<Field
								label="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								type="email"
								isLarge
								required
							/>
							<Button className="self-start" isSecondary type="button">
								Changer email
							</Button>
						</div>
					</div>
					<div className="mb-15 max-md:mb-8">
						<div className="mb-8 text-h4">Security</div>
						<div className="gap-5 flex flex-col">
							<Field
								label="Current password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								type="password"
								isLarge
								required
							/>
							<Field
								label="New password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								type="password"
								isLarge
								required
							/>
							<Field
								label="Confirm password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								type="password"
								isLarge
								required
							/>
						</div>
					</div>
					<Button isSecondary>Save changes</Button>
				</div>
			</div>
		</Layout>
	);
};

export default SettingsScreen;
