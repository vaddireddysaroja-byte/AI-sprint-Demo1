"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { recordMcqAttempt } from "@/lib/mcq-client";
import type { ApiMcqDetail } from "@/lib/mcq/serializers";

type McqPreviewProps = {
	mcq: ApiMcqDetail;
};

export function McqPreview({ mcq }: McqPreviewProps) {
	const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleTryAgain() {
		setSelectedChoiceId(null);
		setFeedback(null);
		setFormError(null);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		if (!selectedChoiceId) {
			setFormError("Select an answer before submitting.");
			return;
		}

		setIsSubmitting(true);

		const result = await recordMcqAttempt(mcq.id, selectedChoiceId);
		setIsSubmitting(false);

		if (!result.ok) {
			setFormError(result.error);
			return;
		}

		setFeedback(result.isCorrect ? "correct" : "incorrect");
	}

	const hasSubmitted = feedback !== null;

	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<p className="text-muted-foreground text-sm font-medium">{mcq.name}</p>
				<p className="text-base">{mcq.question}</p>
			</div>

			<form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
				<FieldSet>
					<FieldLegend>Choose an answer</FieldLegend>
					<FieldGroup>
						{mcq.choices.map((choice) => (
							<Field key={choice.id} orientation="horizontal">
								<label className="flex cursor-pointer items-center gap-3 text-sm">
									<input
										type="radio"
										name="preview-choice"
										value={choice.id}
										checked={selectedChoiceId === choice.id}
										onChange={() => {
											setSelectedChoiceId(choice.id);
											setFormError(null);
										}}
										disabled={hasSubmitted}
										className="size-4"
									/>
									<span>{choice.choiceText}</span>
								</label>
							</Field>
						))}
					</FieldGroup>
				</FieldSet>

				{formError ? (
					<p className="text-destructive text-sm" role="alert">
						{formError}
					</p>
				) : null}

				{hasSubmitted ? (
					<div className="flex flex-col gap-3">
						<p
							className={
								feedback === "correct"
									? "text-sm font-medium"
									: "text-destructive text-sm font-medium"
							}
							role="status"
						>
							{feedback === "correct" ? "Correct!" : "Incorrect."}
						</p>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<Button type="button" variant="outline" onClick={handleTryAgain}>
								Try this question again
							</Button>
							<Link
								href="/question-bank"
								className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 transition-colors"
							>
								Back to Question Bank
							</Link>
						</div>
					</div>
				) : (
					<Button
						type="submit"
						disabled={selectedChoiceId === null || isSubmitting}
						className="w-full sm:w-auto"
					>
						{isSubmitting ? "Submitting..." : "Submit answer"}
					</Button>
				)}
			</form>
		</div>
	);
}
