"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createMcq, updateMcq } from "@/lib/mcq-client";
import { mcqWriteSchema } from "@/lib/mcq/schemas";
import { cn } from "@/lib/utils";

type ChoiceRow = {
	id: string;
	choiceText: string;
	isCorrect: boolean;
};

type McqFormProps = {
	mode: "create" | "edit";
	mcqId?: number;
	initialValues?: {
		name: string;
		question: string;
		choices: Array<{ choiceText: string; isCorrect: boolean }>;
	};
};

function createChoiceRow(choiceText = "", isCorrect = false): ChoiceRow {
	return {
		id: crypto.randomUUID(),
		choiceText,
		isCorrect,
	};
}

function createDefaultChoices(): ChoiceRow[] {
	return [createChoiceRow("", true), createChoiceRow("", false)];
}

function choicesFromInitial(
	choices: Array<{ choiceText: string; isCorrect: boolean }>,
): ChoiceRow[] {
	return choices.map((choice) => createChoiceRow(choice.choiceText, choice.isCorrect));
}

const textareaClassName = cn(
	"w-full min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none",
	"placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
	"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
);

export function McqForm({ mode, mcqId, initialValues }: McqFormProps) {
	const router = useRouter();
	const [name, setName] = useState(initialValues?.name ?? "");
	const [question, setQuestion] = useState(initialValues?.question ?? "");
	const [choices, setChoices] = useState<ChoiceRow[]>(() =>
		initialValues ? choicesFromInitial(initialValues.choices) : createDefaultChoices(),
	);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [isSaving, setIsSaving] = useState(false);

	function setCorrectChoice(choiceId: string) {
		setChoices((current) =>
			current.map((choice) => ({
				...choice,
				isCorrect: choice.id === choiceId,
			})),
		);
	}

	function updateChoiceText(choiceId: string, choiceText: string) {
		setChoices((current) =>
			current.map((choice) =>
				choice.id === choiceId ? { ...choice, choiceText } : choice,
			),
		);
	}

	function removeChoice(choiceId: string) {
		if (choices.length <= 2) {
			return;
		}

		setChoices((current) => {
			const next = current.filter((choice) => choice.id !== choiceId);
			if (!next.some((choice) => choice.isCorrect) && next[0]) {
				next[0] = { ...next[0], isCorrect: true };
			}
			return next;
		});
	}

	function addChoice() {
		if (choices.length >= 6) {
			return;
		}

		setChoices((current) => [...current, createChoiceRow()]);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);
		setFieldErrors({});

		const payload = {
			name,
			question,
			choices: choices.map(({ choiceText, isCorrect }) => ({ choiceText, isCorrect })),
		};

		const parsed = mcqWriteSchema.safeParse(payload);
		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const key = issue.path.join(".") || "form";
				if (!errors[key]) {
					errors[key] = issue.message;
				}
			}
			setFieldErrors(errors);
			setFormError(errors.form ?? errors.choices ?? "Please fix the errors below.");
			return;
		}

		setIsSaving(true);

		const result =
			mode === "create"
				? await createMcq(parsed.data)
				: await updateMcq(mcqId!, parsed.data);

		setIsSaving(false);

		if (!result.ok) {
			setFormError(result.error);
			return;
		}

		router.push("/question-bank");
		router.refresh();
	}

	return (
		<form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6">
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="mcq-name">Name</FieldLabel>
					<Input
						id="mcq-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="e.g. Photosynthesis basics"
						aria-invalid={Boolean(fieldErrors.name)}
					/>
					{fieldErrors.name ? <FieldError errors={[{ message: fieldErrors.name }]} /> : null}
				</Field>

				<Field>
					<FieldLabel htmlFor="mcq-question">Question</FieldLabel>
					<textarea
						id="mcq-question"
						className={textareaClassName}
						value={question}
						onChange={(event) => setQuestion(event.target.value)}
						placeholder="Enter the full question prompt"
						aria-invalid={Boolean(fieldErrors.question)}
					/>
					{fieldErrors.question ? (
						<FieldError errors={[{ message: fieldErrors.question }]} />
					) : null}
				</Field>

				<FieldSet>
					<FieldLegend>Choices</FieldLegend>
					<FieldDescription>
						Mark one choice as correct. You can add up to six choices.
					</FieldDescription>

					<div className="flex flex-col gap-3">
						{choices.map((choice, index) => (
							<div
								key={choice.id}
								className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
							>
								<label className="flex shrink-0 items-center gap-2 text-sm">
									<input
										type="radio"
										name="correct-choice"
										checked={choice.isCorrect}
										onChange={() => setCorrectChoice(choice.id)}
										className="size-4"
									/>
									<span>Correct</span>
								</label>
								<Input
									value={choice.choiceText}
									onChange={(event) => updateChoiceText(choice.id, event.target.value)}
									placeholder={`Choice ${index + 1}`}
									aria-label={`Choice ${index + 1} text`}
								/>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => removeChoice(choice.id)}
									disabled={choices.length <= 2}
								>
									Remove
								</Button>
							</div>
						))}
					</div>

					{fieldErrors.choices ? (
						<FieldError errors={[{ message: fieldErrors.choices }]} />
					) : null}

					<Button
						type="button"
						variant="outline"
						onClick={addChoice}
						disabled={choices.length >= 6}
						className="w-fit"
					>
						Add choice
					</Button>
				</FieldSet>
			</FieldGroup>

			{formError ? (
				<p className="text-destructive text-sm" role="alert">
					{formError}
				</p>
			) : null}

			<div className="grid grid-cols-2 gap-3">
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => router.push("/question-bank")}
					disabled={isSaving}
				>
					Cancel
				</Button>
				<Button type="submit" className="w-full" disabled={isSaving}>
					{isSaving ? "Saving..." : "Save"}
				</Button>
			</div>
		</form>
	);
}
