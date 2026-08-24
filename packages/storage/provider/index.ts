import type { GetSignedUploadUrlHandler, GetSignedUrlHander } from "../types";

const resolveProvider = () => {
	const explicit = process.env.STORAGE_PROVIDER?.toLowerCase();
	if (explicit === "local" || explicit === "s3") {
		return explicit;
	}

	return process.env.S3_ENDPOINT ? "s3" : "local";
};

export const getStorageProvider = () => resolveProvider();

export const isLocalStorageProvider = () => resolveProvider() === "local";

const loadProvider = async () => {
	if (isLocalStorageProvider()) {
		return import("./local");
	}

	return import("./s3");
};

export const getSignedUploadUrl: GetSignedUploadUrlHandler = async (...args) => {
	const provider = await loadProvider();
	return provider.getSignedUploadUrl(...args);
};

export const getSignedUrl: GetSignedUrlHander = async (...args) => {
	const provider = await loadProvider();
	return provider.getSignedUrl(...args);
};

export {
	handleLocalUpload,
	readLocalObject,
	writeLocalObject,
	assertSafeStoragePath,
	getLocalStorageRoot,
} from "./local";
