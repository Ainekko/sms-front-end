<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { config } from '$lib/config';

	// Check if we are running in the browser
	const browser = typeof window !== 'undefined';

	export let buttonText = 'Continue with Google';
	export let size: 'large' | 'medium' = 'large';

	let isLoading = false;

	// Google OAuth2 configuration
	const GOOGLE_CLIENT_ID = '144652246407-itelihabs7ns4brsead66aion8o5uo9d.apps.googleusercontent.com';
	const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '';
	const SCOPE = 'openid email profile';

	function generateRandomString(length: number): string {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		return result;
	}

	async function generateCodeChallenge(codeVerifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(codeVerifier);
		const digest = await crypto.subtle.digest('SHA-256', data);
		const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}

	async function handleGoogleLogin() {
		if (!browser) return;
		
		isLoading = true;
		
		try {
			// Generate PKCE parameters
			const codeVerifier = generateRandomString(128);
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			const state = generateRandomString(32);

			// Store PKCE parameters in sessionStorage
			sessionStorage.setItem('google_code_verifier', codeVerifier);
			sessionStorage.setItem('google_state', state);

			// Build authorization URL
			const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
			authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
			authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
			authUrl.searchParams.set('response_type', 'code');
			authUrl.searchParams.set('scope', SCOPE);
			authUrl.searchParams.set('code_challenge', codeChallenge);
			authUrl.searchParams.set('code_challenge_method', 'S256');
			authUrl.searchParams.set('state', state);

			// Redirect to Google OAuth
			window.location.href = authUrl.toString();
			
		} catch (error) {
			console.error('Error initiating Google login:', error);
			isLoading = false;
		}
	}
</script>

<button
	type="button"
	on:click={handleGoogleLogin}
	disabled={isLoading}
	class="flex w-full items-center justify-center gap-3 rounded-xl bg-white border border-zinc-200 {size === 'large' ? 'px-4 py-3.5 font-medium' : 'px-3 py-2 font-medium'} text-zinc-900 transition-colors hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
>
	{#if isLoading}
		<div class="h-5 w-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
		<span>Redirecting...</span>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 48 48">
			<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
			<path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
			<path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
			<path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.138,44,30.025,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
		</svg>
		<span>{buttonText}</span>
	{/if}
</button>
