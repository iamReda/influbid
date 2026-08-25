import {
	Briefcase,
	Dumbbell,
	Gamepad2,
	Heart,
	Laptop,
	Music,
	Plane,
	Shirt,
	Sparkles,
	Utensils,
	type LucideIcon,
} from "lucide-react";

export type CategoryUiMeta = {
	icon: LucideIcon;
	colors: {
		icon: string;
		bg: string;
		border: string;
	};
};

/** Presentation-only mapping keyed by DB category slug. */
export const CATEGORY_UI_BY_SLUG: Record<string, CategoryUiMeta> = {
	fashion: {
		icon: Shirt,
		colors: {
			icon: "text-rose-600",
			bg: "bg-rose-500/10",
			border: "border-rose-500/20",
		},
	},
	"beauty-cosmetics": {
		icon: Sparkles,
		colors: {
			icon: "text-pink-500",
			bg: "bg-pink-500/10",
			border: "border-pink-500/20",
		},
	},
	gaming: {
		icon: Gamepad2,
		colors: {
			icon: "text-violet-600",
			bg: "bg-violet-500/10",
			border: "border-violet-500/20",
		},
	},
	fitness: {
		icon: Dumbbell,
		colors: {
			icon: "text-orange-500",
			bg: "bg-orange-500/10",
			border: "border-orange-500/20",
		},
	},
	travel: {
		icon: Plane,
		colors: {
			icon: "text-sky-500",
			bg: "bg-sky-500/10",
			border: "border-sky-500/20",
		},
	},
	tech: {
		icon: Laptop,
		colors: {
			icon: "text-blue-600",
			bg: "bg-blue-500/10",
			border: "border-blue-500/20",
		},
	},
	food: {
		icon: Utensils,
		colors: {
			icon: "text-amber-500",
			bg: "bg-amber-500/10",
			border: "border-amber-500/20",
		},
	},
	lifestyle: {
		icon: Heart,
		colors: {
			icon: "text-fuchsia-500",
			bg: "bg-fuchsia-500/10",
			border: "border-fuchsia-500/20",
		},
	},
	business: {
		icon: Briefcase,
		colors: {
			icon: "text-slate-600",
			bg: "bg-slate-500/10",
			border: "border-slate-500/20",
		},
	},
	music: {
		icon: Music,
		colors: {
			icon: "text-purple-600",
			bg: "bg-purple-500/10",
			border: "border-purple-500/20",
		},
	},
};

export const fallbackCategoryUi: CategoryUiMeta = {
	icon: Heart,
	colors: {
		icon: "text-t-secondary",
		bg: "bg-b-surface1",
		border: "border-stroke1",
	},
};

export function getCategoryUi(slug: string): CategoryUiMeta {
	return CATEGORY_UI_BY_SLUG[slug] ?? fallbackCategoryUi;
}
