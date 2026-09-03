import { NextResponse } from "next/server";

import { jsonError, jsonValidationError } from "@/lib/auth/api-response";
import { getMcqAccess } from "@/lib/mcq/access";
import { parseMcqId, requireSessionUser } from "@/lib/mcq/require-session";
import { mcqWriteSchema } from "@/lib/mcq/schemas";
import { toApiMcqDetail } from "@/lib/mcq/serializers";
import {
	deleteMcq,
	findMcqById,
	findMcqRecordById,
	updateMcqWithChoices,
} from "@/lib/services/mcqs";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	const session = await requireSessionUser();
	if (!session.user) {
		return session.errorResponse;
	}

	const mcqId = parseMcqId((await context.params).id);
	if (!mcqId) {
		return jsonError("MCQ not found.", 404);
	}

	const mcq = await findMcqById(mcqId, session.user.id);
	if (!mcq) {
		const record = await findMcqRecordById(mcqId);
		const access = getMcqAccess(record, session.user.id);
		if (access.status === "forbidden") {
			return jsonError("You do not have permission to view this question.", 403);
		}

		return jsonError("MCQ not found.", 404);
	}

	return NextResponse.json({
		ok: true,
		mcq: toApiMcqDetail(mcq),
	});
}

export async function PUT(request: Request, context: RouteContext) {
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
		const parsed = mcqWriteSchema.safeParse(body);
		if (!parsed.success) {
			return jsonValidationError(parsed.error);
		}

		const updated = await updateMcqWithChoices(mcqId, session.user.id, {
			name: parsed.data.name,
			question: parsed.data.question,
			choices: parsed.data.choices,
		});

		if (!updated) {
			return jsonError("MCQ not found.", 404);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("PUT /api/mcqs/[id] failed:", error);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
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

		const deleted = await deleteMcq(mcqId, session.user.id);
		if (!deleted) {
			return jsonError("MCQ not found.", 404);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("DELETE /api/mcqs/[id] failed:", error);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}
