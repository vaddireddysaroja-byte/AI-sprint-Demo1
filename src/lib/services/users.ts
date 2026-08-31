import { getCloudflareContext } from "@opennextjs/cloudflare";

export type UserRecord = {
	id: number;
	username: string;
	email: string;
	password_hash: string;
	created_at: string;
};

export type PublicUser = {
	id: number;
	username: string;
	email: string;
};

export async function getDb(): Promise<D1Database> {
	const { env } = await getCloudflareContext({ async: true });
	return env.DB;
}

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
	return username.trim();
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
	const db = await getDb();
	const normalizedEmail = normalizeEmail(email);
	const result = await db
		.prepare("SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?1")
		.bind(normalizedEmail)
		.all<UserRecord>();

	return result.results[0] ?? null;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
	const db = await getDb();
	const normalizedUsername = normalizeUsername(username);
	const result = await db
		.prepare(
			"SELECT id, username, email, password_hash, created_at FROM users WHERE LOWER(username) = LOWER(?1)",
		)
		.bind(normalizedUsername)
		.all<UserRecord>();

	return result.results[0] ?? null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
	const db = await getDb();
	const result = await db
		.prepare("SELECT id, username, email, password_hash, created_at FROM users WHERE id = ?1")
		.bind(id)
		.all<UserRecord>();

	return result.results[0] ?? null;
}

export async function createUser(input: {
	username: string;
	email: string;
	passwordHash: string;
}): Promise<number> {
	const db = await getDb();
	const result = await db
		.prepare(
			"INSERT INTO users (username, email, password_hash) VALUES (?1, ?2, ?3) RETURNING id",
		)
		.bind(
			normalizeUsername(input.username),
			normalizeEmail(input.email),
			input.passwordHash,
		)
		.all<{ id: number }>();

	const userId = result.results[0]?.id;
	if (!userId) {
		throw new Error("Failed to create user.");
	}

	return userId;
}

export function toPublicUser(user: UserRecord): PublicUser {
	return {
		id: user.id,
		username: user.username,
		email: user.email,
	};
}
