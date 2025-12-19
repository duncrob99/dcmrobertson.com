import { redirect } from '@sveltejs/kit';

export const GET = async ({ cookies, locals }) => {
    cookies.delete("auth_token", {
        path: "/",
        sameSite: "strict",
        secure: true
    });

    locals.user = undefined;

    redirect(307, "/");
};
