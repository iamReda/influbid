"use client";

import Layout from "@shared/components/influencerbid/layout";

import Infos from "./infos";
import Leaderboard from "./leaderboard";
import Start from "./start";

const HomePage = () => {
	return (
		<Layout>
			<Start />
			<Leaderboard />
			<Infos />
		</Layout>
	);
};

export default HomePage;
