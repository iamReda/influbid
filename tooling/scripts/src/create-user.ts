import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import { auth } from "@repo/auth";
import { createUser, createUserAccount, getUserByEmail } from "@repo/database";
import { logger } from "@repo/logs";
import { nanoid } from "nanoid";

function parseArgs(argv: string[]) {
	const args: Record<string, string | boolean> = {};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];

		if (!current?.startsWith("--")) {
			continue;
		}

		const key = current.slice(2);
		const next = argv[index + 1];

		if (!next || next.startsWith("--")) {
			args[key] = true;
			continue;
		}

		args[key] = next;
		index += 1;
	}

	return args;
}

async function ask(question: string, options?: { defaultValue?: string; required?: boolean }) {
	const rl = createInterface({ input, output });

	try {
		const suffix = options?.defaultValue ? ` [${options.defaultValue}]` : "";
		const answer = (await rl.question(`${question}${suffix} `)).trim();

		if (answer) {
			return answer;
		}

		if (options?.defaultValue !== undefined) {
			return options.defaultValue;
		}

		if (options?.required) {
			throw new Error(`${question} is required.`);
		}

		return "";
	} finally {
		rl.close();
	}
}

async function askConfirm(question: string, defaultValue = false) {
	const hint = defaultValue ? "Y/n" : "y/N";
	const answer = (await ask(`${question} (${hint})`)).toLowerCase();

	if (!answer) {
		return defaultValue;
	}

	return answer === "y" || answer === "yes";
}

async function main() {
	const args = parseArgs(process.argv.slice(2));

	logger.info("Let's create a new user for your application!");

	const email =
		(typeof args.email === "string" ? args.email : "") ||
		(await ask("Enter an email:", {
			required: true,
			defaultValue: "admin@example.com",
		}));

	const name =
		(typeof args.name === "string" ? args.name : "") ||
		(await ask("Enter a name:", {
			required: true,
			defaultValue: "Adam Admin",
		}));

	const isAdmin =
		args.admin === true ||
		args.admin === "true" ||
		(args.admin === undefined && args.user === undefined
			? await askConfirm("Should user be an admin?", true)
			: false);

	const passwordInput = (
		(typeof args.password === "string" ? args.password : "") ||
		(await ask("Enter a password (leave blank to auto-generate):"))
	).trim();

	const authContext = await auth.$context;
	const adminPassword = passwordInput || nanoid(16);
	const hashedPassword = await authContext.password.hash(adminPassword);

	const existingUser = await getUserByEmail(email);

	if (existingUser) {
		logger.error("User with this email already exists!");
		return;
	}

	const adminUser = await createUser({
		email,
		name,
		role: isAdmin ? "admin" : "user",
		emailVerified: true,
		onboardingComplete: true,
	});

	if (!adminUser) {
		logger.error("Failed to create user!");
		return;
	}

	await createUserAccount({
		userId: adminUser.id,
		providerId: "credential",
		accountId: adminUser.id,
		hashedPassword,
	});

	logger.success("User created successfully!");
	logger.info(`Email: ${email}`);
	logger.info(`Role: ${isAdmin ? "admin" : "user"}`);

	if (!passwordInput) {
		logger.info(`Password: ${adminPassword}`);
	}
}

main().catch((error) => {
	logger.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
