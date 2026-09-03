import { NextResponse } from "next/server";

import { jsonError, jsonValidationError } from "@/lib/auth/api-response";
import { getMcqAccess } from "@/lib/mcq/access";
import { parseMcqId, requireSessionUser } from "@/lib/mcq/require-session";
import { mcqAttemptSchema } from "@/lib/mcq/schemas";
import { findMcqRecordById, recordAttempt } from "@/lib/services/mcqs";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
	try {
		const session = await requireSessionUser();
		if (!session.user) {
			return session.errorResponse;
		}

		const mcqId = parseMcqId((await context.params).id);
		if (!mcqId) {
			return jsonError("MCQ not found.", 404);
		}

		const record = await findMcqRecordById(mcqId);
		const access = getMcqAccess(record, session.user.id);
		if (access.status === "not_found") {
			return jsonError("MCQ not found.", 404);
		}
		if (access.status === "forbidden") {
			return jsonError("You do not have permission to modify this question.", 403);
		}

		const body = await request.json();
		const parsed = mcqAttemptSchema.safeParse(body);
		if (!parsed.success) {
			return jsonValidationError(parsed.error);
		}

		const attempt = await recordAttempt(mcqId, session.user.id, parsed.data.choiceId);
		if (!attempt) {
			return jsonError("The selected choice is not valid for this question.", 400);
		}

		return NextResponse.json({ ok: true, isCorrect: attempt.isCorrect }, { status: 201 });
	} catch (error) {
		console.error("POST /api/mcqs/[id]/attempts failed:", error);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}
