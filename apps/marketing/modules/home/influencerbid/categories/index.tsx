"use client";

import { influencerCategories } from "@home/influencerbid/constants/categories";
import Layout from "@shared/components/influencerbid/layout";
import { useMemo, useState } from "react";

import Category from "./category-card";

const CategoriesPage = () => {
	const [search, setSearch] = useState("");

	const filteredCategories = useMemo(
		() =>
			influencerCategories.filter((category) =>
				category.name.toLowerCase().includes(search.trim().toLowerCase()),
			),
		[search],
	);

	return (
		<Layout isLoggedIn>
			<div className="py-20 max-[1179px]:py-16 max-lg:py-12 max-md:py-8 max-md:overflow-hidden">
				<div className="max-w-334 px-12 max-3xl:max-w-304 max-2xl:max-w-280 max-[1179px]:max-w-232 max-md:px-6 mx-auto">
					<div className="mb-12 max-md:mb-8">
						<div className="mb-3 text-h1 max-md:mb-2">Categories</div>
						<div className="gap-6 max-md:flex-col max-md:items-stretch max-md:gap-4 flex items-center justify-between">
							<p className="max-w-160 text-body-lg text-t-secondary max-md:max-w-full">
								Every category has its own ranking. Pick one to see who leads it.
							</p>
							<input
								type="search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								className="h-12 w-64 bg-b-surface2 px-5 font-medium text-t-primary placeholder:text-t-secondary focus:shadow-hover max-md:w-full shrink-0 rounded-full border-0 text-input transition-shadow outline-none"
								placeholder="Search category.."
								aria-label="Search category"
							/>
						</div>
					</div>
					<div className="-mt-6 -mx-3 max-md:-mt-4 max-md:mx-0 flex flex-wrap">
						{filteredCategories.map((category) => (
							<Category item={category} key={category.id} />
						))}
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default CategoriesPage;
