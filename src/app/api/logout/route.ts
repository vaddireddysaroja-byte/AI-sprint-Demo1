import { jsonClearSession } from "@/lib/auth/api-response";

export async function POST() {
	return jsonClearSession({ ok: true });
}
