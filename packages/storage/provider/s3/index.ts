import path from "node:path";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { logger } from "@repo/logs";

import { config } from "../../config";
import type { StorageBucketNamesConfig } from "../../types";
import type { GetSignedUploadUrlHandler, GetSignedUrlHander } from "../../types";
import {
	assertSafeStoragePath,
	createLocalUploadSignature,
	getSaasBaseUrl,
	verifyLocalUploadSignature,
} from "../local";

let s3Client: S3Client | null = null;

const UPLOAD_TTL_SECONDS = 60;

const getS3Client = () => {
	if (s3Client) {
		return s3Client;
	}

	const s3Endpoint = process.env.S3_ENDPOINT as string;
	if (!s3Endpoint) {
		throw new Error("Missing env variable S3_ENDPOINT");
	}

	const s3Region = (process.env.S3_REGION as string) || "auto";

	const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string;
	if (!s3AccessKeyId) {
		throw new Error("Missing env variable S3_ACCESS_KEY_ID");
	}

	const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string;
	if (!s3SecretAccessKey) {
		throw new Error("Missing env variable S3_SECRET_ACCESS_KEY");
	}

	s3Client = new S3Client({
		region: s3Region,
		endpoint: s3Endpoint,
		forcePathStyle: true,
		credentials: {
			accessKeyId: s3AccessKeyId,
			secretAccessKey: s3SecretAccessKey,
		},
	});

	return s3Client;
};

const resolveBucketName = (bucket: keyof StorageBucketNamesConfig) => {
	const bucketName = config.bucketNames[bucket];
	if (!bucketName) {
		throw new Error("Invalid bucket");
	}
	return bucketName;
};

const guessContentType = (filePath: string) => {
	const extension = path.extname(filePath).toLowerCase();
	if (extension === ".jpg" || extension === ".jpeg") {
		return "image/jpeg";
	}
	if (extension === ".webp") {
		return "image/webp";
	}
	if (extension === ".gif") {
		return "image/gif";
	}
	return "image/png";
};

export const readS3Object = async (
	filePath: string,
	options: { bucket: keyof StorageBucketNamesConfig },
) => {
	assertSafeStoragePath(filePath);
	const bucketName = resolveBucketName(options.bucket);
	const client = getS3Client();
	const response = await client.send(
		new GetObjectCommand({
			Bucket: bucketName,
			Key: filePath,
		}),
	);

	if (!response.Body) {
		throw new Error("Object body is empty");
	}

	const body = Buffer.from(await response.Body.transformToByteArray());
	return {
		body,
		contentType: response.ContentType || guessContentType(filePath),
	};
};

export const writeS3Object = async (
	filePath: string,
	body: Buffer,
	options: { bucket: keyof StorageBucketNamesConfig; contentType?: string },
) => {
	assertSafeStoragePath(filePath);
	const bucketName = resolveBucketName(options.bucket);
	const client = getS3Client();

	await client.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: filePath,
			Body: body,
			ContentType: options.contentType || guessContentType(filePath),
		}),
	);
};

export const handleS3Upload = async ({
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
		await writeS3Object(filePath, body, { bucket: knownBucket });
	} catch (error) {
		logger.error(error);
		throw new Error("Could not write S3 object");
	}
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

export const getSignedUrl: GetSignedUrlHander = async (path, { bucket, expiresIn }) => {
	const bucketName = resolveBucketName(bucket);
	const client = getS3Client();

	try {
		const { getSignedUrl: getS3SignedUrl } = await import("@aws-sdk/s3-request-presigner");
		return getS3SignedUrl(client, new GetObjectCommand({ Bucket: bucketName, Key: path }), {
			expiresIn,
		});
	} catch (error) {
		logger.error(error);
		throw new Error("Could not get signed url");
	}
};
