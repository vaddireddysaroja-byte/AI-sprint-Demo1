import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
	buildClearSessionCookie,
	buildSessionCookie,
	createSessionToken,
	SessionConfigError,
} from "@/lib/auth/session";

export function jsonError(message: string, status: number) {
	return NextResponse.json({ ok: false, error: message }, { status });
}

export function jsonValidationError(error: ZodError) {
	const firstIssue = error.issues[0];
	return jsonError(firstIssue?.message ?? "Invalid request.", 400);
}

export function jsonServerConfigError(error: unknown) {
	if (error instanceof SessionConfigError) {
		return jsonError(
			"Session is not configured. Add SESSION_SECRET to .dev.vars and restart preview.",
			500,
		);
	}

	console.error("Server configuration error:", error);
	return jsonError("Server error.", 500);
}

export async function jsonWithSession(userId: number, body: Record<string, unknown>, status = 200) {
	const token = await createSessionToken(userId);
	const response = NextResponse.json(body, { status });
	response.headers.append("Set-Cookie", buildSessionCookie(token));
	return response;
}

export function jsonClearSession(body: Record<string, unknown>, status = 200) {
	const response = NextResponse.json(body, { status });
	response.headers.append("Set-Cookie", buildClearSessionCookie());
	return response;
}
