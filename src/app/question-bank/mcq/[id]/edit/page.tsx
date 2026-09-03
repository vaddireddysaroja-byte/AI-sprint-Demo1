import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { McqForm } from "@/components/question-bank/mcq-form";
import { McqPageShell } from "@/components/question-bank/mcq-page-shell";
import { getSessionUser } from "@/lib/auth/server-session";
import { toApiMcqDetail } from "@/lib/mcq/serializers";
import { findMcqById } from "@/lib/services/mcqs";

type EditMcqPageProps = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EditMcqPageProps): Promise<Metadata> {
	const { id } = await params;
	return {
		title: `Edit Question ${id}`,
		description: "Edit a multiple choice question.",
	};
}

export default async function EditMcqPage({ params }: EditMcqPageProps) {
	const user = await getSessionUser();

	if (!user) {
		redirect("/");
	}

	const mcqId = Number((await params).id);
	if (!Number.isInteger(mcqId) || mcqId <= 0) {
		notFound();
	}

	const mcq = await findMcqById(mcqId, user.id);
	if (!mcq) {
		notFound();
	}

	const apiMcq = toApiMcqDetail(mcq);

	return (
		<McqPageShell title="Edit question">
			<McqForm
				mode="edit"
				mcqId={mcqId}
				initialValues={{
					name: apiMcq.name,
					question: apiMcq.question,
					choices: apiMcq.choices.map((choice) => ({
						choiceText: choice.choiceText,
						isCorrect: choice.isCorrect,
					})),
				}}
			/>
		</McqPageShell>
	);
}
