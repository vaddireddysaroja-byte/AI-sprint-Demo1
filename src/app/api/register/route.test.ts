import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as registerPost } from "@/app/api/register/route";
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
		jsonWithSession: vi.fn(async (userId: number, body: Record<string, unknown>) =>
			Response.json({ ...body, userId }, { status: 200 }),
		),
	};
});

vi.mock("@/lib/services/users", () => ({
	findUserByEmail: vi.fn(),
	findUserByUsername: vi.fn(),
	createUser: vi.fn(),
	normalizeEmail: (email: string) => email.trim().toLowerCase(),
	normalizeUsername: (username: string) => username.trim(),
}));

import { findUserByEmail, findUserByUsername, createUser } from "@/lib/services/users";

describe("POST /api/register", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("registers with valid input", async () => {
		vi.mocked(findUserByEmail).mockResolvedValue(null);
		vi.mocked(findUserByUsername).mockResolvedValue(null);
		vi.mocked(createUser).mockResolvedValue(42);

		const request = new Request("http://localhost/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "validuser",
				email: "valid-user@example.com",
				password: "password123",
				confirmPassword: "password123",
			}),
		});

		const response = await registerPost(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ ok: true, userId: 42 });
		expect(createUser).toHaveBeenCalledOnce();

		const createArgs = vi.mocked(createUser).mock.calls[0][0];
		expect(createArgs.username).toBe("validuser");
		expect(createArgs.email).toBe("valid-user@example.com");
		expect(createArgs.passwordHash).not.toBe("password123");
		expect(await verifyPassword("password123", createArgs.passwordHash)).toBe(true);
	});

	it("rejects mismatched passwords", async () => {
		const request = new Request("http://localhost/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "validuser",
				email: "valid-user@example.com",
				password: "password123",
				confirmPassword: "different123",
			}),
		});

		const response = await registerPost(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(body.error).toBe("Passwords do not match.");
		expect(createUser).not.toHaveBeenCalled();
	});

	it("rejects duplicate email", async () => {
		vi.mocked(findUserByEmail).mockResolvedValue({
			id: 1,
			username: "existing",
			email: "duplicate@example.com",
			password_hash: "hash",
			created_at: "2026-08-31",
		});
		vi.mocked(findUserByUsername).mockResolvedValue(null);

		const request = new Request("http://localhost/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "newuser",
				email: "duplicate@example.com",
				password: "password123",
				confirmPassword: "password123",
			}),
		});

		const response = await registerPost(request);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(body.error).toBe("Email already registered.");
		expect(createUser).not.toHaveBeenCalled();
	});
});

async function verifyPassword(password: string, storedHash: string) {
	const { verifyPassword: verify } = await import("@/lib/auth/password");
	return verify(password, storedHash);
}
