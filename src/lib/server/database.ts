import { TURSO_TOKEN } from "$env/static/private";
import { createClient } from "@libsql/client/web";

export const client = createClient({
	url: "libsql://dcmrobertson-duncrob99.turso.io",
	authToken: TURSO_TOKEN
});