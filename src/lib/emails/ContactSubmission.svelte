<script>
	import { Button, Hr, Html, Text, Head, Heading, Section, Preview } from 'svelte-email';

	export let name = '[name]';
    export let subject = '[subject]';
    export let timerange;
    export let email = '[email]';
    export let phone = '[phone]';
    export let message = '[message]';
</script>

<Html lang="en">
    <Preview preview={`Contact Form Submission from ${name}`} />
    <Head>
        <title>Contact Form Submission</title>
    </Head>
    <Heading>
        Contact Form Submission
    </Heading>
	<Hr />
    <Section>
        <Text>
            Name: {name}
        </Text>
        <Text>
            Subject: {subject}
        </Text>
        {#if timerange !== undefined}
            <Text>
                Time: {timerange}
            </Text>
        {/if}
        <Text>
            Email: {email}
        </Text>
        <Text>
            Phone: {phone}
        </Text>
        <Text>
            Message: {message}
        </Text>
        <Button href={`mailto:${email}`} target="_blank">
            Reply to {name}
        </Button>
    </Section>
</Html>
