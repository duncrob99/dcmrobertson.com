// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const load = (async (event) => {
    const user = event.locals.user;

    return {
        user: user
    }
});
