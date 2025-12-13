import { ORIGIN } from "$env/static/private";

export function cache_function(label: string, fn: Function): Function {
	return async (...args: any) => {
		const cache_label = JSON.stringify({
			label,
			args,
		});

		console.log("cache label: ", cache_label);

		const searchParams = new URLSearchParams({
			label: cache_label,
		}).toString();
		const cache_resp = await (await fetch(`${ORIGIN}/api/cache?${searchParams}`)).json();
		console.log("cache response: ", cache_resp);

		if (cache_resp.success) {
			return cache_resp.result.value;
		}

		const function_result = await fn(...args);

		console.log("function result: ", function_result);

		const post_resp = await fetch(`${ORIGIN}/api/cache`, {
			method: "POST",
			body: JSON.stringify({
				label: cache_label,
				value: function_result,
			}),
			headers: {
				"Content-Type": "text/json",
			},
		});

		console.log("post_resp: ", post_resp, await post_resp.text());

		return function_result;
	};
}
