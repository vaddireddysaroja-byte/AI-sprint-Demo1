import type { Metadata } from "next";

import { QuestionBankLanding } from "@/components/question-bank/question-bank-landing";

export const metadata: Metadata = {
	title: "Question Bank",
	description: "Browse and manage your question bank.",
};

export default function QuestionBankPage() {
	return <QuestionBankLanding />;
}
