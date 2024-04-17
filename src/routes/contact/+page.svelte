<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
    console.log('data: ', data);

    $: subject = data.timerange === undefined ? "" : "Tutoring session request for " + data.timerange.day + "s";
</script>

<form action="https://api.staticforms.xyz/submit" method="post">
    <!-- Replace with accesKey sent to your email -->
    <input type="hidden" name="accessKey" value="1a3ebf0f-4660-4319-b33a-1e3116d04f47"> <!-- Required -->
    <div class="field">
        <label for="name">Name</label>
        <input type="text" name="name"> <!-- Optional -->
    </div>
    <div class="field">
        <label for="subject">Subject</label>
        <input type="text" name="subject" value={subject}> <!-- Optional -->
    </div>
    {#if data.timerange !== undefined}
        <div class="field no-underline">
            <label for="$timerange">Time</label>
            <div class="field-row">
                <input name="$timerange" value={data.timerange.toString()} readonly>
                <a class="btn" href="/availability">Choose another time</a>
            </div>
        </div>
    {/if}
    <div class="field">
        <label for="email">Email Address</label>
        <input type="text" name="email"> <!-- Optional -->
    </div>
    <div class="field">
        <label for="phone">Phone Number</label>
        <input type="text" name="phone"> <!-- Optional -->
    </div>
    <div class="field">
        <label for="message">Message</label>
        <textarea name="message"></textarea> <!-- Optional -->
    </div>
    <!-- If you want replyTo to be set to specific email -->
    <!--<input type="text" name="replyTo" value="myreplytoemail@example.com"> <!-- Optional -->
    <!-- Specify @ as reply to value if you want it to be customers email -->
    <input type="hidden" name="replyTo" value="@"> <!-- Optional -->
    <!-- If you want form to redirect to a specific url after submission -->
    <input type="hidden" name="redirectTo" value="/contact/success"> <!-- Optional -->
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
                border: 1px solid #007bff;
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
</style>
