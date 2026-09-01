"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import Button from "@repo/ui/components/influencerbid/button";
import Icon from "@repo/ui/components/influencerbid/icon";
import { Minus, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";

import { estimateSignupRankAction, type CategoryOptionDto } from "../actions";
import { getCategoryUi } from "../lib/category-ui";
import { saveSignupDraft } from "../lib/signup-draft";
import { detectPlatform, SOCIAL_PLATFORMS, toHttpsSocialUrl } from "../lib/social-url";
import { TAKE_SPOT_EVENT, type TakeSpotDetail } from "../lib/take-spot";
import SocialPlatformIcon from "./social-platform-icon";

const MIN_BID = 5;
const BID_STEP = 1;

type FormErrors = {
	bid?: string;
	socialUrl?: string;
	category?: string;
};

const clampBid = (value: number) => Math.max(MIN_BID, Math.round(value));

const bidControlClass =
	"liquid-glass-button flex size-14 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus max-md:size-12";

const bidAmountClass =
	"border-0 bg-transparent p-0 text-[4.25rem] leading-none font-black! tracking-[-0.02em] text-t-blue outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none max-lg:text-hero max-md:text-h1";

type BidFormProps = {
	className?: string;
	categories: CategoryOptionDto[];
	defaultBidDollars: number;
	onRankChange?: (rank: number) => void;
};

const BidForm = ({ className, categories, defaultBidDollars, onRankChange }: BidFormProps) => {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const bidInputRef = useRef<HTMLInputElement>(null);
	const initialBid = clampBid(defaultBidDollars);
	const [bid, setBid] = useState(initialBid);
	const [bidInput, setBidInput] = useState(String(initialBid));
	const [socialUrl, setSocialUrl] = useState("");
	const [category, setCategory] = useState<CategoryOptionDto | null>(null);
	const [categoryQuery, setCategoryQuery] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [submitted, setSubmitted] = useState(false);
	const [platformCycleIndex, setPlatformCycleIndex] = useState(0);
	const [claimRank, setClaimRank] = useState(1);
	const [categoryRank, setCategoryRank] = useState<number | null>(null);

	const filteredCategories = useMemo(() => {
		const query = categoryQuery.trim().toLowerCase();

		if (!query) {
			return categories;
		}

		return categories.filter((option) => option.name.toLowerCase().includes(query));
	}, [categories, categoryQuery]);

	const detectedPlatform = detectPlatform(socialUrl.trim());

	useEffect(() => {
		if (detectedPlatform) {
			return;
		}

		const interval = setInterval(() => {
			setPlatformCycleIndex((current) => (current + 1) % SOCIAL_PLATFORMS.length);
		}, 2000);

		return () => clearInterval(interval);
	}, [detectedPlatform]);

	useEffect(() => {
		const bidAmountCents = clampBid(bid) * 100;
		let cancelled = false;

		const timer = setTimeout(() => {
			void estimateSignupRankAction({
				bidAmountCents,
				categoryId: category?.id,
			}).then((result) => {
				if (cancelled) {
					return;
				}

				setClaimRank(result.generalRank);
				setCategoryRank(result.categoryRank);
				onRankChange?.(result.generalRank);
			});
		}, 200);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [bid, category?.id, onRankChange]);

	useEffect(() => {
		let focusTimer = 0;

		const applyRequestedBid = (event: Event) => {
			const dollars = (event as CustomEvent<TakeSpotDetail>).detail?.dollars;

			if (typeof dollars !== "number" || Number.isNaN(dollars)) {
				return;
			}

			const next = clampBid(dollars);
			setBid(next);
			setBidInput(String(next));
			setErrors((current) => ({ ...current, bid: undefined }));
			formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
			window.clearTimeout(focusTimer);
			focusTimer = window.setTimeout(() => {
				bidInputRef.current?.focus();
				bidInputRef.current?.select();
			}, 400);
		};

		window.addEventListener(TAKE_SPOT_EVENT, applyRequestedBid);

		return () => {
			window.clearTimeout(focusTimer);
			window.removeEventListener(TAKE_SPOT_EVENT, applyRequestedBid);
		};
	}, []);

	const activePlatform = detectedPlatform ?? SOCIAL_PLATFORMS[platformCycleIndex];
	const isPlatformLocked = !!detectedPlatform;

	const decreaseBid = () => {
		setBid((current) => {
			const next = clampBid(current - BID_STEP);
			setBidInput(String(next));
			return next;
		});
		setErrors((current) => ({ ...current, bid: undefined }));
	};

	const increaseBid = () => {
		setBid((current) => {
			const next = clampBid(current + BID_STEP);
			setBidInput(String(next));
			return next;
		});
		setErrors((current) => ({ ...current, bid: undefined }));
	};

	const handleBidChange = (value: string) => {
		setBidInput(value);

		if (value === "") {
			return;
		}

		const parsed = Number(value);

		if (Number.isNaN(parsed)) {
			return;
		}

		setBid(parsed);
		setErrors((current) => ({ ...current, bid: undefined }));
	};

	const handleBidBlur = () => {
		const parsed = bidInput === "" ? MIN_BID : Number(bidInput);
		const next = clampBid(Number.isNaN(parsed) ? MIN_BID : parsed);
		setBid(next);
		setBidInput(String(next));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitted(true);

		const parsed = bidInput === "" ? MIN_BID : Number(bidInput);
		const normalizedBid = clampBid(Number.isNaN(parsed) ? MIN_BID : parsed);
		setBid(normalizedBid);
		setBidInput(String(normalizedBid));

		const nextErrors: FormErrors = {};

		if (normalizedBid < MIN_BID) {
			nextErrors.bid = `Minimum bid is $${MIN_BID}.`;
		}

		if (!socialUrl.trim()) {
			nextErrors.socialUrl = "Social profile URL is required.";
		} else if (!toHttpsSocialUrl(socialUrl)) {
			nextErrors.socialUrl = "Enter a valid profile URL.";
		}

		if (!category) {
			nextErrors.category = "Select a category.";
		}

		setErrors(nextErrors);

		if (Object.keys(nextErrors).length === 0 && category) {
			const normalizedSocialUrl = toHttpsSocialUrl(socialUrl)!;

			saveSignupDraft({
				primarySocialUrl: normalizedSocialUrl,
				categoryId: category.id,
				categorySlug: category.slug,
				categoryName: category.name,
				bidAmountDollars: normalizedBid,
				bidAmountCents: normalizedBid * 100,
				estimatedGeneralRank: claimRank,
				estimatedCategoryRank: categoryRank,
			});
			router.push("/complete-your-profile");
		}
	};

	return (
		<form
			ref={formRef}
			id="bid-form"
			className={`max-w-200 max-md:max-w-none mx-auto w-full ${
				className ?? "mb-12 mt-10 max-md:mb-0 max-md:mt-8"
			}`}
			onSubmit={handleSubmit}
			noValidate
		>
			<div className="mb-4 max-md:mb-3 flex items-center justify-center">
				<div className="gap-2 max-md:gap-1.5 inline-flex items-center">
					<button
						type="button"
						className={bidControlClass}
						onClick={decreaseBid}
						aria-label="Decrease bid by $1"
					>
						<Minus className="size-5 stroke-[2.5]" aria-hidden />
					</button>

					<div className="min-w-0 gap-0.5 px-1 flex shrink-0 items-center">
						<span className={`${bidAmountClass} w-auto`} aria-hidden>
							$
						</span>
						<input
							ref={bidInputRef}
							id="bid-amount"
							type="number"
							className={`${bidAmountClass} w-[var(--bid-ch)] text-center`}
							style={
								{
									"--bid-ch": `${Math.max(bidInput.length, 2)}ch`,
								} as CSSProperties
							}
							value={bidInput}
							min={MIN_BID}
							step={BID_STEP}
							inputMode="numeric"
							aria-label="Bid amount in dollars"
							aria-invalid={submitted && !!errors.bid}
							onChange={(event) => handleBidChange(event.target.value)}
							onBlur={handleBidBlur}
						/>
					</div>

					<button
						type="button"
						className={bidControlClass}
						onClick={increaseBid}
						aria-label="Increase bid by $1"
					>
						<Plus className="size-5 stroke-[2.5]" aria-hidden />
					</button>
				</div>
			</div>
			{submitted && errors.bid && (
				<p className="-mt-2 mb-4 text-small text-primary3 text-center">{errors.bid}</p>
			)}

			<div className="gap-3 max-lg:flex-col max-md:w-full flex items-stretch">
				<div className="min-w-0 max-lg:w-full flex-1">
					<div className="relative">
						<div className="left-4 pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center">
							<SocialPlatformIcon
								key={activePlatform}
								platform={activePlatform}
								className={`size-5 shrink-0 ${isPlatformLocked ? "" : "text-t-secondary"}`}
								colored={isPlatformLocked}
							/>
						</div>
						<input
							type="text"
							inputMode="url"
							autoComplete="url"
							className={`liquid-glass-field h-12 px-6.5 pl-13 font-medium text-t-primary placeholder:text-t-secondary max-md:text-[1rem] relative z-0 w-full rounded-3xl text-input ${
								submitted && errors.socialUrl ? "border-primary3!" : ""
							}`}
							value={socialUrl}
							placeholder="Paste your main social profile link"
							aria-label="Social profile URL"
							aria-invalid={submitted && !!errors.socialUrl}
							onChange={(event) => {
								setSocialUrl(event.target.value);
								setErrors((current) => ({
									...current,
									socialUrl: undefined,
								}));
							}}
						/>
					</div>
					<p className="mt-2 text-small text-t-secondary text-left">
						You can add more social networks in the next step.
					</p>
					{submitted && errors.socialUrl && (
						<p className="mt-2 text-small text-primary3">{errors.socialUrl}</p>
					)}
				</div>

				<div className="w-54 max-lg:w-full relative shrink-0">
					<Listbox
						as="div"
						className="relative"
						value={category}
						by="id"
						onChange={(value) => {
							setCategory(value);
							setCategoryQuery("");
							setErrors((current) => ({
								...current,
								category: undefined,
							}));
						}}
					>
						<ListboxButton
							className={`liquid-glass-field group h-12 pl-4 pr-2.5 text-button data-hover:text-t-primary data-open:text-t-primary flex w-full items-center justify-between rounded-3xl text-left ${
								category ? "text-t-primary" : "text-t-secondary"
							} ${submitted && errors.category ? "border-primary3!" : ""}`}
							aria-label="Category"
							aria-invalid={submitted && !!errors.category}
						>
							<span className="min-w-0 gap-2 flex items-center truncate">
								{category ? (
									<>
										{(() => {
											const CategoryIcon = getCategoryUi(category.slug).icon;
											return <CategoryIcon className="size-4 shrink-0 stroke-2" aria-hidden />;
										})()}
										<span className="truncate">{category.name}</span>
									</>
								) : (
									"Select a category"
								)}
							</span>
							<Icon
								className="ml-1 fill-t-secondary group-data-hover:fill-t-primary group-data-open:fill-t-primary shrink-0 transition-all group-data-open:rotate-180"
								name="chevron"
							/>
						</ListboxButton>
						<ListboxOptions
							className="liquid-glass-field p-2.5 ease-out z-100 w-(--button-width) origin-top rounded-3xl transition duration-200 outline-none [--anchor-gap:0.25rem] data-closed:scale-95 data-closed:opacity-0"
							anchor={{ to: "bottom start", gap: "0.25rem" }}
							transition
							modal={false}
						>
							<div className="mb-2 relative">
								<Search
									className="left-3 size-4 text-t-tertiary pointer-events-none absolute top-1/2 -translate-y-1/2 stroke-2"
									aria-hidden
								/>
								<input
									type="search"
									value={categoryQuery}
									onChange={(event) => setCategoryQuery(event.target.value)}
									onClick={(event) => event.stopPropagation()}
									onKeyDown={(event) => event.stopPropagation()}
									className="h-10 bg-b-highlight px-3 pl-9 font-medium text-t-primary placeholder:text-t-secondary w-full rounded-full border-0 text-input outline-none"
									placeholder="Search category.."
									aria-label="Search category"
								/>
							</div>
							<div className="max-h-60 overflow-auto">
								{filteredCategories.length > 0 ? (
									filteredCategories.map((option) => {
										const CategoryIcon = getCategoryUi(option.slug).icon;

										return (
											<ListboxOption
												key={option.id}
												className="gap-3 py-2 pl-2.5 pr-6 text-button text-t-secondary after:right-2.5 after:top-3.5 after:size-2 after:bg-t-blue data-focus:bg-b-highlight data-focus:text-t-primary data-selected:text-t-primary relative flex w-full cursor-pointer items-center rounded-full text-left transition-colors after:absolute after:rounded-full after:opacity-0 after:transition-opacity data-selected:after:opacity-100"
												value={option}
											>
												<CategoryIcon className="size-4 shrink-0 stroke-2" aria-hidden />
												{option.name}
											</ListboxOption>
										);
									})
								) : (
									<p className="px-2.5 py-2 text-small text-t-tertiary">No category found</p>
								)}
							</div>
						</ListboxOptions>
					</Listbox>
					{category && categoryRank !== null && (
						<p className="mt-2 text-body text-t-secondary text-left">
							You&apos;ll rank{" "}
							<span className="font-bold text-t-primary">#{categoryRank} in this category</span>
						</p>
					)}
					{submitted && errors.category && (
						<p className="mt-2 text-small text-primary3">{errors.category}</p>
					)}
				</div>

				<div className="max-lg:w-full shrink-0">
					<Button className="h-12 max-lg:w-full whitespace-nowrap" isSecondary type="submit">
						Claim #{claimRank}
					</Button>
				</div>
			</div>
			<p className="mt-8 text-body text-t-secondary max-md:mt-6 max-md:text-left">
				Already listed? Use the same social profile to increase your bid — you&apos;ll only pay the
				difference.
			</p>
		</form>
	);
};

export default BidForm;
