/**
 * In-place UPDATE of country/gender/languages on existing @example.com mock creators.
 * Does NOT delete or recreate users, bids, rankings, analytics, or socials.
 *
 * Usage: pnpm --filter @repo/database update:mock-demographics
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

import { mapMockGenderToCreatorGender } from "../lib/mock-creators/demographics";
import { MOCK_IDENTITIES } from "../lib/mock-creators/identities";
import { allocateMockUsernames, mockEmailForUsername } from "../lib/mock-creators/usernames";
import { db } from "../prisma/client";
import { parseCreatorLanguages } from "../prisma/queries/creators";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

loadEnv({ path: path.resolve(repoRoot, ".env.local") });
loadEnv({ path: path.resolve(repoRoot, ".env") });

async function main() {
	const usernames = allocateMockUsernames(MOCK_IDENTITIES.map((i) => i.publicName));
	let updated = 0;
	let missing = 0;

	for (let i = 0; i < MOCK_IDENTITIES.length; i++) {
		const identity = MOCK_IDENTITIES[i]!;
		const username = usernames[i]!;
		const email = mockEmailForUsername(username);

		const user = await db.user.findFirst({
			where: {
				email,
				OR: [{ role: null }, { role: { not: "admin" } }],
			},
			include: { creatorProfile: { select: { id: true } } },
		});

		if (!user?.creatorProfile) {
			missing += 1;
			console.warn(`Missing mock creator for ${email} (${identity.publicName})`);
			continue;
		}

		await db.creatorProfile.update({
			where: { id: user.creatorProfile.id },
			data: {
				countryCode: identity.countryCode,
				gender: mapMockGenderToCreatorGender(identity.gender),
				languages: identity.languages,
			},
		});
		updated += 1;
	}

	const sample = await db.creatorProfile.findMany({
		where: {
			user: {
				email: { endsWith: "@example.com" },
				OR: [{ role: null }, { role: { not: "admin" } }],
			},
		},
		select: {
			publicName: true,
			countryCode: true,
			gender: true,
			languages: true,
		},
		take: 5,
		orderBy: { publicName: "asc" },
	});

	console.info(`Updated demographics on ${updated} mock creators (${missing} missing).`);
	console.info("Sample:");
	for (const row of sample) {
		console.info(
			`  ${row.publicName}: ${row.countryCode} / ${row.gender} / ${parseCreatorLanguages(row.languages).join(",")}`,
		);
	}
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
