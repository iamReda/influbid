"use client";

import ContentPage from "@shared/components/influencerbid/content-page";
import Link from "next/link";

const RulesPage = () => {
	return (
		<ContentPage
			title="Rules"
			intro={
				<>
					Influencerbid is a public leaderboard for influencers. Your position is decided by a
					single number: the dollar amount attached to your listing. Nothing else is weighed — not
					follower count, not engagement, not who you know. There are <strong>no ads</strong>,{" "}
					<strong>no API keys</strong>, and <strong>no revenue share</strong>. Rank is the bid —
					nothing else.
				</>
			}
		>
			<section>
				<h2>Ranking</h2>
				<ul>
					<li>
						Bids are whole US dollars. A new listing starts at <strong>$3</strong>; the ceiling for
						any listing is $999,999. Amounts can move in steps of $1.
					</li>
					<li>
						To take any spot — including #1 — you only need to match the amount sitting there.
						Bidding less is fine too: you simply land wherever your amount fits in the order.
					</li>
					<li>
						Existing listings keep their amount until their owner raises it or someone passes them.
						When two listings hold the same amount, the newer bid ranks ahead — so matching a price
						takes that place.
					</li>
					<li>
						Paste the same social profile link again to raise your own listing. Your new total has
						to be at least $1 above what you already hold, and you are charged only the gap between
						the two. Nobody else can leapfrog you by paying that gap; a different profile always
						pays its full bid.
					</li>
					<li>
						Listings are keyed by social profile, so every profile has exactly one spot per
						category. Tracking parameters and unnecessary URL noise are ignored.
					</li>
				</ul>
			</section>

			<section>
				<h2>What can be listed</h2>
				<ul>
					<li>
						Any public influencer profile on supported social networks. Paste your main profile link
						and pick a category.
					</li>
					<li>
						Profile name, avatar, and public stats are pulled from the linked network when you bid
						and refreshed when you raise your listing. You cannot supply your own copy or images —
						what the platform shows is what the board shows.
					</li>
					<li>
						We do <strong>not accept adult content</strong>, influencers who showcase adult content,
						drug-related content, or anything forbidden by law. Listings that violate this rule may
						be removed without refund.
					</li>
					<li>
						Profiles that become private, deleted, or otherwise unavailable may be removed from the
						board without refund.
					</li>
					<li>
						Fake accounts, impersonation, and profiles that are not genuine influencer pages are not
						accepted.
					</li>
				</ul>
			</section>

			<section>
				<h2>Once you have paid</h2>
				<ul>
					<li>
						Your rank is claimed the moment the payment completes — not when the checkout opens.
					</li>
					<li>
						The listing is public. Clicks go to your social profile, and your totals are shown on
						the board.
					</li>
					<li>
						Bids are not refundable when you get outranked. Being passed is the whole game; raise
						your bid to climb back.
					</li>
				</ul>
			</section>

			<section>
				<h2>Payments &amp; disputes</h2>
				<ul>
					<li>
						Checkout is handled by our payment provider, which acts as merchant of record. By
						finishing a checkout you confirm that you chose the amount yourself, understood that it
						buys a position on a public board rather than a product or service, and authorize the
						charge.
					</li>
					<li>
						A position can be overtaken at any time by a higher bid. That is how the board works,
						and it is not grounds for a refund or a payment dispute.
					</li>
					<li>
						If something went wrong — a double charge, a listing that never appeared, a payment that
						didn&apos;t apply — get in touch first using the support address on your receipt. We
						resolve genuine errors quickly; a chargeback filed without contacting us may result in
						the listing being removed.
					</li>
					<li>
						Nothing here limits rights that can&apos;t be waived under your local consumer law.
					</li>
				</ul>
			</section>

			<p className="pt-2">
				Questions? Read the <Link href="/about">about page</Link> or head back to the{" "}
				<Link href="/">leaderboard</Link>.
			</p>
		</ContentPage>
	);
};

export default RulesPage;
