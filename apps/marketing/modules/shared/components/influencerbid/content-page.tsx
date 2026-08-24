"use client";

import Layout from "@shared/components/influencerbid/layout";
import type { ReactNode } from "react";

type ContentPageProps = {
	title: string;
	intro: ReactNode;
	children: ReactNode;
};

const ContentPage = ({ title, intro, children }: ContentPageProps) => {
	return (
		<Layout isLoggedIn>
			<div className="py-20 max-[1179px]:py-16 max-lg:py-12 max-md:py-8 max-md:overflow-hidden">
				<div className="center max-w-200 max-lg:max-w-175 max-md:max-w-full">
					<div className="mb-12 max-md:mb-8">
						<div className="mb-3 text-h1 max-md:mb-2">{title}</div>
						<div className="text-body-lg text-t-secondary">{intro}</div>
					</div>

					<div className="space-y-12 text-body text-t-secondary [&_h2]:mb-4 [&_h2]:text-h5 [&_h2]:text-t-primary [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:space-y-3 [&_ul]:pl-5 [&_li]:marker:text-t-tertiary [&_a]:text-t-primary [&_strong]:text-t-primary [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:underline [&_ul]:list-disc">
						{children}
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default ContentPage;
