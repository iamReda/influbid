import {
	assertSafeStoragePath,
	isLocalStorageProvider,
	readLocalObject,
	readS3Object,
} from "@repo/storage";
import { NextResponse } from "next/server";

export const GET = async (_req: Request, { params }: { params: Promise<{ path: string[] }> }) => {
	const { path } = await params;

	const [bucket, ...rest] = path;
	const filePath = rest.map((segment) => decodeURIComponent(segment)).join("/");

	if (!(bucket && filePath)) {
		return new Response("Invalid path", { status: 400 });
	}

	if (bucket !== "avatars" && bucket !== process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME) {
		return new Response("Not found", { status: 404 });
	}

	try {
		assertSafeStoragePath(filePath);
	} catch {
		return new Response("Invalid path", { status: 400 });
	}

	if (isLocalStorageProvider()) {
		try {
			const object = await readLocalObject(filePath, { bucket: "avatars" });
			return new NextResponse(new Uint8Array(object.body), {
				headers: {
					"Content-Type": object.contentType,
					"Cache-Control": "public, max-age=3600",
				},
			});
		} catch {
			return new Response("Not found", { status: 404 });
		}
	}

	try {
		const object = await readS3Object(filePath, { bucket: "avatars" });
		return new NextResponse(new Uint8Array(object.body), {
			headers: {
				"Content-Type": object.contentType,
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch {
		return new Response("Not found", { status: 404 });
	}
};
