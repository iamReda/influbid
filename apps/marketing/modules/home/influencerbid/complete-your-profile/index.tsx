"use client";

import Image from "@repo/ui/components/influencerbid/image";
import Layout from "@shared/components/influencerbid/layout";

import BidSummary from "./bid-summary";
import Form from "./form";

const CompleteYourProfilePage = () => {
	return (
		<Layout
			className="max-md:block max-md:min-h-auto"
			isFixedHeader
			isHiddenFooter
			isLoggedIn
			isMinimalHeader
		>
			<div className="flex min-h-svh">
				<div className="px-8 pt-28 pb-16 max-2xl:pb-12 max-md:min-h-svh max-md:px-6 max-md:pt-24 max-md:pb-8 flex grow justify-center">
					<Form />
				</div>
				<div className="top-0 w-160 p-2.5 pl-0 max-3xl:w-140 max-2xl:w-120 max-xl:hidden sticky flex h-svh shrink-0 flex-col">
					<div className="top-0 right-0 absolute">
						<Image src="/images/quiz-gradient.png" width={692} height={549} alt="" />
					</div>
					<BidSummary />
				</div>
			</div>
		</Layout>
	);
};

export default CompleteYourProfilePage;
