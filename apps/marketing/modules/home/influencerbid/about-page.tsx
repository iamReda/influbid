"use client";

import ContentPage from "@shared/components/influencerbid/content-page";
import Link from "next/link";

const AboutPage = () => {
	return (
		<ContentPage
			title="About"
			intro={
				<>
					Influencerbid started as a simple idea: <strong>no ads</strong>,{" "}
					<strong>no API keys</strong>, <strong>no revenue sharing</strong>. Just outbid other
					influencers to climb the leaderboard — that&apos;s it.
				</>
			}
		>
			<section>
				<h2>Why we built it</h2>
				<p>
					Discovery for creators is noisy. Algorithms change, ads eat into reach, and tools often
					ask for API access or a cut of your income. Influencerbid takes a different path: a public
					ranking where visibility is earned by the bid you place — clear, transparent, and under
					your control.
				</p>
			</section>

			<section>
				<h2>About the website</h2>
				<p>
					Influencerbid is a public leaderboard for influencers. Pick a category, place a bid, and
					your profile appears on the board. Rank is decided by one number only: the dollar amount
					on your listing. Follower count, engagement, and connections are not weighed.
				</p>
				<p className="mt-4">
					Already on the board? Raise your bid anytime to move up. Your existing amount stays active
					— the new amount is simply added on top. Same rules for everyone.
				</p>
			</section>

			<section>
				<h2>How it helps influencers</h2>
				<ul>
					<li>
						<strong>Get discovered</strong> — brands and visitors browse category leaderboards to
						find creators who are serious about being seen.
					</li>
					<li>
						<strong>Own your visibility</strong> — you decide how high you want to climb. No opaque
						scoring, no ad auctions you don&apos;t control.
					</li>
					<li>
						<strong>Stay independent</strong> — we don&apos;t take a revenue share, we don&apos;t
						run ads on your profile, and we don&apos;t require API keys to your social accounts.
					</li>
					<li>
						<strong>Act fast</strong> — claim a spot, raise your bid, and watch your rank update.
						The board is the product.
					</li>
				</ul>
			</section>

			<section>
				<h2>Your public profile — all your links in one place</h2>
				<p>
					Every influencer gets a public profile page — a single link you can share anywhere,
					similar to Linktree. Put Instagram, TikTok, YouTube, X, and your other socials in one spot
					so brands and fans reach you without hunting across platforms.
				</p>
				<p className="mt-4">
					Your leaderboard listing points people to that profile. Visitors see who you are, where
					you create, and how to connect — while your bid keeps you visible on the board.
				</p>
			</section>

			<section>
				<h2>What we don&apos;t do</h2>
				<ul>
					<li>We don&apos;t sell ads against your profile or the leaderboard.</li>
					<li>We don&apos;t ask for API keys or take over your social accounts.</li>
					<li>We don&apos;t take a cut of brand deals or creator revenue.</li>
					<li>
						We don&apos;t host your posts or turn the site into a social feed — Influencerbid is for
						ranking and discovery, not another content stream.
					</li>
				</ul>
			</section>

			<section>
				<h2>The idea stays simple</h2>
				<p>
					Rank is the bid — nothing else. Same board. Same rules. A fair, public way for influencers
					to stand out and for brands to find them.
				</p>
			</section>

			<p className="pt-2">
				Ready to climb? Check the <Link href="/rules">rules</Link>, browse{" "}
				<Link href="/categories">categories</Link>, or go straight to the{" "}
				<Link href="/">leaderboard</Link>.
			</p>
		</ContentPage>
	);
};

export default AboutPage;
