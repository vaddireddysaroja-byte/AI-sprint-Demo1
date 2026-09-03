import type { ApiMcqDetail, ApiMcqListItem } from "@/lib/mcq/serializers";
import type { McqWriteInput } from "@/lib/mcq/schemas";

type ApiErrorResult = {
	ok: false;
	error: string;
};

type ListMcqsSuccessResult = {
	ok: true;
	mcqs: ApiMcqListItem[];
};

type DeleteMcqSuccessResult = {
	ok: true;
};

type CreateMcqSuccessResult = {
	ok: true;
	mcqId: number;
};

type UpdateMcqSuccessResult = {
	ok: true;
};

type GetMcqSuccessResult = {
	ok: true;
	mcq: ApiMcqDetail;
};

type RecordAttemptSuccessResult = {
	ok: true;
	isCorrect: boolean;
};

export type ListMcqsResult = ApiErrorResult | ListMcqsSuccessResult;
export type DeleteMcqResult = ApiErrorResult | DeleteMcqSuccessResult;
export type CreateMcqResult = ApiErrorResult | CreateMcqSuccessResult;
export type UpdateMcqResult = ApiErrorResult | UpdateMcqSuccessResult;
export type GetMcqResult = ApiErrorResult | GetMcqSuccessResult;
export type RecordAttemptResult = ApiErrorResult | RecordAttemptSuccessResult;

export type McqWritePayload = McqWriteInput;

type ApiBody = {
	ok: boolean;
	error?: string;
	mcqs?: ApiMcqListItem[];
	mcqId?: number;
	mcq?: ApiMcqDetail;
	isCorrect?: boolean;
};

function getErrorMessage(response: Response, data: ApiBody | null, fallback: string): string {
	if (data?.error?.trim()) {
		return data.error;
	}

	return `${fallback} (HTTP ${response.status})`;
}

async function readApiBody(response: Response): Promise<ApiBody | null> {
	try {
		const data = (await response.json()) as ApiBody;
		if (typeof data === "object" && data !== null && "ok" in data) {
			return data;
		}
	} catch {
		return null;
	}

	return null;
}

export async function listMcqs(): Promise<ListMcqsResult> {
	let response: Response;

	try {
		response = await fetch("/api/mcqs", {
			method: "GET",
			credentials: "include",
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok || !data.mcqs) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Failed to load questions."),
		};
	}

	return { ok: true, mcqs: data.mcqs };
}

export async function getMcq(mcqId: number): Promise<GetMcqResult> {
	let response: Response;

	try {
		response = await fetch(`/api/mcqs/${mcqId}`, {
			method: "GET",
			credentials: "include",
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok || !data.mcq) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Failed to load question."),
		};
	}

	return { ok: true, mcq: data.mcq };
}

export async function createMcq(payload: McqWritePayload): Promise<CreateMcqResult> {
	let response: Response;

	try {
		response = await fetch("/api/mcqs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(payload),
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Failed to create question."),
		};
	}

	return { ok: true, mcqId: data.mcqId ?? 0 };
}

export async function updateMcq(mcqId: number, payload: McqWritePayload): Promise<UpdateMcqResult> {
	let response: Response;

	try {
		response = await fetch(`/api/mcqs/${mcqId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(payload),
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Failed to update question."),
		};
	}

	return { ok: true };
}

export async function deleteMcq(mcqId: number): Promise<DeleteMcqResult> {
	let response: Response;

	try {
		response = await fetch(`/api/mcqs/${mcqId}`, {
			method: "DELETE",
			credentials: "include",
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Failed to delete question."),
		};
	}

	return { ok: true };
}

export async function recordMcqAttempt(
	mcqId: number,
	choiceId: number,
): Promise<RecordAttemptResult> {
	let response: Response;

	try {
		response = await fetch(`/api/mcqs/${mcqId}/attempts`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ choiceId }),
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok || typeof data.isCorrect !== "boolean") {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Failed to submit answer."),
		};
	}

	return { ok: true, isCorrect: data.isCorrect };
}
