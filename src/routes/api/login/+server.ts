import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { checkPassword, toBase64 } from "$lib/server/auth_utils";
import { client } from "$lib/server/database";

const expiry_length = 60 * 60 * 24 * 7; // 1 week in seconds

export const POST = (async ({ request, cookies }) => {
	let request_body = await request.json();

	const { email, password } = request_body;

	try {
		const user_query = await client.execute({
			sql: "SELECT * FROM users WHERE email = ?",
			args: [email]
		});

		if (user_query.rows.length === 0) {
			return json({ ok: false, error: "Email not found" });
		}

		const user = user_query.rows[0];

		const { password_key, salt } = user;

		if (await checkPassword(password, password_key as string, salt as string)) {
			let auth_token = new Uint8Array(32);
			crypto.getRandomValues(auth_token);

			try {
				await client.batch([
					{
						sql: "DELETE FROM session_tokens WHERE user_email = ? AND expiry < ?",
						args: [
							email,
							Math.floor(Date.now() / 1000)
						]
					},
					{
						sql: "INSERT INTO session_tokens (user_email, token, expiry) VALUES (?, ?, ?)",
						args: [
							email,
							auth_token,
							Math.floor(Date.now() / 1000) + expiry_length
						]
					}
				]);
			} catch (err) {
				console.log(err);
				return json({ ok: false, error: "Database error" });
			}

			cookies.set("auth_token", toBase64(auth_token), {
				maxAge: expiry_length,
				path: "/",
				sameSite: "strict",
				secure: true
			});

            redirect(303, "/");
		} else {
			return json({ ok: false, error: "Incorrect password" });
		}
	} catch (err) {
		console.log(err);
		return json({ ok: false, error: "Database error" });
	}
}) satisfies RequestHandler;
