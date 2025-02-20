<script lang="ts">
	import type { PageData } from './$types';
    import { enhance } from '$app/forms';
    import { onMount } from 'svelte';

	export let data: PageData;
    export let form;

    $: subject = data.timerange === undefined ? "" : "Tutoring session request for " + data.timerange.day + "s";

    $: {
        form?.errors?.forEach(field => {
            const element = formElement.querySelector(`[name="${field}"]`);
            if (element && element.value === "") {
                element.classList.add('invalid');
            }
        });
        console.log("form: ", form);
    }

    let formElement: HTMLFormElement;

    onMount(() => {
        const requiredFields = formElement.querySelectorAll('[data-required]');
        requiredFields.forEach(field => {
            if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) return;

            field.addEventListener('input', () => {
                if (field.value === "") {
                    field.classList.add('invalid');
                } else {
                    field.classList.remove('invalid');
                }
            });
        });
    });
</script>

<svelte:head>
	<title>Contact</title>
	<meta name="description" content="Contact me to organise a tutoring session or to ask any other questions." />
</svelte:head>

<div class="preamble">
    <p>Please feel free to reach out to me using this form with any questions or to schedule a tutoring session. I will get back to you as soon as possible.</p>
    <p>Alternatively, you can email me at <a href="mailto:tutoring@dcmrobertson.com">tutoring@dcmrobertson.com</a>.</p>
</div>

{#if form?.error_description}
    <div class="error">
        <p>{form.error_description}</p>
    </div>
{/if}

{#if form?.success}
    <div class="success">
        <p>Thank you for your message. I will get back to you as soon as possible.</p>
    </div>
{/if}

<form method="post" use:enhance bind:this={formElement}>
    <div class="field">
        <label for="name">Name</label>
        <input type="text" name="name" data-required value={form?.data?.name || ''}> <!-- Optional -->
    </div>
    <div class="field">
        <label for="subject">Subject</label>
        <input type="text" name="subject" value={subject}> <!-- Optional -->
    </div>
    {#if data.timerange !== undefined}
        <div class="field no-underline">
            <label for="timerange">Time</label>
            <div class="field-row">
                <input name="timerange" value={data.timerange.toString()} readonly>
                <a class="btn" href="/availability">Choose another time</a>
            </div>
        </div>
    {/if}
    <div class="field">
        <label for="email">Email Address</label>
        <input type="email" name="email" data-required value={form?.data?.email || ''}> <!-- Optional -->
    </div>
    <div class="field">
        <label for="phone">Phone Number</label>
        <input type="text" name="phone" value={form?.data?.phone || ''}> <!-- Optional -->
    </div>
    <div class="field">
        <label for="message">Message</label>
        <textarea name="message" data-required value={form?.data?.message || ''}></textarea> <!-- Optional -->
    </div>
    <input type="submit" value="Submit" />
</form>

<!--
{#if data.timerange !== undefined}
    {@const range=data.timerange}
    <p>Request booking for {range.day} from {range.start.hour}:{range.start.minute} to {range.end.hour}:{range.end.minute}</p>
{:else}
    <p>No time</p>
{/if}
-->

<style lang="scss">
    form {
        & > .field {
            display: block;
            width: 100%;
            margin-bottom: 1rem;
            overflow: hidden;
            --hover-underline-color: #007bff;

            > * {
                display: block;
                width: 100%;
            }

            label {
                margin-top: 1rem;
            }

            input, textarea {
                padding: 0.5rem;
                border: none;
                border-bottom: 2px solid rgba(0, 0, 0, 0.1);
                background-color: rgba(0, 0, 0, 0.05);
                border-top-left-radius: 0.5rem;
                border-top-right-radius: 0.5rem;
                box-sizing: border-box;

                &:focus {
                    outline: none;
                }
            }

            textarea {
                resize: vertical;
                height: 10rem;
            }

            &:not(.no-underline)::after {
                width: 0;
                height: 100%;
                border: 1px solid var(--hover-underline-color);
                content: "";
                display: block;
                transition: width 1s ease-in-out;
                left: -5px;
                position: relative;
                top: -2px;
            }

            &:hover {
                &::after {
                    width: 20%;
                }
            }

            &:focus-within {
                &::after {
                    width: calc(100% + 10px);
                }
            }

            &:has(input[data-required], textarea[data-required]) {
                &:has(.invalid) {
                    --hover-underline-color: darkred;

                    input, textarea {
                        border-bottom-color: red;
                    }
                }

                label {
                    font-weight: bold;

                    &::after {
                        content: " *";
                        color: red;
                    }
                }
            }
        }

        input[type="submit"] {
            padding: 0.5rem;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            margin-top: 2rem;
            width: 100%;
        }
    }

    a.btn {
        display: inline-block;
        padding: 0.5rem 1rem;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 0.25rem;
        margin-left: 1rem;
    }

    div.error {
        background-color: rgba(255, 0, 0, 0.1);
        padding: 1rem;
        border-radius: 0.25rem;
        width: max-content;

        p {
            margin: 0;
        }
    }

    div.success {
        background-color: rgba(0, 255, 0, 0.1);
        padding: 1rem;
        border-radius: 0.25rem;
        width: max-content;

        p {
            margin: 0;
        }
    }
</style>
