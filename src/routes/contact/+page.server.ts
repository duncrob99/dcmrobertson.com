import { render } from 'svelte-email';
import ContactSubmission from '$lib/emails/ContactSubmission.svelte';
import { fail } from '@sveltejs/kit';
import { FROM_EMAIL, CONTACT_SUBMISSION_EMAIL, RESEND_API_KEY } from '$env/static/private';
import { Resend } from 'resend';

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

        resend.emails.send({
            from: FROM_EMAIL,
            to: CONTACT_SUBMISSION_EMAIL,
            subject: `New contact submission from ${data.get('name')}`,
            replyTo: `${data.get('email')}`,
            html: emailHtml
        });

        return { success: true };
    }
}
