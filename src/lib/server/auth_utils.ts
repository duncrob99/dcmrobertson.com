import type { Cookies } from "@sveltejs/kit";
import { client } from "$lib/server/database";

export function toBase64(arr: Uint8Array): string {
	return btoa(String.fromCharCode(...arr));
}

export function fromBase64(str: string): Uint8Array {
	return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

export async function hashPassword(password: string): Promise<{ exported_key: string, salt: string }> {
	let salt_array = new Uint8Array(18);
	crypto.getRandomValues(salt_array);

	// Derive PBKDF2 key from password
	let passwordKey = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt_array,
			iterations: 100000,
			hash: "SHA-256"
		},
		await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(password),
			"PBKDF2",
			false,
			["deriveKey"]
		),
		{
			name: "AES-GCM",
			length: 256
		},
		true,
		["encrypt", "decrypt", "wrapKey", "unwrapKey"]
	);

	let exported_key_array = await crypto.subtle.exportKey("raw", passwordKey);
	let exported_key = btoa(String.fromCharCode(...new Uint8Array(exported_key_array)));
	let salt = btoa(String.fromCharCode(...salt_array));

	return { exported_key, salt };
}

export async function checkPassword(password: string, expected_key: string, salt: string): Promise<boolean> {
	console.log(salt);
	let passwordKey = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)),
			iterations: 100000,
			hash: "SHA-256"
		},
		await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(password),
			"PBKDF2",
			false,
			["deriveKey"]
		),
		{
			name: "AES-GCM",
			length: 256
		},
		true,
		["encrypt", "decrypt", "wrapKey", "unwrapKey"]
	);

	let exported_key_array = await crypto.subtle.exportKey("raw", passwordKey);
	let exported_key = btoa(String.fromCharCode(...new Uint8Array(exported_key_array)));

	return exported_key == expected_key;
}


export type User = {
	email: string,
};


export async function checkUserAuth(cookies: Cookies): Promise<User | undefined> {
	let auth_token = cookies.get("auth_token");
	if (!auth_token) {
		return;
	}

	let auth_token_array = fromBase64(auth_token);

	let session_token_query = await client.execute({
		sql: "SELECT * FROM session_tokens WHERE token = ?",
		args: [auth_token_array]
	});

	if (session_token_query.rows.length === 0) {
		return;
	}

	let session_token = session_token_query.rows[0];
	let user_email = session_token.user_email;
	let token_expiry = session_token.expiry;

	if (!user_email || !token_expiry || !(typeof user_email === "string") || !(typeof token_expiry === "number")) {
		return;
	}

	if (token_expiry < Math.floor(Date.now() / 1000)) {
		return;
	}

	return { email: user_email };
}
