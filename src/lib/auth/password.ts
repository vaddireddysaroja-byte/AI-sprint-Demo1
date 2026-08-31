// Cloudflare Workers Web Crypto supports PBKDF2 up to 100_000 iterations.
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function toBase64(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	return crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_BYTES * 8,
	);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const derived = new Uint8Array(await deriveKey(password, salt));

	return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [algorithm, iterationsValue, saltValue, hashValue] = storedHash.split("$");
	if (algorithm !== "pbkdf2-sha256" || !iterationsValue || !saltValue || !hashValue) {
		return false;
	}

	const iterations = Number(iterationsValue);
	if (!Number.isFinite(iterations)) {
		return false;
	}

	const salt = fromBase64(saltValue);
	const expectedHash = fromBase64(hashValue);
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derived = new Uint8Array(
		await crypto.subtle.deriveBits(
			{
				name: "PBKDF2",
				salt: salt as BufferSource,
				iterations,
				hash: "SHA-256",
			},
			keyMaterial,
			expectedHash.length * 8,
		),
	);

	if (derived.length !== expectedHash.length) {
		return false;
	}

	let mismatch = 0;
	for (let index = 0; index < derived.length; index += 1) {
		mismatch |= derived[index] ^ expectedHash[index];
	}

	return mismatch === 0;
}
