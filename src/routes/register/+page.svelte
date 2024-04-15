<script lang="ts">
  import { onMount } from "svelte";
	import { getPasswordStrength, isPasswordStrongEnough } from '$lib/password_utils';
	import type { ZxcvbnResult } from '@zxcvbn-ts/core';

	let email: string;
	let password: string;
	let password2: string;
	let passwordStrength: ZxcvbnResult | undefined;
	$: passwordStrength = password ? getPasswordStrength(email, password) : undefined;

	onMount(async () => {
		console.log("This only runs on the client!");
	});

	async function register() {
		console.log("Registering...");

		if (password != password2) {
			alert("Passwords do not match!");
			return;
		}

		if (!email || !password) {
			alert("Email and password are required!");
			return;
		}

		//if (!isPasswordStrongEnough(email, password)) {
			//alert("Password is not strong enough!");
			//return;
		//}

		// Send email & password to server
		let response = await fetch("/api/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				email,
				password
			})
		});

		let result = await response.json();
		console.log(result);

		if (result.ok) {
			// Redirect to login page
			//window.location.href = "/login";
			alert("Registered!");
		} else {
			// Show error message
			alert(result.error);
		}

		/*
		// Generate public/private key pair from password using SubtleCrypto
		let random_salt = new Uint8Array(16);
		crypto.getRandomValues(random_salt);

		let iv = new Uint8Array(12);
		crypto.getRandomValues(iv);

		let passwordKey = await crypto.subtle.deriveKey(
			{
				name: "PBKDF2",
				salt: random_salt,
				iterations: 100000,
				hash: "SHA-256"
			},
			await crypto.subtle.importKey(
				"raw",
				new TextEncoder().encode(password),
				"PBKDF2",
				false,
				["deriveKey"]
			),
			{
				name: "AES-GCM",
				length: 256
			},
			true,
			["encrypt", "decrypt", "wrapKey", "unwrapKey"]
		);

		console.log("Password key:", passwordKey);

		let asymKeys = await crypto.subtle.generateKey(
			{
				name: "RSA-OAEP",
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: "SHA-256"
			},
			true,
			["encrypt", "decrypt"]
		);

		console.log("Generated asymmetric keys:", asymKeys);

		let wrappedPrivateKey = await crypto.subtle.wrapKey(
			"jwk",
			asymKeys.privateKey,
			passwordKey,
			{
				name: "AES-GCM",
				iv
			}
		);

		// Send public key & wrapped private key to server
		let response = await fetch("/api/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				email,
				publicKey: await crypto.subtle.exportKey("jwk", asymKeys.publicKey),
				wrappedPrivateKey: btoa(String.fromCharCode(...new Uint8Array(wrappedPrivateKey))),
				random_salt: btoa(String.fromCharCode(...new Uint8Array(random_salt))),
				iv: btoa(String.fromCharCode(...new Uint8Array(iv)))
			})
		});

		if (response.ok) {
			// Redirect to login page
			//window.location.href = "/login";
			alert("Registered!");
		} else {
			// Show error message
			let error = await response.json();
			alert(error.message);
		}
		*/
	}
</script>

<div class="login">
	<form>
		<h1 id="title">Register</h1>
		<!-- svelte-ignore a11y-autofocus -->
		<input id="email" autofocus type="email" placeholder="Email" bind:value={email} />
		<input id="password" type="password" placeholder="Password" bind:value={password} />
		<input id="password2" type="password" placeholder="Confirm Password" bind:value={password2} />
		<div id="strength-meter" data-strength={passwordStrength ? passwordStrength.score / 4 : undefined}></div>
		<div id="strength-report">
			Crack time:<br>
			{passwordStrength ? passwordStrength.crackTimesDisplay.onlineNoThrottling10PerSecond : "-"}
		</div>
		<button id="register" type="button" on:click={register}>Register</button>
		<a id="login" href="/login">Login</a>
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
			grid-template-columns: 1fr 1fr;
			grid-template-rows: repeat(5, max-content);
			grid-template-areas: 
				"title title"
				"email email"
				"password password"
				"password2 password2"
				"strength-meter strength-report"
				"register login";
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

			#password2 {
				grid-area: password2;
			}

			#strength-meter {
				grid-area: strength-meter;
				height: 0.5rem;
				border-radius: 0.5rem;
				background-color: #ccc;
				// background: linear-gradient(to right, var(--meter-color) var(--width, 0), #ccc var(--width, 0));

				&[data-strength="0"] {
					--meter-color: #f00;
					--width: 20%;
				}
				&[data-strength="0.25"] {
					--meter-color: #f80;
					--width: 40%;
				}
				&[data-strength="0.5"] {
					--meter-color: #ff0;
					--width: 60%;
				}
				&[data-strength="0.75"] {
					--meter-color: #8f0;
					--width: 80%;
				}
				&[data-strength="1"] {
					--meter-color: #0f0;
					--width: 100%;
				}

				&::after {
					content: "";
					display: block;
					height: 100%;
					width: var(--width, 0);
					background-color: var(--meter-color);
					border-radius: 0.5rem;
				}
			}

			#strength-report {
				grid-area: strength-report;
			}

			#login {
				grid-area: login;
			}

			#register {
				grid-area: register;
			}
		}
	}
</style>
