import { getAppEnv } from "@/lib/cloudflare-env";

export const SESSION_COOKIE_NAME = "auth_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
	userId: number;
	exp: number;
};

function encodeBase64Url(value: string): string {
	return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): string {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/");
	const padLength = (4 - (padded.length % 4)) % 4;
	const normalized = padded + "=".repeat(padLength);
	return atob(normalized);
}

export class SessionConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SessionConfigError";
	}
}

async function getSessionSecret(): Promise<string> {
	const env = await getAppEnv();
	const secret = env.SESSION_SECRET?.trim();

	if (!secret) {
		throw new SessionConfigError("SESSION_SECRET is not configured.");
	}

	return secret;
}

export async function assertSessionConfigured(): Promise<void> {
	await getSessionSecret();
}

async function signPayload(payload: string): Promise<string> {
	const secret = await getSessionSecret();
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
	const signatureBytes = new Uint8Array(signature);

	return encodeBase64Url(
		String.fromCharCode(...signatureBytes),
	);
}

async function verifySignature(payload: string, signature: string): Promise<boolean> {
	const secret = await getSessionSecret();
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"],
	);

	const signatureBinary = decodeBase64Url(signature);
	const signatureBytes = Uint8Array.from(signatureBinary, (char) => char.charCodeAt(0));

	return crypto.subtle.verify(
		"HMAC",
		key,
		signatureBytes,
		new TextEncoder().encode(payload),
	);
}

export async function createSessionToken(userId: number): Promise<string> {
	const payload: SessionPayload = {
		userId,
		exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
	};
	const encodedPayload = encodeBase64Url(JSON.stringify(payload));
	const signature = await signPayload(encodedPayload);

	return `${encodedPayload}.${signature}`;
}

export async function readSessionUserId(token: string | undefined): Promise<number | null> {
	if (!token) {
		return null;
	}

	const [encodedPayload, signature] = token.split(".");
	if (!encodedPayload || !signature) {
		return null;
	}

	const isValid = await verifySignature(encodedPayload, signature);
	if (!isValid) {
		return null;
	}

	try {
		const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
		if (!payload.userId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return payload.userId;
	} catch {
		return null;
	}
}

export function buildSessionCookie(token: string): string {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

	return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function buildClearSessionCookie(): string {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

	return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
