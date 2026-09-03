import type { McqRecord } from "@/lib/services/mcqs";

export type McqAccess =
	| { status: "ok"; mcq: McqRecord }
	| { status: "not_found" }
	| { status: "forbidden" };

export function getMcqAccess(mcq: McqRecord | null, userId: number): McqAccess {
	if (!mcq) {
		return { status: "not_found" };
	}

	if (mcq.created_by !== userId) {
		return { status: "forbidden" };
	}

	return { status: "ok", mcq };
}
