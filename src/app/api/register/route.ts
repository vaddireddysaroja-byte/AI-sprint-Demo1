import { NextResponse } from "next/server";

import { jsonValidationError, jsonWithSession, jsonError, jsonServerConfigError } from "@/lib/auth/api-response";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/schemas";
import { assertSessionConfigured, SessionConfigError } from "@/lib/auth/session";
import {
	createUser,
	findUserByEmail,
	findUserByUsername,
} from "@/lib/services/users";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = registerSchema.safeParse(body);

		if (!parsed.success) {
			return jsonValidationError(parsed.error);
		}

		const { username, email, password } = parsed.data;

		await assertSessionConfigured();

		const existingEmail = await findUserByEmail(email);
		if (existingEmail) {
			return jsonError("Email already registered.", 400);
		}

		const existingUsername = await findUserByUsername(username);
		if (existingUsername) {
			return jsonError("Username already taken.", 400);
		}

		const passwordHash = await hashPassword(password);
		const userId = await createUser({ username, email, passwordHash });

		return jsonWithSession(userId, { ok: true, userId });
	} catch (error) {
		if (error instanceof SessionConfigError) {
			return jsonServerConfigError(error);
		}

		console.error("POST /api/register failed:", error);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}
