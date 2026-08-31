import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as loginPost } from "@/app/api/login/route";
import { hashPassword } from "@/lib/auth/password";

vi.mock("@/lib/auth/session", () => ({
	assertSessionConfigured: vi.fn(async () => undefined),
	SessionConfigError: class SessionConfigError extends Error {
		name = "SessionConfigError";
	},
}));

vi.mock("@/lib/auth/api-response", async () => {
	const actual = await vi.importActual<typeof import("@/lib/auth/api-response")>(
		"@/lib/auth/api-response",
	);
	return {
		...actual,
		jsonWithSession: vi.fn(async (_userId: number, body: Record<string, unknown>) =>
			Response.json(body, { status: 200 }),
		),
	};
});

vi.mock("@/lib/services/users", () => ({
	findUserByEmail: vi.fn(),
}));

import { findUserByEmail } from "@/lib/services/users";

describe("POST /api/login", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("logs in with valid credentials", async () => {
		const passwordHash = await hashPassword("password123");
		vi.mocked(findUserByEmail).mockResolvedValue({
			id: 7,
			username: "validuser",
			email: "login-user@example.com",
			password_hash: passwordHash,
			created_at: "2026-08-31",
		});

		const request = new Request("http://localhost/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "login-user@example.com",
				password: "password123",
			}),
		});

		const response = await loginPost(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ ok: true });
	});

	it("rejects invalid credentials for wrong password", async () => {
		const passwordHash = await hashPassword("password123");
		vi.mocked(findUserByEmail).mockResolvedValue({
			id: 7,
			username: "validuser",
			email: "login-user@example.com",
			password_hash: passwordHash,
			created_at: "2026-08-31",
		});

		const request = new Request("http://localhost/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "login-user@example.com",
				password: "wrongpassword",
			}),
		});

		const response = await loginPost(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ ok: false, error: "Invalid email or password." });
	});

	it("rejects invalid credentials for unknown email", async () => {
		vi.mocked(findUserByEmail).mockResolvedValue(null);

		const request = new Request("http://localhost/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "missing-user@example.com",
				password: "password123",
			}),
		});

		const response = await loginPost(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ ok: false, error: "Invalid email or password." });
	});
});
