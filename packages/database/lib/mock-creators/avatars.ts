import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { MockGender } from "./identities";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Cache under packages/database/seed-assets/avatars (gitignored). */
export function getAvatarCacheDir(): string {
	return path.resolve(__dirname, "../../seed-assets/avatars");
}

/**
 * Resolve local storage root for avatar serving.
 * Prefer STORAGE_LOCAL_PATH; otherwise write into apps/saas/.local-storage
 * so the SaaS image-proxy finds files when `pnpm --filter saas dev` runs.
 */
export function resolveLocalStorageRoot(repoRoot: string): string {
	if (process.env.STORAGE_LOCAL_PATH) {
		return path.resolve(process.env.STORAGE_LOCAL_PATH);
	}
	return path.resolve(repoRoot, "apps/saas/.local-storage");
}

export function avatarFilename(index1Based: number): string {
	return `mock-creator-${String(index1Based).padStart(3, "0")}.jpg`;
}

function portraitUrl(gender: MockGender, portraitIndex: number): string {
	const folder = gender === "male" ? "men" : "women";
	// randomuser.me hosts portraits 0–99 for each gender
	const n = ((portraitIndex % 100) + 100) % 100;
	return `https://randomuser.me/api/portraits/${folder}/${n}.jpg`;
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function downloadPortrait(url: string): Promise<Buffer> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download avatar ${url}: HTTP ${response.status}`);
	}
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("image")) {
		throw new Error(`Unexpected content-type for ${url}: ${contentType}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	if (arrayBuffer.byteLength < 1000) {
		throw new Error(`Avatar download too small for ${url}`);
	}
	return Buffer.from(arrayBuffer);
}

/**
 * Ensure gender-matched portraits are cached and copied into local avatar storage.
 * Male names → men portraits; female names → women portraits. Never cross-match.
 */
export async function prepareMockAvatars(options: {
	genders: MockGender[];
	repoRoot: string;
}): Promise<string[]> {
	const cacheDir = getAvatarCacheDir();
	await mkdir(cacheDir, { recursive: true });

	const storageRoot = resolveLocalStorageRoot(options.repoRoot);
	const avatarsBucket = path.join(storageRoot, "avatars");
	await mkdir(avatarsBucket, { recursive: true });

	// Also mirror to repo-root .local-storage for tools that use cwd-relative paths
	const rootStorage = path.resolve(options.repoRoot, ".local-storage/avatars");
	await mkdir(rootStorage, { recursive: true });

	const filenames: string[] = [];
	let malePortraitCursor = 0;
	let femalePortraitCursor = 0;

	for (let i = 0; i < options.genders.length; i++) {
		const gender = options.genders[i]!;
		const filename = avatarFilename(i + 1);
		const cachePath = path.join(cacheDir, filename);
		const storagePath = path.join(avatarsBucket, filename);
		const rootPath = path.join(rootStorage, filename);

		let body: Buffer;
		if (await fileExists(cachePath)) {
			body = await readFile(cachePath);
		} else {
			const portraitIndex = gender === "male" ? malePortraitCursor++ : femalePortraitCursor++;
			const url = portraitUrl(gender, portraitIndex);
			console.info(`Downloading avatar ${filename} (${gender})…`);
			body = await downloadPortrait(url);
			await writeFile(cachePath, body);
		}

		await writeFile(storagePath, body);
		await writeFile(rootPath, body);
		filenames.push(filename);
	}

	return filenames;
}
