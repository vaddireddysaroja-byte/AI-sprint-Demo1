import { NextResponse } from "next/server";

import { jsonError, jsonValidationError } from "@/lib/auth/api-response";
import { mcqWriteSchema } from "@/lib/mcq/schemas";
import { requireSessionUser } from "@/lib/mcq/require-session";
import { toApiMcqListItem } from "@/lib/mcq/serializers";
import { createMcqWithChoices, listMcqsByUser } from "@/lib/services/mcqs";

export async function GET() {
	const session = await requireSessionUser();
	if (!session.user) {
		return session.errorResponse;
	}

	const mcqs = await listMcqsByUser(session.user.id);
	return NextResponse.json({
		ok: true,
		mcqs: mcqs.map(toApiMcqListItem),
	});
}

export async function POST(request: Request) {
	try {
		const session = await requireSessionUser();
		if (!session.user) {
			return session.errorResponse;
		}

		const body = await request.json();
		const parsed = mcqWriteSchema.safeParse(body);

		if (!parsed.success) {
			return jsonValidationError(parsed.error);
		}

		const mcqId = await createMcqWithChoices({
			name: parsed.data.name,
			question: parsed.data.question,
			createdBy: session.user.id,
			choices: parsed.data.choices,
		});

		return NextResponse.json({ ok: true, mcqId }, { status: 201 });
	} catch (error) {
		console.error("POST /api/mcqs failed:", error);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}
