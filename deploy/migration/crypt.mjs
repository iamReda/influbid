import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
	timingSafeEqual,
} from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, open, rm, stat, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";

const MAGIC = Buffer.from("INFLUBD1");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + SALT_LENGTH + IV_LENGTH;

function getSecret() {
	const secret = process.env.MIGRATION_ENCRYPTION_KEY;
	if (!secret || secret.length < 32) {
		throw new Error("MIGRATION_ENCRYPTION_KEY must contain at least 32 characters.");
	}
	return secret;
}

async function encrypt(inputPath, outputPath) {
	const salt = randomBytes(SALT_LENGTH);
	const iv = randomBytes(IV_LENGTH);
	const key = scryptSync(getSecret(), salt, 32);
	const cipher = createCipheriv("aes-256-gcm", key, iv);

	await writeFile(outputPath, Buffer.concat([MAGIC, salt, iv]), { mode: 0o600 });
	await pipeline(
		createReadStream(inputPath),
		cipher,
		createWriteStream(outputPath, { flags: "a", mode: 0o600 }),
	);
	await appendFile(outputPath, cipher.getAuthTag());
}

async function decrypt(inputPath, outputPath) {
	const file = await stat(inputPath);
	if (file.size <= HEADER_LENGTH + TAG_LENGTH) {
		throw new Error("Encrypted migration archive is truncated.");
	}

	const handle = await open(inputPath, "r");
	const header = Buffer.alloc(HEADER_LENGTH);
	const tag = Buffer.alloc(TAG_LENGTH);
	try {
		await handle.read(header, 0, HEADER_LENGTH, 0);
		await handle.read(tag, 0, TAG_LENGTH, file.size - TAG_LENGTH);
	} finally {
		await handle.close();
	}

	const magic = header.subarray(0, MAGIC.length);
	if (magic.length !== MAGIC.length || !timingSafeEqual(magic, MAGIC)) {
		throw new Error("Invalid encrypted migration archive.");
	}

	const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_LENGTH);
	const iv = header.subarray(MAGIC.length + SALT_LENGTH, HEADER_LENGTH);
	const key = scryptSync(getSecret(), salt, 32);
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(tag);

	try {
		await pipeline(
			createReadStream(inputPath, {
				start: HEADER_LENGTH,
				end: file.size - TAG_LENGTH - 1,
			}),
			decipher,
			createWriteStream(outputPath, { mode: 0o600 }),
		);
	} catch (error) {
		await rm(outputPath, { force: true });
		throw error;
	}
}

const [operation, inputPath, outputPath] = process.argv.slice(2);
if (!["encrypt", "decrypt"].includes(operation) || !inputPath || !outputPath) {
	throw new Error("Usage: node crypt.mjs <encrypt|decrypt> <input> <output>");
}

if (operation === "encrypt") {
	await encrypt(inputPath, outputPath);
} else {
	await decrypt(inputPath, outputPath);
}
