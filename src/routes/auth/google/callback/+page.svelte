<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { config } from '$lib/config';
  import { setStoredToken } from '$lib/api/auth';
  import { authStore } from '$lib/stores/authStore';

  let status = 'Processing authentication...';
  let error = '';

  async function handleCallback(urlParams: URLSearchParams) {
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      console.error('OAuth error:', errorParam);
      error = 'Authentication failed: ' + errorParam;
      return;
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      error = 'Missing authorization code';
      return;
    }

    // Verify state parameter
    const storedState = sessionStorage.getItem('google_state');
    if (state !== storedState) {
      console.error('State parameter mismatch');
      error = 'State parameter mismatch';
      return;
    }

    // Get code verifier
    const codeVerifier = sessionStorage.getItem('google_code_verifier');
    if (!codeVerifier) {
      console.error('Missing code verifier');
      error = 'Missing code verifier';
      return;
    }

    try {
      status = 'Exchanging authorization code...';
      
      // Send code and verifier to backend for token exchange
      const backendResponse = await fetch(`${config.apiUrl}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: `${window.location.origin}/auth/google/callback`
        })
      });

      if (backendResponse.ok) {
        const responseData = await backendResponse.json();
        const token = responseData.token;
        
        // Store token
        setStoredToken(token);
        
        // Initialize auth store to fetch user info
        await authStore.initialize();

        // Clean up session storage
        sessionStorage.removeItem('google_code_verifier');
        sessionStorage.removeItem('google_state');

        status = 'Authentication successful! Redirecting...';
        
        // Redirect to dashboard
        setTimeout(() => {
          goto('/');
        }, 1000);
      } else {
        const errorData = await backendResponse.json();
        throw new Error(errorData.detail || errorData.error || 'Backend authentication failed');
      }

    } catch (err) {
      console.error('Error during authentication:', err);
      error = 'Authentication failed: ' + (err as Error).message;
    }
  }

  onMount(async () => {
    const urlParams = new URLSearchParams($page.url.search);
    await handleCallback(urlParams);
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-zinc-50">
  {#if error}
    <div class="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100 max-w-md w-full">
      <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </div>
      <h2 class="text-xl font-bold text-zinc-900 mb-2">Authentication Error</h2>
      <p class="text-zinc-600 mb-6">{error}</p>
      <button 
        on:click={() => goto('/login')}
        class="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
      >
        Back to Login
      </button>
    </div>
  {:else}
    <div class="flex flex-col items-center">
      <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-zinc-600 font-medium">{status}</p>
    </div>
  {/if}
</div>
