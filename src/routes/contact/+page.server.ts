import { render } from 'svelte-email';
import ContactSubmission from '$lib/emails/ContactSubmission.svelte';
import { fail } from '@sveltejs/kit';
import { FROM_EMAIL, CONTACT_SUBMISSION_EMAIL, RESEND_API_KEY, TURNSTILE_KEY } from '$env/static/private';
import { Resend } from 'resend';
import { validate_slots } from 'svelte/internal';

const resend = new Resend(RESEND_API_KEY);

const required_fields = ['name', 'email', 'message'];

export const actions = {
    default: async ({ request }) => {

        const data = await request.formData().then(formData => {
            const data = new Map();
            for (const [key, value] of formData.entries()) {
                data.set(key, value);
            }
            return data;
        });

        const turnstile_token = data.get("cf-turnstile-response");
        const ip = request.headers.get('CF-Connecting-IP');
        // Validate the token by calling the
        // "/siteverify" API endpoint.
        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const valid_turnstile_token = fetch(url, {
            body: JSON.stringify({
                secret: TURNSTILE_KEY,
                response: turnstile_token,
                remoteip: ip
            }),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(resp => resp.json())
        .then(resp => resp.success);

        const missing = required_fields.filter(field => {
            if (!data.has(field)) return true;
            const value = data.get(field);
            if (!(value instanceof String || typeof value === 'string')) return true;
            return !value.trim();
        });
        
        if (missing.length) {
            return fail(422,
                        {
                            error_description: `Missing required fields: ${missing.join(', ')}`,
                            errors: missing,
                            data: Object.fromEntries(data)
                        });
        }

        const emailHtml = render({
            template: ContactSubmission,
            props: Object.fromEntries(data)
        });

        if (!await valid_turnstile_token) {
            return fail(401,
                        {
                            error_description: "It seems that Cloudflare thinks you are a bot. If this is in error, please try again or email me at tutoring@dcmrobertson.com",
                            data: Object.fromEntries(data)
                        });
        }

        const resend_email_id = await resend.emails.send({
            from: FROM_EMAIL,
            to: CONTACT_SUBMISSION_EMAIL,
            subject: `New contact submission from ${data.get('name')}`,
            replyTo: `${data.get('email')}`,
            html: emailHtml
        });

        return { success: true, resend_email_id };
    }
}
