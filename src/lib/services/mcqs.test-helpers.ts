type McqRow = {
	id: number;
	name: string;
	question: string;
	created_by: number;
	created_at: string;
	updated_at: string;
};

type ChoiceRow = {
	id: number;
	mcq_id: number;
	choice_text: string;
	is_correct: number;
	sort_order: number;
};

type AttemptRow = {
	id: number;
	mcq_id: number;
	user_id: number;
	choice_id: number;
	is_correct: number;
	created_at: string;
};

function normalizeSql(sql: string): string {
	return sql.replace(/\s+/g, " ").trim();
}

export function createInMemoryMcqDb() {
	let mcqIdSeq = 1;
	let choiceIdSeq = 1;
	let attemptIdSeq = 1;
	const mcqs: McqRow[] = [];
	const choices: ChoiceRow[] = [];
	const attempts: AttemptRow[] = [];
	const now = () => new Date().toISOString();

	const db = {
		prepare(sql: string) {
			const query = normalizeSql(sql);

			return {
				bind: (...params: unknown[]) => ({
					all: async <T>() => {
						if (
							query ===
							"SELECT id, name, question, created_at, updated_at FROM mcqs WHERE created_by = ?1 ORDER BY updated_at DESC"
						) {
							const userId = params[0] as number;
							const results = mcqs
								.filter((mcq) => mcq.created_by === userId)
								.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
								.map(({ id, name, question, created_at, updated_at }) => ({
									id,
									name,
									question,
									created_at,
									updated_at,
								}));
							return { results: results as T[] };
						}

						if (
							query ===
							"SELECT id, name, question, created_by, created_at, updated_at FROM mcqs WHERE id = ?1"
						) {
							const id = params[0] as number;
							const mcq = mcqs.find((row) => row.id === id);
							return { results: (mcq ? [mcq] : []) as T[] };
						}

						if (
							query ===
							"SELECT id FROM mcqs WHERE id = ?1 AND created_by = ?2"
						) {
							const [id, userId] = params as [number, number];
							const mcq = mcqs.find(
								(row) => row.id === id && row.created_by === userId,
							);
							return { results: (mcq ? [{ id: mcq.id }] : []) as T[] };
						}

						if (
							query ===
							"SELECT id, mcq_id, choice_text, is_correct, sort_order FROM mcq_choices WHERE mcq_id = ?1 ORDER BY sort_order ASC"
						) {
							const mcqId = params[0] as number;
							const results = choices
								.filter((choice) => choice.mcq_id === mcqId)
								.sort((a, b) => a.sort_order - b.sort_order);
							return { results: results as T[] };
						}

						if (
							query ===
							"SELECT id, mcq_id, choice_text, is_correct, sort_order FROM mcq_choices WHERE id = ?1 AND mcq_id = ?2"
						) {
							const [choiceId, mcqId] = params as [number, number];
							const choice = choices.find(
								(row) => row.id === choiceId && row.mcq_id === mcqId,
							);
							return { results: (choice ? [choice] : []) as T[] };
						}

						if (
							query ===
							"INSERT INTO mcqs (name, question, created_by) VALUES (?1, ?2, ?3) RETURNING id"
						) {
							const [name, question, createdBy] = params as [string, string, number];
							const row: McqRow = {
								id: mcqIdSeq++,
								name,
								question,
								created_by: createdBy,
								created_at: now(),
								updated_at: now(),
							};
							mcqs.push(row);
							return { results: [{ id: row.id }] as T[] };
						}

						if (
							query ===
							"INSERT INTO mcq_attempts (mcq_id, user_id, choice_id, is_correct) VALUES (?1, ?2, ?3, ?4) RETURNING id, is_correct"
						) {
							const [mcqId, userId, choiceId, isCorrect] = params as [
								number,
								number,
								number,
								number,
							];
							const row: AttemptRow = {
								id: attemptIdSeq++,
								mcq_id: mcqId,
								user_id: userId,
								choice_id: choiceId,
								is_correct: isCorrect,
								created_at: now(),
							};
							attempts.push(row);
							return {
								results: [{ id: row.id, is_correct: row.is_correct }] as T[],
							};
						}

						throw new Error(`Unexpected query in test helper: ${query}`);
					},
					run: async () => {
						if (
							query ===
							"INSERT INTO mcq_choices (mcq_id, choice_text, is_correct, sort_order) VALUES (?1, ?2, ?3, ?4)"
						) {
							const [mcqId, choiceText, isCorrect, sortOrder] = params as [
								number,
								string,
								number,
								number,
							];
							choices.push({
								id: choiceIdSeq++,
								mcq_id: mcqId,
								choice_text: choiceText,
								is_correct: isCorrect,
								sort_order: sortOrder,
							});
							return { success: true };
						}

						if (query === "DELETE FROM mcq_choices WHERE mcq_id = ?1") {
							const mcqId = params[0] as number;
							for (let index = choices.length - 1; index >= 0; index -= 1) {
								if (choices[index]?.mcq_id === mcqId) {
									choices.splice(index, 1);
								}
							}
							return { success: true };
						}

						if (query === "DELETE FROM mcq_attempts WHERE mcq_id = ?1") {
							const mcqId = params[0] as number;
							for (let index = attempts.length - 1; index >= 0; index -= 1) {
								if (attempts[index]?.mcq_id === mcqId) {
									attempts.splice(index, 1);
								}
							}
							return { success: true };
						}

						if (
							query ===
							"UPDATE mcqs SET name = ?1, question = ?2, updated_at = datetime('now') WHERE id = ?3 AND created_by = ?4"
						) {
							const [name, question, id, userId] = params as [
								string,
								string,
								number,
								number,
							];
							const mcq = mcqs.find(
								(row) => row.id === id && row.created_by === userId,
							);
							if (mcq) {
								mcq.name = name;
								mcq.question = question;
								mcq.updated_at = now();
							}
							return { success: true, meta: { changes: mcq ? 1 : 0 } };
						}

						if (
							query === "DELETE FROM mcqs WHERE id = ?1 AND created_by = ?2"
						) {
							const [id, userId] = params as [number, number];
							const index = mcqs.findIndex(
								(row) => row.id === id && row.created_by === userId,
							);
							if (index >= 0) {
								mcqs.splice(index, 1);
								for (let choiceIndex = choices.length - 1; choiceIndex >= 0; choiceIndex -= 1) {
									if (choices[choiceIndex]?.mcq_id === id) {
										choices.splice(choiceIndex, 1);
									}
								}
							}
							return { success: true, meta: { changes: index >= 0 ? 1 : 0 } };
						}

						throw new Error(`Unexpected run query in test helper: ${query}`);
					},
				}),
			};
		},
	} as unknown as D1Database;

	return { db, mcqs, choices, attempts };
}
