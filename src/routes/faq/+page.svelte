<script lang="ts">
	import Accordion from '$lib/components/Accordion.svelte';
</script>

<svelte:head>
	<title>About</title>
	<meta name="description" content="About this app" />
</svelte:head>

<div class="text-column">
	<h1>FAQ</h1>

	<Accordion startOpen summary="How much does a lesson cost?">
		<p>
			I generally do one hour lessons, with a charge of $50/hr.
		</p>
	</Accordion>

	<Accordion startOpen summary="Do you offer a trial lesson?">
		<p>
			Yes, your first lesson is free so we can get to know each other and make sure that I can provide whatever help you need without any risk.
		</p>
	</Accordion>

	<Accordion startOpen summary="Where do the lessons take place?">
		<p>
			I can take lessons either at my house, your house, or a libary close by. I live in Doncaster, so Doncaster Library is a good place, but I am flexible.
		</p>

		<p>
			However, note that if the chosen location requires more than 15 minutes travel, an extra $10 fee will apply, and that travel times may affect my availability as listed on this website.
		</p>
	</Accordion>

	<Accordion startOpen summary="Do you have a Working with Children Check?">
		Yes I do, and can provide its details to you on request.
	</Accordion>
</div>

<style lang="scss">
	.text-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 80ch;
		justify-content: start;
		gap: 0.5em;
	}
</style>
