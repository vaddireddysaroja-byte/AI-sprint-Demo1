import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { McqPageShell } from "@/components/question-bank/mcq-page-shell";
import { McqPreview } from "@/components/question-bank/mcq-preview";
import { getSessionUser } from "@/lib/auth/server-session";
import { toApiMcqDetail } from "@/lib/mcq/serializers";
import { findMcqById } from "@/lib/services/mcqs";

type PreviewMcqPageProps = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PreviewMcqPageProps): Promise<Metadata> {
	const { id } = await params;
	return {
		title: `Preview Question ${id}`,
		description: "Preview a multiple choice question.",
	};
}

export default async function PreviewMcqPage({ params }: PreviewMcqPageProps) {
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

	return (
		<McqPageShell title="Preview question">
			<McqPreview mcq={toApiMcqDetail(mcq)} />
		</McqPageShell>
	);
}
