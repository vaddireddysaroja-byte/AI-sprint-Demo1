import { z } from "zod";

const mcqChoiceSchema = z.object({
	choiceText: z.string().trim().min(1, "Each choice must have text."),
	isCorrect: z.boolean(),
});

export const mcqWriteSchema = z
	.object({
		name: z.string().trim().min(1, "Name is required."),
		question: z.string().trim().min(1, "Question is required."),
		choices: z
			.array(mcqChoiceSchema)
			.min(2, "At least two choices are required.")
			.max(6, "No more than six choices are allowed."),
	})
	.refine((data) => data.choices.filter((choice) => choice.isCorrect).length === 1, {
		message: "Exactly one choice must be marked correct.",
		path: ["choices"],
	});

export const mcqAttemptSchema = z.object({
	choiceId: z.coerce.number().int().positive("A valid choice is required."),
});

export type McqWriteInput = z.infer<typeof mcqWriteSchema>;
export type McqAttemptInput = z.infer<typeof mcqAttemptSchema>;
