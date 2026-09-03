import type { McqChoiceRecord, McqListItem, McqWithChoices } from "@/lib/services/mcqs";

export type ApiMcqListItem = {
	id: number;
	name: string;
	question: string;
	createdAt: string;
	updatedAt: string;
};

export type ApiMcqChoice = {
	id: number;
	choiceText: string;
	isCorrect: boolean;
	sortOrder: number;
};

export type ApiMcqDetail = {
	id: number;
	name: string;
	question: string;
	createdAt: string;
	updatedAt: string;
	choices: ApiMcqChoice[];
};

export function toApiMcqListItem(mcq: McqListItem): ApiMcqListItem {
	return {
		id: mcq.id,
		name: mcq.name,
		question: mcq.question,
		createdAt: mcq.created_at,
		updatedAt: mcq.updated_at,
	};
}

export function toApiMcqChoice(choice: McqChoiceRecord): ApiMcqChoice {
	return {
		id: choice.id,
		choiceText: choice.choice_text,
		isCorrect: choice.is_correct === 1,
		sortOrder: choice.sort_order,
	};
}

export function toApiMcqDetail(mcq: McqWithChoices): ApiMcqDetail {
	return {
		id: mcq.id,
		name: mcq.name,
		question: mcq.question,
		createdAt: mcq.created_at,
		updatedAt: mcq.updated_at,
		choices: mcq.choices.map(toApiMcqChoice),
	};
}
