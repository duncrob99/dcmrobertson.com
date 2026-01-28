import { checkUserAuth } from '$lib/server/auth_utils';
import { redirect } from '@sveltejs/kit';
import { DateTime, Settings } from 'luxon';
import {
	getRequestContext,
	printLogs,
	runWithContext,
	saveLog,
	setRequestContext
} from '$lib/server/requestContext';

Settings.defaultZone = 'Australia/Melbourne';

const user_restricted_paths = new Map([['/book', 'You must be logged in to book a time']]);
const anonymous_restricted_paths = new Map([
	['/login', 'You are already logged in'],
	['/register', 'You are already logged in']
]);

const staff_emails = new Set(['admin@saigatours.com']);
const staff_restricted_paths = new Map([
	['/admin', 'You must be logged in as staff to access this page']
]);

export async function handle({ event, resolve }) {
	return runWithContext(async () => {
		event.locals.user = await checkUserAuth(event.cookies);
		setRequestContext('user', event.locals.user);
		setRequestContext('platform', event.platform);

		if (user_restricted_paths.has(event.url.pathname) && !event.locals.user) {
			const message =
				user_restricted_paths.get(event.url.pathname) ??
				'You must be logged in to access this page';
			redirect(
				307,
				'/login?redirect=' +
					encodeURIComponent(event.url.pathname + event.url.search) +
					'&message=' +
					encodeURIComponent(message)
			);
		}

		if (anonymous_restricted_paths.has(event.url.pathname) && event.locals.user) {
			const message =
				anonymous_restricted_paths.get(event.url.pathname) ?? 'You are already logged in';
			redirect(307, '/?message=' + encodeURIComponent(message));
		}

		if (
			staff_restricted_paths.has(event.url.pathname) &&
			!staff_emails.has(event.locals.user?.email ?? 'definitly won\t match')
		) {
			const message = staff_restricted_paths.get(event.url.pathname);
			redirect(
				307,
				'/?message=' +
					encodeURIComponent(message ?? 'You must be logged in as staff to access this page')
			);
		}

		const response = await resolve(event);

		saveLog(`Request completed with status ${response.status}`);
		printLogs();

		return response;
	});
}
