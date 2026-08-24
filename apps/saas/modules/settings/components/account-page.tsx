"use client";

import { AccountChangeEmailSection } from "@settings/components/account/AccountChangeEmailSection";
import { AccountChangeUsernameSection } from "@settings/components/account/AccountChangeUsernameSection";
import { AccountDeleteSection } from "@settings/components/account/AccountDeleteSection";
import { AccountSecuritySection } from "@settings/components/account/AccountSecuritySection";
import Layout from "@shared/components/influencerbid/layout";

type AccountPageProps = {
	userHasPassword: boolean;
};

export function AccountPage({ userHasPassword }: AccountPageProps) {
	return (
		<Layout isLoggedIn>
			<div className="px-6 py-12 max-md:py-8">
				<div className="max-w-lg mx-auto w-full">
					<div className="mb-15 text-h1 max-md:mb-8">Account settings</div>
					<div className="divide-stroke-subtle divide-y">
						<div className="pb-15 max-md:pb-8">
							<AccountChangeEmailSection />
						</div>
						<div className="py-15 max-md:py-8">
							<AccountChangeUsernameSection />
						</div>
						<div className="py-15 max-md:py-8">
							<AccountSecuritySection userHasPassword={userHasPassword} />
						</div>
						<div className="pt-15 max-md:pt-8">
							<AccountDeleteSection userHasPassword={userHasPassword} />
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}

export default AccountPage;
