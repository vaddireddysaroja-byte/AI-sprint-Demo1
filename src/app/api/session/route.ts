import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readSessionUserId, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { findUserById, toPublicUser } from "@/lib/services/users";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
		const userId = await readSessionUserId(token);

		if (!userId) {
			return NextResponse.json({ ok: false }, { status: 401 });
		}

		const user = await findUserById(userId);
		if (!user) {
			return NextResponse.json({ ok: false }, { status: 401 });
		}

		return NextResponse.json({
			ok: true,
			user: toPublicUser(user),
		});
	} catch (error) {
		console.error("GET /api/session failed:", error);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}
