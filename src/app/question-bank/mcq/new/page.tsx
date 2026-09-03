import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { McqForm } from "@/components/question-bank/mcq-form";
import { McqPageShell } from "@/components/question-bank/mcq-page-shell";
import { getSessionUser } from "@/lib/auth/server-session";

export const metadata: Metadata = {
	title: "Create Question",
	description: "Create a new multiple choice question.",
};

export default async function NewMcqPage() {
	const user = await getSessionUser();

	if (!user) {
		redirect("/");
	}

	return (
		<McqPageShell title="Create question">
			<McqForm mode="create" />
		</McqPageShell>
	);
}
