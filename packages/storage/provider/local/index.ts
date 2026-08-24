import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { logger } from "@repo/logs";

import { config } from "../../config";
import type {
	GetSignedUploadUrlHandler,
	GetSignedUrlHander,
	StorageBucketNamesConfig,
} from "../../types";

const UPLOAD_TTL_SECONDS = 60;

const getSigningSecret = () =>
	process.env.STORAGE_SIGNING_SECRET ||
	process.env.BETTER_AUTH_SECRET ||
	"local-dev-storage-secret";

const getSaasBaseUrl = () =>
	(process.env.NEXT_PUBLIC_SAAS_URL || "http://localhost:3000").replace(/\/$/, "");

export const getLocalStorageRoot = () => {
	if (process.env.STORAGE_LOCAL_PATH) {
		return path.resolve(process.env.STORAGE_LOCAL_PATH);
	}

	return path.resolve(process.cwd(), ".local-storage");
};

const resolveBucketName = (bucket: keyof StorageBucketNamesConfig) => {
	const bucketName = config.bucketNames[bucket];
	if (!bucketName) {
		throw new Error("Invalid bucket");
	}
	return bucketName;
};

export const assertSafeStoragePath = (filePath: string) => {
	if (!filePath || filePath.includes("..") || filePath.includes("/") || filePath.includes("\\")) {
		throw new Error("Invalid storage path");
	}
};

const getObjectFilePath = (filePath: string, bucket: keyof StorageBucketNamesConfig) => {
	assertSafeStoragePath(filePath);
	const bucketName = resolveBucketName(bucket);
	return path.join(getLocalStorageRoot(), bucketName, filePath);
};

const createSignature = (payload: string) =>
	createHmac("sha256", getSigningSecret()).update(payload).digest("hex");

const signaturesMatch = (expected: string, actual: string) => {
	const expectedBuffer = Buffer.from(expected);
	const actualBuffer = Buffer.from(actual);
	if (expectedBuffer.length !== actualBuffer.length) {
		return false;
	}
	return timingSafeEqual(expectedBuffer, actualBuffer);
};

export const createLocalUploadSignature = ({
	bucket,
	filePath,
	expiresAt,
}: {
	bucket: string;
	filePath: string;
	expiresAt: number;
}) => createSignature(`${bucket}:${filePath}:${expiresAt}`);

export const verifyLocalUploadSignature = ({
	bucket,
	filePath,
	expiresAt,
	signature,
}: {
	bucket: string;
	filePath: string;
	expiresAt: number;
	signature: string;
}) => {
	if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
		return false;
	}

	const expected = createLocalUploadSignature({ bucket, filePath, expiresAt });
	return signaturesMatch(expected, signature);
};

export const writeLocalObject = async (
	filePath: string,
	body: Buffer,
	options: { bucket: keyof StorageBucketNamesConfig },
) => {
	const absolutePath = getObjectFilePath(filePath, options.bucket);
	await mkdir(path.dirname(absolutePath), { recursive: true });
	await writeFile(absolutePath, body);
};

export const readLocalObject = async (
	filePath: string,
	options: { bucket: keyof StorageBucketNamesConfig },
) => {
	const absolutePath = getObjectFilePath(filePath, options.bucket);
	const body = await readFile(absolutePath);
	const extension = path.extname(filePath).toLowerCase();
	const contentType =
		extension === ".jpg" || extension === ".jpeg"
			? "image/jpeg"
			: extension === ".webp"
				? "image/webp"
				: extension === ".gif"
					? "image/gif"
					: "image/png";

	return { body, contentType };
};

export const getSignedUploadUrl: GetSignedUploadUrlHandler = async (filePath, { bucket }) => {
	assertSafeStoragePath(filePath);
	const bucketName = resolveBucketName(bucket);
	const expiresAt = Date.now() + UPLOAD_TTL_SECONDS * 1000;
	const signature = createLocalUploadSignature({
		bucket: bucketName,
		filePath,
		expiresAt,
	});

	const url = new URL(
		`/api/storage/upload/${bucketName}/${encodeURIComponent(filePath)}`,
		getSaasBaseUrl(),
	);
	url.searchParams.set("expires", String(expiresAt));
	url.searchParams.set("sig", signature);

	return url.toString();
};

export const getSignedUrl: GetSignedUrlHander = async (filePath, { bucket }) => {
	assertSafeStoragePath(filePath);
	const bucketName = resolveBucketName(bucket);
	return `${getSaasBaseUrl()}/image-proxy/${bucketName}/${encodeURIComponent(filePath)}`;
};

export const handleLocalUpload = async ({
	bucketName,
	filePath,
	expiresAt,
	signature,
	body,
}: {
	bucketName: string;
	filePath: string;
	expiresAt: number;
	signature: string;
	body: Buffer;
}) => {
	const knownBucket = Object.entries(config.bucketNames).find(
		([, name]) => name === bucketName,
	)?.[0] as keyof StorageBucketNamesConfig | undefined;

	if (!knownBucket) {
		throw new Error("Invalid bucket");
	}

	if (
		!verifyLocalUploadSignature({
			bucket: bucketName,
			filePath,
			expiresAt,
			signature,
		})
	) {
		throw new Error("Invalid or expired upload signature");
	}

	try {
		await writeLocalObject(filePath, body, { bucket: knownBucket });
	} catch (error) {
		logger.error(error);
		throw new Error("Could not write local object");
	}
};
