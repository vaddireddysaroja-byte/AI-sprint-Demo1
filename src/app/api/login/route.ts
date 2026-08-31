import { NextResponse } from "next/server";

import { jsonWithSession, jsonError, jsonServerConfigError } from "@/lib/auth/api-response";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/schemas";
import { assertSessionConfigured, SessionConfigError } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/services/users";

const INVALID_LOGIN_MESSAGE = "Invalid email or password.";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = loginSchema.safeParse(body);

		if (!parsed.success) {
			return jsonError(INVALID_LOGIN_MESSAGE, 400);
		}

		const { email, password } = parsed.data;

		await assertSessionConfigured();

		const user = await findUserByEmail(email);

		if (!user) {
			return jsonError(INVALID_LOGIN_MESSAGE, 400);
		}

		const passwordMatches = await verifyPassword(password, user.password_hash);
		if (!passwordMatches) {
			return jsonError(INVALID_LOGIN_MESSAGE, 400);
		}

		return jsonWithSession(user.id, { ok: true });
	} catch (error) {
		if (error instanceof SessionConfigError) {
			return jsonServerConfigError(error);
		}

		console.error("POST /api/login failed:", error);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}
