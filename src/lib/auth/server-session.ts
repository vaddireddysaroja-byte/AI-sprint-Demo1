import { cookies } from "next/headers";

import { readSessionUserId, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { findUserById, toPublicUser, type PublicUser } from "@/lib/services/users";

export async function getSessionUser(): Promise<PublicUser | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
	const userId = await readSessionUserId(token);

	if (!userId) {
		return null;
	}

	const user = await findUserById(userId);
	if (!user) {
		return null;
	}

	return toPublicUser(user);
}
