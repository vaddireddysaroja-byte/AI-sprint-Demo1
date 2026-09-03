import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	DELETE as deleteMcqDelete,
	GET as getMcqGet,
	PUT as updateMcqPut,
} from "@/app/api/mcqs/[id]/route";

vi.mock("@/lib/auth/server-session", () => ({
	getSessionUser: vi.fn(),
}));

vi.mock("@/lib/services/mcqs", () => ({
	findMcqById: vi.fn(),
	findMcqRecordById: vi.fn(),
	updateMcqWithChoices: vi.fn(),
	deleteMcq: vi.fn(),
}));

import { getSessionUser } from "@/lib/auth/server-session";
import {
	deleteMcq,
	findMcqById,
	findMcqRecordById,
	updateMcqWithChoices,
} from "@/lib/services/mcqs";

const sessionUser = {
	id: 1,
	username: "teacher",
	email: "teacher@example.com",
};

const validPayload = {
	name: "Updated",
	question: "Updated question?",
	choices: [
		{ choiceText: "A", isCorrect: true },
		{ choiceText: "B", isCorrect: false },
	],
};

const routeContext = {
	params: Promise.resolve({ id: "5" }),
};

describe("/api/mcqs/[id]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSessionUser).mockResolvedValue(sessionUser);
	});

	describe("GET", () => {
		it("returns an owned MCQ", async () => {
			vi.mocked(findMcqById).mockResolvedValue({
				id: 5,
				name: "Science",
				question: "Pick one",
				created_by: 1,
				created_at: "2026-09-03T10:00:00.000Z",
				updated_at: "2026-09-03T10:00:00.000Z",
				choices: [
					{
						id: 11,
						mcq_id: 5,
						choice_text: "A",
						is_correct: 1,
						sort_order: 0,
					},
				],
			});

			const response = await getMcqGet(new Request("http://localhost/api/mcqs/5"), routeContext);
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body.ok).toBe(true);
			expect(body.mcq.id).toBe(5);
			expect(body.mcq.choices[0]).toEqual({
				id: 11,
				choiceText: "A",
				isCorrect: true,
				sortOrder: 0,
			});
		});

		it("returns 403 for another user's MCQ", async () => {
			vi.mocked(findMcqById).mockResolvedValue(null);
			vi.mocked(findMcqRecordById).mockResolvedValue({
				id: 5,
				name: "Private",
				question: "Secret",
				created_by: 2,
				created_at: "2026-09-03T10:00:00.000Z",
				updated_at: "2026-09-03T10:00:00.000Z",
			});

			const response = await getMcqGet(new Request("http://localhost/api/mcqs/5"), routeContext);
			const body = await response.json();

			expect(response.status).toBe(403);
			expect(body.ok).toBe(false);
		});
	});

	describe("PUT", () => {
		it("updates an owned MCQ", async () => {
			vi.mocked(findMcqRecordById).mockResolvedValue({
				id: 5,
				name: "Science",
				question: "Pick one",
				created_by: 1,
				created_at: "2026-09-03T10:00:00.000Z",
				updated_at: "2026-09-03T10:00:00.000Z",
			});
			vi.mocked(updateMcqWithChoices).mockResolvedValue(true);

			const request = new Request("http://localhost/api/mcqs/5", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			});

			const response = await updateMcqPut(request, routeContext);
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body).toEqual({ ok: true });
		});

		it("returns 403 when updating another user's MCQ", async () => {
			vi.mocked(findMcqRecordById).mockResolvedValue({
				id: 5,
				name: "Science",
				question: "Pick one",
				created_by: 2,
				created_at: "2026-09-03T10:00:00.000Z",
				updated_at: "2026-09-03T10:00:00.000Z",
			});

			const request = new Request("http://localhost/api/mcqs/5", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			});

			const response = await updateMcqPut(request, routeContext);
			const body = await response.json();

			expect(response.status).toBe(403);
			expect(body.ok).toBe(false);
			expect(updateMcqWithChoices).not.toHaveBeenCalled();
		});
	});

	describe("DELETE", () => {
		it("deletes an owned MCQ", async () => {
			vi.mocked(findMcqRecordById).mockResolvedValue({
				id: 5,
				name: "Science",
				question: "Pick one",
				created_by: 1,
				created_at: "2026-09-03T10:00:00.000Z",
				updated_at: "2026-09-03T10:00:00.000Z",
			});
			vi.mocked(deleteMcq).mockResolvedValue(true);

			const response = await deleteMcqDelete(
				new Request("http://localhost/api/mcqs/5", { method: "DELETE" }),
				routeContext,
			);
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body).toEqual({ ok: true });
		});

		it("returns 403 when deleting another user's MCQ", async () => {
			vi.mocked(findMcqRecordById).mockResolvedValue({
				id: 5,
				name: "Science",
				question: "Pick one",
				created_by: 2,
				created_at: "2026-09-03T10:00:00.000Z",
				updated_at: "2026-09-03T10:00:00.000Z",
			});

			const response = await deleteMcqDelete(
				new Request("http://localhost/api/mcqs/5", { method: "DELETE" }),
				routeContext,
			);
			const body = await response.json();

			expect(response.status).toBe(403);
			expect(body.ok).toBe(false);
			expect(deleteMcq).not.toHaveBeenCalled();
		});
	});
});
