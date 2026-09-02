import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { QuestionBankLanding } from "@/components/question-bank/question-bank-landing";
import { getSessionUser } from "@/lib/auth/server-session";

export const metadata: Metadata = {
	title: "Question Bank",
	description: "Browse and manage your question bank.",
};

export default async function QuestionBankPage() {
	const user = await getSessionUser();

	if (!user) {
		redirect("/");
	}

	return <QuestionBankLanding username={user.username} />;
}
