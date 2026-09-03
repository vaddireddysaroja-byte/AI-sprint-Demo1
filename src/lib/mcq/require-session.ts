import { jsonError } from "@/lib/auth/api-response";
import { getSessionUser } from "@/lib/auth/server-session";
import type { PublicUser } from "@/lib/services/users";

type SessionResult =
	| { user: PublicUser; errorResponse: null }
	| { user: null; errorResponse: Response };

export async function requireSessionUser(): Promise<SessionResult> {
	const user = await getSessionUser();

	if (!user) {
		return {
			user: null,
			errorResponse: jsonError("You are not signed in.", 401),
		};
	}

	return { user, errorResponse: null };
}

export function parseMcqId(rawId: string): number | null {
	const id = Number(rawId);
	if (!Number.isInteger(id) || id <= 0) {
		return null;
	}

	return id;
}
