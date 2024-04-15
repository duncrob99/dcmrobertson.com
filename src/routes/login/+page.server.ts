import { fail, redirect } from "@sveltejs/kit";
import { checkPassword, toBase64 } from "$lib/server/auth_utils";
import { client } from "$lib/server/database";

const expiry_length = 60 * 60 * 24 * 7; // 1 week in seconds

export const actions = {
    default: async ({ request, cookies, locals }) => {
        const data = await request.formData();

        const email = data.get("email");
        const password = data.get("password");

        if (typeof email !== "string" || typeof password !== "string") {
            return fail(400, { ok: false, error: "Invalid request" });
        }

        try {
            const user_query = await client.execute({
                sql: "SELECT * FROM users WHERE email = ?",
                args: [email]
            });

            if (user_query.rows.length === 0) {
                return fail(400, { ok: false, error: "Email not found" });
            }

            const user = user_query.rows[0];

            if (user === null || user === undefined || user.email === undefined || user.email === null) {
                return fail(400, { ok: false, error: "Email not found" });
            }

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
                    return fail(400, { ok: false, error: "Database error" });
                }

                cookies.set("auth_token", toBase64(auth_token), {
                    maxAge: expiry_length,
                    path: "/",
                    sameSite: "strict",
                    secure: true
                });

                locals.user = {
                    email: user.email.toString(),
                };

                console.log("User logged in: " + locals.user.email);
            } else {
                return fail(400, { ok: false, error: "Incorrect password" });
            }
        } catch (err) {
            console.log(err);
            return fail(400, { erorr: "Database error" });
        }
        throw redirect(303, "/");
    }
}
