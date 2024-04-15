import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { hashPassword, checkPassword } from "$lib/server/auth_utils";
import { isPasswordStrongEnough } from "$lib/password_utils";
//import { PlatformWrapper } from "$lib/platform_wrapper";
import { client } from "$lib/server/database";

export const POST = (async ({ request, platform }) => {
	let request_body = await request.json();

	/*
	const { email, publicKey, wrappedPrivateKey, iv, salt } = request_body;
	const platformWrapper = new PlatformWrapper(platform).platform;
	const userDataJSON = await platformWrapper.env?.ACCOUNTS.get(email);
	if (userDataJSON) return json({ ok: "false", error: "Email already taken" });

	// Enter keys into the KV store
	await platformWrapper.env?.ACCOUNTS.put(email, JSON.stringify({ publicKey, wrappedPrivateKey, iv, salt }));
	
	console.log("New user registered:", platformWrapper.env?.ACCOUNTS.get(email));

	*/

	const { email, password } = request_body;

	if (!isPasswordStrongEnough(email, password)) {
		return json({ ok: false, error: "Password too weak" });
	}

	const { exported_key, salt } = await hashPassword(password);

	console.log(exported_key, salt, password);

	try {
	 await client.execute({
		 sql: "INSERT INTO users (email, password_key, salt) VALUES (?, ?, ?)",
		 args: [email, exported_key, salt]
	 });

	 console.log(await checkPassword(password, exported_key, salt));

	return json({ ok: true });
 } catch (err: any) {
		if (err.code === "SQLITE_CONSTRAINT") {
			console.log("Email already taken");
			return json({ ok: false, error: "Email already taken" });
		}

	 console.log(err);
	 return json({ ok: false, error: "Database error" });
 };
}) satisfies RequestHandler;
