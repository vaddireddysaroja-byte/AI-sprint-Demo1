export type AuthErrorResult = {
	ok: false;
	error: string;
};

export type RegisterSuccessResult = {
	ok: true;
	userId: number;
};

export type LoginSuccessResult = {
	ok: true;
};

export type SessionSuccessResult = {
	ok: true;
	user: {
		id: number;
		username: string;
		email: string;
	};
};

export type RegisterResult = AuthErrorResult | RegisterSuccessResult;
export type LoginResult = AuthErrorResult | LoginSuccessResult;
export type SessionResult = AuthErrorResult | SessionSuccessResult;

type ApiBody = {
	ok: boolean;
	error?: string;
	userId?: number;
	user?: SessionSuccessResult["user"];
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

export async function registerUser(input: {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
}): Promise<RegisterResult> {
	let response: Response;

	try {
		response = await fetch("/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Registration failed."),
		};
	}

	return { ok: true, userId: data.userId ?? 0 };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
	let response: Response;

	try {
		response = await fetch("/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "Invalid email or password."),
		};
	}

	return { ok: true };
}

export async function logoutUser(): Promise<{ ok: true } | AuthErrorResult> {
	let response: Response;

	try {
		response = await fetch("/api/logout", {
			method: "POST",
			credentials: "include",
		});
	} catch {
		return { ok: false, error: "Unable to reach the server. Check your connection and try again." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok) {
		return { ok: false, error: getErrorMessage(response, data, "Logout failed.") };
	}

	return { ok: true };
}

export async function getSession(): Promise<SessionResult> {
	let response: Response;

	try {
		response = await fetch("/api/session", {
			method: "GET",
			credentials: "include",
		});
	} catch {
		return { ok: false, error: "Unable to reach the server." };
	}

	const data = await readApiBody(response);

	if (!response.ok || !data?.ok || !data.user) {
		return {
			ok: false,
			error: getErrorMessage(response, data, "You are not signed in."),
		};
	}

	return { ok: true, user: data.user };
}
