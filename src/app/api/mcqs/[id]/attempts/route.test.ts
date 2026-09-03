import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as recordAttemptPost } from "@/app/api/mcqs/[id]/attempts/route";

vi.mock("@/lib/auth/server-session", () => ({
	getSessionUser: vi.fn(),
}));

vi.mock("@/lib/services/mcqs", () => ({
	findMcqRecordById: vi.fn(),
	recordAttempt: vi.fn(),
}));

import { getSessionUser } from "@/lib/auth/server-session";
import { findMcqRecordById, recordAttempt } from "@/lib/services/mcqs";

const routeContext = {
	params: Promise.resolve({ id: "5" }),
};

describe("POST /api/mcqs/[id]/attempts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSessionUser).mockResolvedValue({
			id: 1,
			username: "teacher",
			email: "teacher@example.com",
		});
		vi.mocked(findMcqRecordById).mockResolvedValue({
			id: 5,
			name: "Science",
			question: "Pick one",
			created_by: 1,
			created_at: "2026-09-03T10:00:00.000Z",
			updated_at: "2026-09-03T10:00:00.000Z",
		});
	});

	it("records a correct attempt", async () => {
		vi.mocked(recordAttempt).mockResolvedValue({ id: 99, isCorrect: true });

		const request = new Request("http://localhost/api/mcqs/5/attempts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ choiceId: 11 }),
		});

		const response = await recordAttemptPost(request, routeContext);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body).toEqual({ ok: true, isCorrect: true });
	});

	it("rejects an invalid choice", async () => {
		vi.mocked(recordAttempt).mockResolvedValue(null);

		const request = new Request("http://localhost/api/mcqs/5/attempts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ choiceId: 999 }),
		});

		const response = await recordAttemptPost(request, routeContext);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
	});

	it("returns 403 for another user's MCQ", async () => {
		vi.mocked(findMcqRecordById).mockResolvedValue({
			id: 5,
			name: "Science",
			question: "Pick one",
			created_by: 2,
			created_at: "2026-09-03T10:00:00.000Z",
			updated_at: "2026-09-03T10:00:00.000Z",
		});

		const request = new Request("http://localhost/api/mcqs/5/attempts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ choiceId: 11 }),
		});

		const response = await recordAttemptPost(request, routeContext);
		const body = await response.json();

		expect(response.status).toBe(403);
		expect(body.ok).toBe(false);
	});
});
