/** Deterministic mulberry32 PRNG for repeatable mock seeds. */

export function hashSeed(input: string): number {
	let h = 1779033703 ^ input.length;
	for (let i = 0; i < input.length; i++) {
		h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return h >>> 0 || 1;
}

export type Rng = {
	next: () => number;
	int: (minInclusive: number, maxInclusive: number) => number;
	pick: <T>(items: readonly T[]) => T;
	shuffle: <T>(items: readonly T[]) => T[];
	bool: (probabilityTrue?: number) => boolean;
};

export function createRng(seedString: string): Rng {
	let state = hashSeed(seedString);

	const next = () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	const int = (minInclusive: number, maxInclusive: number) => {
		const min = Math.ceil(minInclusive);
		const max = Math.floor(maxInclusive);
		return Math.floor(next() * (max - min + 1)) + min;
	};

	const pick = <T>(items: readonly T[]): T => {
		if (items.length === 0) {
			throw new Error("Cannot pick from empty array");
		}
		return items[int(0, items.length - 1)]!;
	};

	const shuffle = <T>(items: readonly T[]): T[] => {
		const copy = [...items];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = int(0, i);
			[copy[i], copy[j]] = [copy[j]!, copy[i]!];
		}
		return copy;
	};

	const bool = (probabilityTrue = 0.5) => next() < probabilityTrue;

	return { next, int, pick, shuffle, bool };
}

export const MOCK_SEED_KEY = "influbid-mock-creators-v1";
