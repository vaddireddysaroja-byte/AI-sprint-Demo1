import type { ApiMcqListItem } from "@/lib/mcq/serializers";

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

export type ListMcqsResult = ApiErrorResult | ListMcqsSuccessResult;
export type DeleteMcqResult = ApiErrorResult | DeleteMcqSuccessResult;

type ApiBody = {
	ok: boolean;
	error?: string;
	mcqs?: ApiMcqListItem[];
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
