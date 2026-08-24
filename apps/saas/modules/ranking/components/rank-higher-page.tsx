"use client";

import IncreaseBidSection from "@ranking/components/increase-bid-section";
import InfluencerBidHero from "@shared/components/influencerbid-hero";
import Layout from "@shared/components/influencerbid/layout";

const RankHigherPage = () => {
	return (
		<Layout isLoggedIn>
			<InfluencerBidHero
				title="Rank higher with your next bid"
				description="Add to your current bid to move up the ranking — your existing amount stays active and the new amount is simply added on top."
				ctaLabel={null}
				socialProofLabel={null}
				media={<IncreaseBidSection embedded />}
			/>
		</Layout>
	);
};

export default RankHigherPage;
