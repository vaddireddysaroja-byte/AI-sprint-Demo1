import { getDb } from "@/lib/services/users";

export type McqRecord = {
	id: number;
	name: string;
	question: string;
	created_by: number;
	created_at: string;
	updated_at: string;
};

export type McqListItem = {
	id: number;
	name: string;
	question: string;
	created_at: string;
	updated_at: string;
};

export type McqChoiceRecord = {
	id: number;
	mcq_id: number;
	choice_text: string;
	is_correct: number;
	sort_order: number;
};

export type McqWithChoices = McqRecord & {
	choices: McqChoiceRecord[];
};

export type McqChoiceInput = {
	choiceText: string;
	isCorrect: boolean;
};

export type CreateMcqInput = {
	name: string;
	question: string;
	createdBy: number;
	choices: McqChoiceInput[];
};

export type UpdateMcqInput = {
	name: string;
	question: string;
	choices: McqChoiceInput[];
};

export function normalizeMcqName(name: string): string {
	return name.trim();
}

export function normalizeMcqQuestion(question: string): string {
	return question.trim();
}

export function normalizeChoiceText(choiceText: string): string {
	return choiceText.trim();
}

export async function listMcqsByUser(userId: number): Promise<McqListItem[]> {
	const db = await getDb();
	const result = await db
		.prepare(
			"SELECT id, name, question, created_at, updated_at FROM mcqs WHERE created_by = ?1 ORDER BY updated_at DESC",
		)
		.bind(userId)
		.all<McqListItem>();

	return result.results;
}

export async function findMcqRecordById(id: number): Promise<McqRecord | null> {
	const db = await getDb();
	const result = await db
		.prepare(
			"SELECT id, name, question, created_by, created_at, updated_at FROM mcqs WHERE id = ?1",
		)
		.bind(id)
		.all<McqRecord>();

	return result.results[0] ?? null;
}

async function findChoicesByMcqId(mcqId: number): Promise<McqChoiceRecord[]> {
	const db = await getDb();
	const result = await db
		.prepare(
			"SELECT id, mcq_id, choice_text, is_correct, sort_order FROM mcq_choices WHERE mcq_id = ?1 ORDER BY sort_order ASC",
		)
		.bind(mcqId)
		.all<McqChoiceRecord>();

	return result.results;
}

async function isMcqOwnedByUser(mcqId: number, userId: number): Promise<boolean> {
	const db = await getDb();
	const result = await db
		.prepare("SELECT id FROM mcqs WHERE id = ?1 AND created_by = ?2")
		.bind(mcqId, userId)
		.all<{ id: number }>();

	return Boolean(result.results[0]);
}

async function insertChoices(
	db: D1Database,
	mcqId: number,
	choices: McqChoiceInput[],
): Promise<void> {
	for (const [sortOrder, choice] of choices.entries()) {
		await db
			.prepare(
				"INSERT INTO mcq_choices (mcq_id, choice_text, is_correct, sort_order) VALUES (?1, ?2, ?3, ?4)",
			)
			.bind(
				mcqId,
				normalizeChoiceText(choice.choiceText),
				choice.isCorrect ? 1 : 0,
				sortOrder,
			)
			.run();
	}
}

export async function findMcqById(
	id: number,
	userId: number,
): Promise<McqWithChoices | null> {
	const mcq = await findMcqRecordById(id);
	if (!mcq || mcq.created_by !== userId) {
		return null;
	}

	const choices = await findChoicesByMcqId(id);
	return { ...mcq, choices };
}

export async function createMcqWithChoices(input: CreateMcqInput): Promise<number> {
	const db = await getDb();
	const result = await db
		.prepare(
			"INSERT INTO mcqs (name, question, created_by) VALUES (?1, ?2, ?3) RETURNING id",
		)
		.bind(
			normalizeMcqName(input.name),
			normalizeMcqQuestion(input.question),
			input.createdBy,
		)
		.all<{ id: number }>();

	const mcqId = result.results[0]?.id;
	if (!mcqId) {
		throw new Error("Failed to create MCQ.");
	}

	await insertChoices(db, mcqId, input.choices);
	return mcqId;
}

export async function updateMcqWithChoices(
	id: number,
	userId: number,
	input: UpdateMcqInput,
): Promise<boolean> {
	if (!(await isMcqOwnedByUser(id, userId))) {
		return false;
	}

	const db = await getDb();
	await db
		.prepare(
			"UPDATE mcqs SET name = ?1, question = ?2, updated_at = datetime('now') WHERE id = ?3 AND created_by = ?4",
		)
		.bind(normalizeMcqName(input.name), normalizeMcqQuestion(input.question), id, userId)
		.run();

	await db.prepare("DELETE FROM mcq_choices WHERE mcq_id = ?1").bind(id).run();
	await insertChoices(db, id, input.choices);
	return true;
}

export async function deleteMcq(id: number, userId: number): Promise<boolean> {
	if (!(await isMcqOwnedByUser(id, userId))) {
		return false;
	}

	const db = await getDb();
	await db.prepare("DELETE FROM mcq_attempts WHERE mcq_id = ?1").bind(id).run();
	const result = await db
		.prepare("DELETE FROM mcqs WHERE id = ?1 AND created_by = ?2")
		.bind(id, userId)
		.run();

	return (result.meta?.changes ?? 0) > 0;
}

export async function recordAttempt(
	mcqId: number,
	userId: number,
	choiceId: number,
): Promise<{ id: number; isCorrect: boolean } | null> {
	if (!(await isMcqOwnedByUser(mcqId, userId))) {
		return null;
	}

	const db = await getDb();
	const choiceResult = await db
		.prepare(
			"SELECT id, mcq_id, choice_text, is_correct, sort_order FROM mcq_choices WHERE id = ?1 AND mcq_id = ?2",
		)
		.bind(choiceId, mcqId)
		.all<McqChoiceRecord>();

	const choice = choiceResult.results[0];
	if (!choice) {
		return null;
	}

	const attemptResult = await db
		.prepare(
			"INSERT INTO mcq_attempts (mcq_id, user_id, choice_id, is_correct) VALUES (?1, ?2, ?3, ?4) RETURNING id, is_correct",
		)
		.bind(mcqId, userId, choiceId, choice.is_correct)
		.all<{ id: number; is_correct: number }>();

	const attempt = attemptResult.results[0];
	if (!attempt) {
		throw new Error("Failed to record attempt.");
	}

	return {
		id: attempt.id,
		isCorrect: attempt.is_correct === 1,
	};
}
