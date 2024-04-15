import { checkUserAuth } from "$lib/server/auth_utils";
import { error, redirect } from "@sveltejs/kit";

const user_restricted_paths = new Map([
    ['/book', 'You must be logged in to book a time'],
]);
const anonymous_restricted_paths = new Map([
    ['/login', 'You are already logged in'],
    ['/register', 'You are already logged in'],
]);
const staff_restricted_paths = {
    '/admin': 'You must be logged in as staff to access this page'
};

export async function handle({ event, resolve }) {
    event.locals.user = await checkUserAuth(event.cookies);


    if (user_restricted_paths.has(event.url.pathname) && !event.locals.user) {
        let message = user_restricted_paths.get(event.url.pathname) ?? 'You must be logged in to access this page';
        throw redirect(307, '/login?redirect=' + encodeURIComponent(event.url.pathname + event.url.search) + '&message=' + encodeURIComponent(message));
    }

    if (anonymous_restricted_paths.has(event.url.pathname) && event.locals.user) {
        let message = anonymous_restricted_paths.get(event.url.pathname) ?? 'You are already logged in';
        throw redirect(307, '/?message=' + encodeURIComponent(message));
    }

    return await resolve(event);
}
