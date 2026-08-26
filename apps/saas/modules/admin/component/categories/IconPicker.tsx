"use client";

import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { useMemo, useState } from "react";

type IconPickerProps = {
	value: string | null;
	onChange: (icon: string) => void;
	color?: string | null;
};

const POPULAR_ICONS: IconName[] = [
	"shirt",
	"sparkles",
	"gamepad-2",
	"dumbbell",
	"plane",
	"laptop",
	"utensils",
	"heart",
	"briefcase",
	"music",
	"camera",
	"palette",
	"book-open",
	"car",
	"home",
	"star",
	"users",
	"zap",
	"globe",
	"coffee",
];

export function IconPicker({ value, onChange, color }: IconPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const filteredIcons = useMemo(() => {
		const query = search.trim().toLowerCase();
		const names = iconNames as IconName[];
		if (!query) {
			const popularSet = new Set(POPULAR_ICONS);
			return [...POPULAR_ICONS, ...names.filter((name) => !popularSet.has(name))];
		}
		return names.filter((name) => name.includes(query)).slice(0, 200);
	}, [search]);

	const selected = (value as IconName | null) ?? "tag";

	return (
		<>
			<Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
				<span
					className="size-7 flex items-center justify-center rounded-full"
					style={{
						backgroundColor: color ? `${color}22` : undefined,
						color: color ?? undefined,
					}}
				>
					<DynamicIcon name={selected} className="size-4" />
				</span>
				{value ? value : "Choose icon"}
			</Button>
			<Dialog
				open={open}
				onOpenChange={(nextOpen) => {
					setOpen(nextOpen);
					if (!nextOpen) {
						setSearch("");
					}
				}}
			>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>Choose an icon</DialogTitle>
					</DialogHeader>
					<Input
						placeholder="Search icons..."
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<div className="mt-3 max-h-72 gap-2 sm:grid-cols-8 grid grid-cols-6 overflow-y-auto">
						{filteredIcons.map((name) => {
							const isActive = name === value;
							return (
								<button
									key={name}
									type="button"
									title={name}
									className={`size-10 flex items-center justify-center rounded-lg border transition-colors ${
										isActive
											? "border-primary bg-primary/10 text-primary"
											: "border-border hover:bg-accent"
									}`}
									onClick={() => {
										onChange(name);
										setOpen(false);
										setSearch("");
									}}
								>
									<DynamicIcon name={name} className="size-4" />
								</button>
							);
						})}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
