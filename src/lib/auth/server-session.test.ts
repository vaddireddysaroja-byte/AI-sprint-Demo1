import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
	cookies: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
	SESSION_COOKIE_NAME: "auth_session",
	readSessionUserId: vi.fn(),
}));

vi.mock("@/lib/services/users", () => ({
	findUserById: vi.fn(),
	toPublicUser: vi.fn((user: { id: number; username: string; email: string }) => ({
		id: user.id,
		username: user.username,
		email: user.email,
	})),
}));

import { cookies } from "next/headers";

import { readSessionUserId } from "@/lib/auth/session";
import { findUserById } from "@/lib/services/users";
import { getSessionUser } from "@/lib/auth/server-session";

describe("getSessionUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when there is no session cookie", async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: vi.fn().mockReturnValue(undefined),
		} as never);
		vi.mocked(readSessionUserId).mockResolvedValue(null);

		await expect(getSessionUser()).resolves.toBeNull();
		expect(readSessionUserId).toHaveBeenCalledWith(undefined);
		expect(findUserById).not.toHaveBeenCalled();
	});

	it("returns null when the session token is invalid", async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: "invalid-token" }),
		} as never);
		vi.mocked(readSessionUserId).mockResolvedValue(null);

		await expect(getSessionUser()).resolves.toBeNull();
		expect(findUserById).not.toHaveBeenCalled();
	});

	it("returns null when the user record no longer exists", async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: "valid-token" }),
		} as never);
		vi.mocked(readSessionUserId).mockResolvedValue(1);
		vi.mocked(findUserById).mockResolvedValue(null);

		await expect(getSessionUser()).resolves.toBeNull();
	});

	it("returns the public user when the session is valid", async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: vi.fn().mockReturnValue({ value: "valid-token" }),
		} as never);
		vi.mocked(readSessionUserId).mockResolvedValue(1);
		vi.mocked(findUserById).mockResolvedValue({
			id: 1,
			username: "chitti2",
			email: "chittik2@gmail.com",
			password_hash: "hash",
			created_at: "2026-08-31T00:00:00.000Z",
		});

		await expect(getSessionUser()).resolves.toEqual({
			id: 1,
			username: "chitti2",
			email: "chittik2@gmail.com",
		});
	});
});
