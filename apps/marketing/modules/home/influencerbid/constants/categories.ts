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

export type InfluencerCategory = {
	id: number;
	name: string;
	slug: string;
	icon: LucideIcon;
	influencerCount: number;
	colors: {
		icon: string;
		bg: string;
		border: string;
	};
};

export const influencerCategories: InfluencerCategory[] = [
	{
		id: 1,
		name: "Fashion",
		slug: "fashion",
		icon: Shirt,
		influencerCount: 842,
		colors: {
			icon: "text-rose-600",
			bg: "bg-rose-500/10",
			border: "border-rose-500/20",
		},
	},
	{
		id: 2,
		name: "Beauty & Cosmetics",
		slug: "beauty-cosmetics",
		icon: Sparkles,
		influencerCount: 1205,
		colors: {
			icon: "text-pink-500",
			bg: "bg-pink-500/10",
			border: "border-pink-500/20",
		},
	},
	{
		id: 3,
		name: "Gaming",
		slug: "gaming",
		icon: Gamepad2,
		influencerCount: 2431,
		colors: {
			icon: "text-violet-600",
			bg: "bg-violet-500/10",
			border: "border-violet-500/20",
		},
	},
	{
		id: 4,
		name: "Fitness",
		slug: "fitness",
		icon: Dumbbell,
		influencerCount: 976,
		colors: {
			icon: "text-orange-500",
			bg: "bg-orange-500/10",
			border: "border-orange-500/20",
		},
	},
	{
		id: 5,
		name: "Travel",
		slug: "travel",
		icon: Plane,
		influencerCount: 654,
		colors: {
			icon: "text-sky-500",
			bg: "bg-sky-500/10",
			border: "border-sky-500/20",
		},
	},
	{
		id: 6,
		name: "Tech",
		slug: "tech",
		icon: Laptop,
		influencerCount: 1108,
		colors: {
			icon: "text-blue-600",
			bg: "bg-blue-500/10",
			border: "border-blue-500/20",
		},
	},
	{
		id: 7,
		name: "Food",
		slug: "food",
		icon: Utensils,
		influencerCount: 523,
		colors: {
			icon: "text-amber-500",
			bg: "bg-amber-500/10",
			border: "border-amber-500/20",
		},
	},
	{
		id: 8,
		name: "Lifestyle",
		slug: "lifestyle",
		icon: Heart,
		influencerCount: 1892,
		colors: {
			icon: "text-fuchsia-500",
			bg: "bg-fuchsia-500/10",
			border: "border-fuchsia-500/20",
		},
	},
	{
		id: 9,
		name: "Business",
		slug: "business",
		icon: Briefcase,
		influencerCount: 445,
		colors: {
			icon: "text-slate-600",
			bg: "bg-slate-500/10",
			border: "border-slate-500/20",
		},
	},
	{
		id: 10,
		name: "Music",
		slug: "music",
		icon: Music,
		influencerCount: 738,
		colors: {
			icon: "text-purple-600",
			bg: "bg-purple-500/10",
			border: "border-purple-500/20",
		},
	},
];

export const formatInfluencerCount = (count: number) =>
	`${count.toLocaleString()} influencer${count === 1 ? "" : "s"}`;
