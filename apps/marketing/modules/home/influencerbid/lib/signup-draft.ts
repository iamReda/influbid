export const SIGNUP_DRAFT_KEY = "influencerbid:signup-draft:v1";

export type SignupDraft = {
	primarySocialUrl: string;
	categoryId: string;
	categorySlug: string;
	categoryName: string;
	bidAmountDollars: number;
	bidAmountCents: number;
	estimatedGeneralRank: number;
	estimatedCategoryRank: number | null;
};

export function saveSignupDraft(draft: SignupDraft) {
	if (typeof window === "undefined") {
		return;
	}

	sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
}

export function loadSignupDraft(): SignupDraft | null {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = sessionStorage.getItem(SIGNUP_DRAFT_KEY);
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as SignupDraft;
		if (
			!parsed?.primarySocialUrl ||
			!parsed.categoryId ||
			!parsed.categorySlug ||
			typeof parsed.bidAmountCents !== "number"
		) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

export function clearSignupDraft() {
	if (typeof window === "undefined") {
		return;
	}

	sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
}
