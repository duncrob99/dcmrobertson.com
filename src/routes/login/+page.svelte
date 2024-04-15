<script lang="ts">
	let email: string;
	let password: string;

	let message = '';
	let redirect = '/';
    export let form;

	if (typeof document !== 'undefined') {
		let params = new URLSearchParams(window.location.search);
		redirect = params.get('redirect') ?? '/';
		message = form?.error ?? params.get('message') ?? '';
        console.log("form: ", form);
	}
</script>

<div class="login">
	<form method="POST">
		<h1 id="title">Login</h1>
		{#if message}
			<p class="message" class:error={form}>{message}</p>
		{/if}
		<!-- svelte-ignore a11y-autofocus -->
		<input name="email" id="email" autofocus type="email" placeholder="Email" bind:value={email} />
		<input name="password" id="password" type="password" placeholder="Password" bind:value={password} />
		<button id="login" type="submit">Login</button>
		<a id="register" href="/register">Register</a>
	</form>
</div>

<style lang="scss">
	.login {
		display: grid;
		grid-template-columns: 1fr min-content 1fr;
		grid-template-rows: 1fr min-content 2fr;
		grid-template-areas: 
			". . ."
			". form ."
			". . .";

		& > form {
			grid-area: form;
			height: min-content;
			width: min-content;
			padding: 2rem 3rem;
			border: 1px solid black;
			background: rgba(255, 255, 255, 0.3);
			border-radius: 1rem;
			box-shadow: 0.5rem 0.5rem 1rem rgba(0, 0, 0, 0.2);
			display: grid;
			grid-template-columns: 3fr 1fr;
			grid-template-rows: repeat(5, max-content);
			grid-template-areas: 
				"title title"
				"message message"
				"email email"
				"password password"
				"login register";
			gap: 1rem;
			align-items: center;
	
			& > input {
				padding: 0.5rem 1rem;
				border-radius: 0.5rem;
			}
	
			& > button {
				padding: 0.5rem 1rem;
				border-radius: 0.5rem;
				cursor: pointer;
				min-width: 10rem;
				border: none;
				background: #e9e9ed;
				text-align: center;
				text-decoration: none;
				color: black;
			}

			& > button:hover, & > button:focus {
				background: #d9d9dd;
			}

			& > a {
				padding: 0.5rem 1rem;
				border-radius: 0.5rem;
				cursor: pointer;
				min-width: 10rem;
				outline: 1px solid grey;
				text-align: center;
				text-decoration: none;
				color: black;
			}

			& > a:hover, & > a:focus {
				background: #e9e9ed;
				outline: 1px solid black;
			}

			#title {
				grid-area: title;
				margin: 0;
			}

			#email {
				grid-area: email;
			}

			#password {
				grid-area: password;
			}

			#login {
				grid-area: login;
			}

			#register {
				grid-area: register;
			}

			.message {
				grid-area: message;
				margin: 0;

                &.error {
                    color: red;
                }
			}
		}
	}
</style>
