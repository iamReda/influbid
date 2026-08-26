"use client";

import { DynamicIcon, type IconName } from "lucide-react/dynamic";

import type { CategoryUiMeta } from "./category-ui";

export function CategoryIcon({ ui, className }: { ui: CategoryUiMeta; className?: string }) {
	if (ui.iconName) {
		return <DynamicIcon name={ui.iconName as IconName} className={className} aria-hidden />;
	}

	const Icon = ui.icon;
	return <Icon className={className} aria-hidden />;
}
