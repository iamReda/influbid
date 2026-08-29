import { Resend } from "resend";

import { config } from "../config";
import type { SendEmailHandler } from "../types";

let resendClient: Resend | null = null;

function getResendClient() {
	if (resendClient) {
		return resendClient;
	}

	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("Missing env variable RESEND_API_KEY");
	}

	resendClient = new Resend(apiKey);
	return resendClient;
}

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	cc,
	bcc,
	replyTo,
	html,
	text,
}) => {
	await getResendClient().emails.send({
		from: from ?? config.mailFrom,
		to: [to],
		cc,
		bcc,
		replyTo,
		subject,
		html,
		text,
	});
};
