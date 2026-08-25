"use client";

import { useSession } from "@auth/hooks/use-session";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toast";
import { useState, type FormEvent } from "react";

const REPORT_REASONS = [
	{ value: "ADULT_CONTENT", label: "Adult content" },
	{ value: "DRUG_RELATED", label: "Drug-related content" },
	{ value: "ILLEGAL", label: "Illegal content" },
	{ value: "FAKE_OR_IMPERSONATION", label: "Fake account or impersonation" },
	{ value: "OTHER", label: "Other" },
] as const;

type ReasonValue = (typeof REPORT_REASONS)[number]["value"];

type ReportAccountButtonProps = {
	username: string;
	publicName: string;
};

const ReportAccountButton = ({ username, publicName }: ReportAccountButtonProps) => {
	const { user, loaded } = useSession();
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [reporterName, setReporterName] = useState("");
	const [reporterEmail, setReporterEmail] = useState("");
	const [reason, setReason] = useState<ReasonValue | "">("");
	const [message, setMessage] = useState("");

	const isSignedIn = Boolean(user);

	const resetForm = () => {
		setReporterName("");
		setReporterEmail("");
		setReason("");
		setMessage("");
	};

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) {
			resetForm();
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!reason || submitting) {
			return;
		}

		setSubmitting(true);
		try {
			const response = await fetch("/api/creators/report", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username,
					reason,
					message,
					...(isSignedIn
						? {}
						: {
								reporterName: reporterName.trim(),
								reporterEmail: reporterEmail.trim(),
							}),
				}),
			});

			const payload = (await response.json().catch(() => null)) as {
				ok?: boolean;
				error?: string;
			} | null;

			if (!response.ok || !payload?.ok) {
				const error = payload?.error;
				const title =
					error === "cannot_report_own_account"
						? "You can’t report your own account."
						: error === "message_invalid"
							? "Please add a bit more detail (at least 10 characters)."
							: "We couldn’t send your report. Please try again.";
				toast.add({ title, type: "error" });
				return;
			}

			handleOpenChange(false);
			toast.add({
				title: "Report received. We’ll review it as soon as possible.",
				type: "success",
			});
		} catch {
			toast.add({
				title: "We couldn’t send your report. Please try again.",
				type: "error",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<div className="mt-6 flex justify-center">
				<button
					type="button"
					className="text-small text-t-tertiary hover:text-t-primary underline-offset-2 transition-colors hover:underline"
					onClick={() => setOpen(true)}
					disabled={!loaded}
				>
					Report account
				</button>
			</div>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="max-w-md">
					<form onSubmit={handleSubmit} className="gap-4 flex flex-col">
						<DialogHeader>
							<DialogTitle>Report account</DialogTitle>
							<DialogDescription>
								Tell us why you are reporting {publicName}. Our team will review this as soon as
								possible.
							</DialogDescription>
						</DialogHeader>

						{loaded && !isSignedIn && (
							<>
								<div className="gap-2 flex flex-col">
									<Label htmlFor="report-name">Name</Label>
									<Input
										id="report-name"
										value={reporterName}
										onChange={(event) => setReporterName(event.target.value)}
										required
										autoComplete="name"
										placeholder="Your name"
									/>
								</div>
								<div className="gap-2 flex flex-col">
									<Label htmlFor="report-email">Email</Label>
									<Input
										id="report-email"
										type="email"
										value={reporterEmail}
										onChange={(event) => setReporterEmail(event.target.value)}
										required
										autoComplete="email"
										placeholder="you@example.com"
									/>
								</div>
							</>
						)}

						<div className="gap-2 flex flex-col">
							<Label htmlFor="report-reason">Reason</Label>
							<select
								id="report-reason"
								className="h-10 px-3 text-sm w-full rounded-lg border border-input bg-background outline-hidden"
								value={reason}
								onChange={(event) => setReason(event.target.value as ReasonValue)}
								required
							>
								<option value="" disabled>
									Select a reason
								</option>
								{REPORT_REASONS.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</div>

						<div className="gap-2 flex flex-col">
							<Label htmlFor="report-message">Message</Label>
							<Textarea
								id="report-message"
								value={message}
								onChange={(event) => setMessage(event.target.value)}
								required
								minLength={10}
								maxLength={2000}
								rows={4}
								placeholder="Explain what you saw and why it should be reviewed."
							/>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={submitting || !reason || !loaded}>
								{submitting ? "Sending…" : "Report"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ReportAccountButton;
