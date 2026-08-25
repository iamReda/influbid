"use client";

import Button from "@repo/ui/components/influencerbid/button";
import Field from "@repo/ui/components/influencerbid/field";
import About from "@shared/components/about-section";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Lightbulb, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

const centsToDollars = (cents: number) => Math.round(cents / 100);

const opportunityDollars = (amountCents: number, minIncreaseCents: number) => {
	if (amountCents <= 0) {
		return 0;
	}

	return centsToDollars(Math.max(amountCents, minIncreaseCents));
};

const IncreaseBidSection = ({ embedded = false }: { embedded?: boolean }) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [addAmount, setAddAmount] = useState("0");
	const [error, setError] = useState<string | null>(null);
	const [debouncedAddAmount, setDebouncedAddAmount] = useDebounceValue(addAmount, 300);

	useEffect(() => {
		setDebouncedAddAmount(addAmount);
	}, [addAmount, setDebouncedAddAmount]);

	const { data: creator, isLoading } = useQuery(orpc.creators.getMyCreator.queryOptions());

	const parsedAdd = Number(addAmount);
	const safeAdd =
		addAmount === "" || Number.isNaN(parsedAdd) ? 0 : Math.max(0, Math.round(parsedAdd));
	const addedAmountCents = safeAdd * 100;

	const debouncedParsed = Number(debouncedAddAmount);
	const debouncedAddCents =
		debouncedAddAmount === "" || Number.isNaN(debouncedParsed)
			? 0
			: Math.max(0, Math.round(debouncedParsed)) * 100;

	const { data: estimate } = useQuery({
		...orpc.creators.estimateMyBidIncrease.queryOptions({
			input: { addedAmountCents: debouncedAddCents },
		}),
		enabled: Boolean(creator),
	});

	const confirmIncrease = useMutation(
		orpc.creators.mockConfirmBidIncrease.mutationOptions({
			onSuccess: async () => {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: orpc.creators.getMyCreator.key(),
					}),
					queryClient.invalidateQueries({
						queryKey: orpc.creators.listMyBids.key(),
					}),
					queryClient.invalidateQueries({
						queryKey: orpc.creators.estimateMyBidIncrease.key(),
					}),
				]);
				const successParams = new URLSearchParams();
				successParams.set("amount", String(safeAdd));
				router.push(`/success?${successParams.toString()}`);
				router.refresh();
			},
			onError: (mutationError) => {
				setError(
					mutationError instanceof Error
						? mutationError.message
						: "Payment failed. Please try again.",
				);
			},
		}),
	);

	if (!isLoading && !creator) {
		return (
			<About
				hideHeader
				embedded={embedded}
				firstCard={{
					title: "Increase your bid",
					content:
						"Add more to your current bid to move higher in the ranking and gain more visibility.",
					useRocketIcon: true,
					media: (
						<div className="gap-3 bg-b-surface2 p-5 max-md:p-4 relative z-3 flex w-full flex-col rounded-3xl">
							<p className="text-small text-t-secondary">
								Create a ranking bid to unlock bid increases and live rank projections.
							</p>
						</div>
					),
				}}
			/>
		);
	}

	const currentBid = creator ? centsToDollars(creator.totalBidCents) : 0;
	const newTotal = estimate ? centsToDollars(estimate.previewTotalCents) : currentBid + safeAdd;
	const projectedGlobalRank = estimate?.generalRank ?? creator?.generalRank ?? 0;
	const projectedCategoryRank = estimate?.categoryRank ?? creator?.categoryRank ?? 0;
	const globalRankGain = Math.max(0, (creator?.generalRank ?? 0) - projectedGlobalRank);
	const categoryRankGain = Math.max(0, (creator?.categoryRank ?? 0) - projectedCategoryRank);
	const categoryName = creator?.categoryName ?? "Category";
	const minIncreaseCents = creator?.minIncreaseCents ?? 500;
	const categoryOpportunity = creator
		? opportunityDollars(creator.amountToCategoryOneCents, minIncreaseCents)
		: 0;
	const globalOpportunity = creator
		? opportunityDollars(creator.amountToGeneralOneCents, minIncreaseCents)
		: 0;
	const canSubmit = addedAmountCents >= minIncreaseCents && !confirmIncrease.isPending;

	return (
		<About
			hideHeader
			embedded={embedded}
			firstCard={{
				title: "Increase your bid",
				content:
					"Add more to your current bid to move higher in the ranking and gain more visibility.",
				useRocketIcon: true,
				media: (
					<div className="gap-3 bg-b-surface2 p-5 max-md:p-4 relative z-3 flex w-full flex-col rounded-3xl">
						<div className="gap-3 flex items-center justify-between">
							<span className="text-small text-t-primary dark:text-white">Current bid</span>
							<span className="text-button text-t-primary dark:text-white">${currentBid}</span>
						</div>
						<div className="gap-3 flex items-center justify-between">
							<span className="text-small text-t-primary dark:text-white">Added amount</span>
							<span className="text-button text-t-primary dark:text-white">+${safeAdd}</span>
						</div>
						<div className="bg-stroke1 dark:bg-stroke2 h-px w-full" />
						<div className="gap-3 flex items-center justify-between">
							<span className="text-small text-t-primary dark:text-white">New total</span>
							<span className="text-button text-t-primary dark:text-white">${newTotal}</span>
						</div>
						<div className="mt-1 gap-2.5 grid grid-cols-2">
							<div className="border-stroke1 px-3.5 py-3 dark:border-stroke2 rounded-2xl border-[1.5px]">
								<div className="mb-2 gap-2 flex items-center">
									<span className="size-7 bg-primary1/10 text-t-primary dark:text-white flex shrink-0 items-center justify-center rounded-full">
										<Globe className="size-3.5 stroke-[1.75px]" aria-hidden />
									</span>
									<span className="text-hairline text-t-primary dark:text-white">Global rank</span>
								</div>
								<div className="text-h5 text-t-primary dark:text-white">#{projectedGlobalRank}</div>
								{globalRankGain > 0 ? (
									<div className="mt-1 text-hairline font-medium text-primary2">
										↑ +{globalRankGain} {globalRankGain === 1 ? "position" : "positions"}
									</div>
								) : (
									<div className="mt-1 text-hairline text-t-tertiary">No change yet</div>
								)}
							</div>
							<div className="border-stroke1 px-3.5 py-3 dark:border-stroke2 rounded-2xl border-[1.5px]">
								<div className="mb-2 gap-2 flex items-center">
									<span className="size-7 bg-primary1/10 text-t-primary dark:text-white flex shrink-0 items-center justify-center rounded-full">
										<Shirt className="size-3.5 stroke-[1.75px]" aria-hidden />
									</span>
									<span className="text-hairline text-t-primary dark:text-white">
										{categoryName}
									</span>
								</div>
								<div className="text-h5 text-t-primary dark:text-white">
									#{projectedCategoryRank}
								</div>
								{categoryRankGain > 0 ? (
									<div className="mt-1 text-hairline font-medium text-primary2">
										↑ +{categoryRankGain} {categoryRankGain === 1 ? "position" : "positions"}
									</div>
								) : (
									<div className="mt-1 text-hairline text-t-tertiary">No change yet</div>
								)}
							</div>
						</div>
						<div className="mt-1 gap-2.5 bg-b-surface1 px-3.5 py-3 flex items-center rounded-2xl">
							<Lightbulb
								className="size-4 text-t-primary dark:text-white shrink-0 stroke-[1.75px]"
								aria-hidden
							/>
							<p className="text-small text-t-secondary">
								{categoryOpportunity > 0 || globalOpportunity > 0 ? (
									<>
										Claim <span className="text-t-primary font-semibold">#1</span> in{" "}
										<span className="text-t-primary font-semibold">{categoryName}</span>
										{categoryOpportunity > 0 ? (
											<>
												{" "}
												for{" "}
												<span className="text-t-primary font-semibold">${categoryOpportunity}</span>
											</>
										) : null}{" "}
										and <span className="text-t-primary font-semibold">#1</span> in{" "}
										<span className="text-t-primary font-semibold">Global</span>
										{globalOpportunity > 0 ? (
											<>
												{" "}
												for{" "}
												<span className="text-t-primary font-semibold">${globalOpportunity}</span>
											</>
										) : null}
										.
									</>
								) : (
									<>You are already #1 in {categoryName} and Global.</>
								)}
							</p>
						</div>
					</div>
				),
				footer: (
					<div className="gap-5 flex flex-col">
						<Field
							classLabel="bg-b-subtle"
							classInput="bg-white border-[#D0D0D0] text-t-primary placeholder:text-t-secondary dark:bg-transparent dark:border-stroke2"
							label="Add amount"
							value={addAmount}
							onChange={(event) => {
								const next = event.target.value.replace(/[^\d]/g, "");
								setError(null);
								setAddAmount(next);
							}}
							name="about-add-amount"
							type="text"
							inputMode="numeric"
							placeholder="0"
							currency="$"
						/>
						{error ? (
							<p className="text-small text-primary3 text-center" role="alert">
								{error}
							</p>
						) : null}
						<Button
							className="w-full"
							isSecondary
							disabled={!canSubmit}
							onClick={() => {
								if (!canSubmit) {
									return;
								}
								setError(null);
								confirmIncrease.mutate({ addedAmountCents });
							}}
						>
							{confirmIncrease.isPending ? "Processing payment…" : "Increase bid"}
						</Button>
					</div>
				),
			}}
		/>
	);
};

export default IncreaseBidSection;
