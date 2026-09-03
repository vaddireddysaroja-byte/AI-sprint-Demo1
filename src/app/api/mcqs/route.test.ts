import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as listMcqsGet, POST as createMcqPost } from "@/app/api/mcqs/route";

vi.mock("@/lib/auth/server-session", () => ({
	getSessionUser: vi.fn(),
}));

vi.mock("@/lib/services/mcqs", () => ({
	listMcqsByUser: vi.fn(),
	createMcqWithChoices: vi.fn(),
}));

import { getSessionUser } from "@/lib/auth/server-session";
import { createMcqWithChoices, listMcqsByUser } from "@/lib/services/mcqs";

const validPayload = {
	name: "Math basics",
	question: "What is 2+2?",
	choices: [
		{ choiceText: "4", isCorrect: true },
		{ choiceText: "5", isCorrect: false },
	],
};

describe("/api/mcqs", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET", () => {
		it("returns MCQs for the signed-in user", async () => {
			vi.mocked(getSessionUser).mockResolvedValue({
				id: 1,
				username: "teacher",
				email: "teacher@example.com",
			});
			vi.mocked(listMcqsByUser).mockResolvedValue([
				{
					id: 10,
					name: "Math basics",
					question: "What is 2+2?",
					created_at: "2026-09-03T10:00:00.000Z",
					updated_at: "2026-09-03T10:00:00.000Z",
				},
			]);

			const response = await listMcqsGet();
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body).toEqual({
				ok: true,
				mcqs: [
					{
						id: 10,
						name: "Math basics",
						question: "What is 2+2?",
						createdAt: "2026-09-03T10:00:00.000Z",
						updatedAt: "2026-09-03T10:00:00.000Z",
					},
				],
			});
		});

		it("returns 401 when unauthenticated", async () => {
			vi.mocked(getSessionUser).mockResolvedValue(null);

			const response = await listMcqsGet();
			const body = await response.json();

			expect(response.status).toBe(401);
			expect(body.ok).toBe(false);
		});
	});

	describe("POST", () => {
		it("creates an MCQ for the signed-in user", async () => {
			vi.mocked(getSessionUser).mockResolvedValue({
				id: 1,
				username: "teacher",
				email: "teacher@example.com",
			});
			vi.mocked(createMcqWithChoices).mockResolvedValue(42);

			const request = new Request("http://localhost/api/mcqs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			});

			const response = await createMcqPost(request);
			const body = await response.json();

			expect(response.status).toBe(201);
			expect(body).toEqual({ ok: true, mcqId: 42 });
			expect(createMcqWithChoices).toHaveBeenCalledWith({
				name: "Math basics",
				question: "What is 2+2?",
				createdBy: 1,
				choices: validPayload.choices,
			});
		});

		it("rejects invalid payloads", async () => {
			vi.mocked(getSessionUser).mockResolvedValue({
				id: 1,
				username: "teacher",
				email: "teacher@example.com",
			});

			const request = new Request("http://localhost/api/mcqs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...validPayload,
					choices: [{ choiceText: "Only one", isCorrect: true }],
				}),
			});

			const response = await createMcqPost(request);
			const body = await response.json();

			expect(response.status).toBe(400);
			expect(body.ok).toBe(false);
			expect(createMcqWithChoices).not.toHaveBeenCalled();
		});

		it("returns 401 when unauthenticated", async () => {
			vi.mocked(getSessionUser).mockResolvedValue(null);

			const request = new Request("http://localhost/api/mcqs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			});

			const response = await createMcqPost(request);
			const body = await response.json();

			expect(response.status).toBe(401);
			expect(body.ok).toBe(false);
		});
	});
});
