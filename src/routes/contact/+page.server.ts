import { render } from 'svelte-email';
import nodemailer from 'nodemailer';
import ContactSubmission from '$lib/emails/ContactSubmission.svelte';
import { fail } from '@sveltejs/kit';
import { MAIL_SMTP_USER, MAIL_SMTP_PASS, EMAIL_HOST, FROM_EMAIL, CONTACT_SUBMISSION_EMAIL } from '$env/static/private';


const required_fields = ['name', 'email', 'message'];

export const actions = {
    default: async ({ request, env }) => {
        console.log(env);

        const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: 465,
            secure: true,
            auth: {
                user: MAIL_SMTP_USER,
                pass: MAIL_SMTP_PASS
            }
        });

        const data = await request.formData();
        const missing = required_fields.filter(field => !data.has(field) || !data.get(field).trim());
        if (missing.length) {
            return fail(422,
                        {
                            error_description: `Missing required fields: ${missing.join(', ')}`,
                            errors: missing,
                        });
        }

        const emailHtml = await render({
            template: ContactSubmission,
            props: Object.fromEntries(data)
        });

        const options = {
            from: FROM_EMAIL,
            to: CONTACT_SUBMISSION_EMAIL,
            subject: `New contact submission from ${data.get('name')}`,
            replyTo: data.get('email'),
            html: emailHtml
        };

        await transporter.sendMail(options);
    }
}
