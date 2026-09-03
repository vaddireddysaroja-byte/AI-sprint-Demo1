"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
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
											setFeedback(null);
											setFormError(null);
										}}
										disabled={feedback !== null}
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

				{feedback ? (
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
				) : (
					<Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
						{isSubmitting ? "Submitting..." : "Submit answer"}
					</Button>
				)}
			</form>
		</div>
	);
}
