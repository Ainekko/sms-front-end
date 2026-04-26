<script lang="ts">
  /**
   * Signup Page
   * ===========
   * Public signup page for new user self-registration.
   */
  import { goto } from '$app/navigation';
  import { authStore, isAuthenticated, isAuthInitialized, isAuthLoading, authError } from '$lib/stores';

  // Redirect if already authenticated
  $: if ($isAuthInitialized && $isAuthenticated) {
    goto('/messages');
  }

  let email = '';
  let password = '';
  let confirmPassword = '';
  let formError = '';

  $: if ($authError) {
    formError = $authError;
  }

  async function handleSignup() {
    if (!email.trim()) {
      formError = 'Email is required';
      return;
    }
    if (!password) {
      formError = 'Password is required';
      return;
    }
    if (password.length < 8) {
      formError = 'Password must be at least 8 characters';
      return;
    }
    if (password !== confirmPassword) {
      formError = 'Passwords do not match';
      return;
    }

    formError = '';
    authStore.clearError();

    const success = await authStore.signup(email, password);

    if (success) {
      goto('/messages');
    }
  }
</script>

<svelte:head>
  <title>Sign Up | SMS Manager</title>
</svelte:head>

<div
  class="min-h-screen w-full flex items-center justify-center bg-[#0f0f14] relative overflow-hidden"
>
  <!-- Background Decorations -->
  <div
    class="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"
  ></div>
  <div
    class="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"
  ></div>
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"
  ></div>

  <div class="relative z-10 w-full max-w-md flex flex-col items-center gap-8 px-4">
    <div class="flex items-center gap-3">
      <div
        class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
      >
        <svg
          class="w-7 h-7 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <span class="text-2xl font-bold text-white tracking-tight">SMS Manager</span>
    </div>

    <form on:submit|preventDefault={handleSignup} class="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
        <p class="text-slate-400 text-sm">Start sending SMS in minutes</p>
      </div>

      {#if formError}
        <div class="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span>{formError}</span>
        </div>
      {/if}

      <div class="mb-5">
        <label for="signup-email" class="block text-slate-300 text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          id="signup-email"
          bind:value={email}
          placeholder="you@example.com"
          class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={$isAuthLoading}
          autocomplete="email"
        />
      </div>

      <div class="mb-5">
        <label for="signup-password" class="block text-slate-300 text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          id="signup-password"
          bind:value={password}
          placeholder="••••••••"
          class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={$isAuthLoading}
          autocomplete="new-password"
        />
        <p class="mt-1.5 text-xs text-slate-500">Minimum 8 characters</p>
      </div>

      <div class="mb-6">
        <label for="signup-confirm" class="block text-slate-300 text-sm font-medium mb-2">Confirm Password</label>
        <input
          type="password"
          id="signup-confirm"
          bind:value={confirmPassword}
          placeholder="••••••••"
          class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={$isAuthLoading}
          autocomplete="new-password"
        />
      </div>

      <button
        type="submit"
        class="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        disabled={$isAuthLoading}
      >
        {#if $isAuthLoading}
          <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" class="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75" />
          </svg>
          <span>Creating account...</span>
        {:else}
          <span>Create Account</span>
        {/if}
      </button>

      <p class="mt-6 text-center text-sm text-slate-400">
        Already have an account?
        <a href="/login" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Sign in
        </a>
      </p>
    </form>
  </div>
</div>
