import { beforeEach, describe, expect, it, vi } from "vitest";

import type { McqChoiceInput } from "@/lib/services/mcqs";

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: vi.fn(),
}));

import { getDb } from "@/lib/services/users";
import {
	createMcqWithChoices,
	deleteMcq,
	findMcqById,
	listMcqsByUser,
	recordAttempt,
	updateMcqWithChoices,
} from "@/lib/services/mcqs";
import { createInMemoryMcqDb } from "@/lib/services/mcqs.test-helpers";

vi.mock("@/lib/services/users", async () => {
	const actual = await vi.importActual<typeof import("@/lib/services/users")>(
		"@/lib/services/users",
	);
	return {
		...actual,
		getDb: vi.fn(),
	};
});

const sampleChoices: McqChoiceInput[] = [
	{ choiceText: "4", isCorrect: true },
	{ choiceText: "5", isCorrect: false },
];

describe("mcqs service", () => {
	let store: ReturnType<typeof createInMemoryMcqDb>;

	beforeEach(() => {
		vi.clearAllMocks();
		store = createInMemoryMcqDb();
		vi.mocked(getDb).mockResolvedValue(store.db);
	});

	describe("listMcqsByUser", () => {
		it("returns only MCQs owned by the user", async () => {
			await createMcqWithChoices({
				name: "Mine",
				question: "My question?",
				createdBy: 1,
				choices: sampleChoices,
			});
			await createMcqWithChoices({
				name: "Theirs",
				question: "Other question?",
				createdBy: 2,
				choices: sampleChoices,
			});

			const results = await listMcqsByUser(1);

			expect(results).toHaveLength(1);
			expect(results[0]?.name).toBe("Mine");
			expect(results[0]?.question).toBe("My question?");
		});

		it("returns an empty array when the user has no MCQs", async () => {
			await expect(listMcqsByUser(99)).resolves.toEqual([]);
		});
	});

	describe("findMcqById", () => {
		it("returns an MCQ with ordered choices for the owner", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Math",
				question: "What is 2+2?",
				createdBy: 1,
				choices: sampleChoices,
			});

			const mcq = await findMcqById(mcqId, 1);

			expect(mcq).not.toBeNull();
			expect(mcq?.name).toBe("Math");
			expect(mcq?.choices).toHaveLength(2);
			expect(mcq?.choices[0]?.choice_text).toBe("4");
			expect(mcq?.choices[0]?.is_correct).toBe(1);
			expect(mcq?.choices[1]?.choice_text).toBe("5");
		});

		it("returns null when the MCQ belongs to another user", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Private",
				question: "Secret?",
				createdBy: 1,
				choices: sampleChoices,
			});

			await expect(findMcqById(mcqId, 2)).resolves.toBeNull();
		});

		it("returns null when the MCQ does not exist", async () => {
			await expect(findMcqById(999, 1)).resolves.toBeNull();
		});
	});

	describe("createMcqWithChoices", () => {
		it("creates an MCQ and its choices", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Science",
				question: "What planet is closest to the Sun?",
				createdBy: 1,
				choices: [
					{ choiceText: "Mercury", isCorrect: true },
					{ choiceText: "Venus", isCorrect: false },
				],
			});

			expect(mcqId).toBeGreaterThan(0);
			expect(store.mcqs).toHaveLength(1);
			expect(store.choices).toHaveLength(2);
			expect(store.mcqs[0]?.created_by).toBe(1);
		});
	});

	describe("updateMcqWithChoices", () => {
		it("updates the MCQ and replaces its choices", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Old name",
				question: "Old question?",
				createdBy: 1,
				choices: sampleChoices,
			});

			const updated = await updateMcqWithChoices(mcqId, 1, {
				name: "New name",
				question: "New question?",
				choices: [
					{ choiceText: "Yes", isCorrect: false },
					{ choiceText: "No", isCorrect: true },
					{ choiceText: "Maybe", isCorrect: false },
				],
			});

			expect(updated).toBe(true);

			const mcq = await findMcqById(mcqId, 1);
			expect(mcq?.name).toBe("New name");
			expect(mcq?.question).toBe("New question?");
			expect(mcq?.choices).toHaveLength(3);
			expect(mcq?.choices.map((choice) => choice.choice_text)).toEqual([
				"Yes",
				"No",
				"Maybe",
			]);
		});

		it("returns false when the MCQ belongs to another user", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Owned",
				question: "Question?",
				createdBy: 1,
				choices: sampleChoices,
			});

			await expect(
				updateMcqWithChoices(mcqId, 2, {
					name: "Hijacked",
					question: "Nope",
					choices: sampleChoices,
				}),
			).resolves.toBe(false);
		});
	});

	describe("deleteMcq", () => {
		it("deletes the MCQ, its choices, and its attempts", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Delete me",
				question: "Gone?",
				createdBy: 1,
				choices: sampleChoices,
			});
			const mcq = await findMcqById(mcqId, 1);
			const correctChoiceId = mcq?.choices.find((choice) => choice.is_correct === 1)?.id;
			expect(correctChoiceId).toBeDefined();

			await recordAttempt(mcqId, 1, correctChoiceId!);
			expect(store.attempts).toHaveLength(1);

			const deleted = await deleteMcq(mcqId, 1);

			expect(deleted).toBe(true);
			expect(store.mcqs).toHaveLength(0);
			expect(store.choices).toHaveLength(0);
			expect(store.attempts).toHaveLength(0);
		});

		it("returns false when the MCQ belongs to another user", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Protected",
				question: "Stay?",
				createdBy: 1,
				choices: sampleChoices,
			});

			await expect(deleteMcq(mcqId, 2)).resolves.toBe(false);
			expect(store.mcqs).toHaveLength(1);
		});
	});

	describe("recordAttempt", () => {
		it("records a correct attempt when the selected choice is correct", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Attempt",
				question: "Pick one",
				createdBy: 1,
				choices: sampleChoices,
			});
			const mcq = await findMcqById(mcqId, 1);
			const correctChoiceId = mcq?.choices.find((choice) => choice.is_correct === 1)?.id;

			const result = await recordAttempt(mcqId, 1, correctChoiceId!);

			expect(result).toEqual({ id: expect.any(Number), isCorrect: true });
			expect(store.attempts).toHaveLength(1);
			expect(store.attempts[0]?.is_correct).toBe(1);
		});

		it("records an incorrect attempt when the selected choice is wrong", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Attempt",
				question: "Pick one",
				createdBy: 1,
				choices: sampleChoices,
			});
			const mcq = await findMcqById(mcqId, 1);
			const wrongChoiceId = mcq?.choices.find((choice) => choice.is_correct === 0)?.id;

			const result = await recordAttempt(mcqId, 1, wrongChoiceId!);

			expect(result).toEqual({ id: expect.any(Number), isCorrect: false });
			expect(store.attempts[0]?.is_correct).toBe(0);
		});

		it("returns null when the choice does not belong to the MCQ", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Attempt",
				question: "Pick one",
				createdBy: 1,
				choices: sampleChoices,
			});
			const otherMcqId = await createMcqWithChoices({
				name: "Other",
				question: "Other?",
				createdBy: 1,
				choices: sampleChoices,
			});
			const otherMcq = await findMcqById(otherMcqId, 1);
			const foreignChoiceId = otherMcq?.choices[0]?.id;

			await expect(recordAttempt(mcqId, 1, foreignChoiceId!)).resolves.toBeNull();
			expect(store.attempts).toHaveLength(0);
		});

		it("returns null when the MCQ belongs to another user", async () => {
			const mcqId = await createMcqWithChoices({
				name: "Private attempt",
				question: "Nope",
				createdBy: 1,
				choices: sampleChoices,
			});
			const mcq = await findMcqById(mcqId, 1);
			const choiceId = mcq?.choices[0]?.id;

			await expect(recordAttempt(mcqId, 2, choiceId!)).resolves.toBeNull();
		});
	});
});
