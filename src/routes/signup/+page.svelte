<script lang="ts">
  /**
   * Signup Page
   * ===========
   * Public signup page — creatorbook-style split layout.
   */
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  import { authStore, isAuthenticated, isAuthInitialized } from '$lib/stores';

  // Redirect if already authenticated
  $: if ($isAuthInitialized && $isAuthenticated) {
    goto('/messages');
  }

  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let formError = '';

  let emailFocused = false;
  let passwordFocused = false;
  let confirmFocused = false;
  let emailValid = true;
  let passwordValid = true;
  let confirmValid = true;

  function validateForm(): boolean {
    emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    passwordValid = password.length >= 8;
    confirmValid = password === confirmPassword && confirmPassword.length > 0;
    return emailValid && passwordValid && confirmValid;
  }

  async function handleSignup() {
    if (!validateForm()) {
      formError = 'Please check the form for errors';
      return;
    }

    loading = true;
    formError = '';

    const success = await authStore.signup(email, password);

    if (success) {
      goto('/messages');
    } else {
      // Error is set in the store, pick it up
      const state = await new Promise<any>((resolve) => {
        const unsub = authStore.subscribe((s) => {
          resolve(s);
          setTimeout(() => unsub(), 0);
        });
      });
      formError = state.error || 'Signup failed. Please try again.';
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>Sign Up | Broadr</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex items-center justify-center p-4 lg:p-8">
  <div
    class="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]"
  >
    <!-- Left Side: Sign Up Form -->
    <div class="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center relative">
      <div class="max-w-md mx-auto w-full">
        <!-- Logo -->
        <a href="/" class="inline-block mb-12 text-2xl font-bold text-zinc-900">
          broad<span class="font-['Pacifico'] text-indigo-600">r</span>
        </a>

        <div class="mb-10">
          <h1 class="text-3xl lg:text-4xl font-bold text-zinc-900 mb-3">Create your account</h1>
          <p class="text-zinc-500">Get started with the free plan. Upgrade anytime.</p>
        </div>

        <form on:submit|preventDefault={handleSignup} class="space-y-5">
          <!-- Email -->
          <div>
            <label for="signup-email" class="block text-sm font-medium text-zinc-700 mb-1.5">Email Address</label>
            <div class="relative">
              <input
                type="email"
                id="signup-email"
                placeholder="you@company.com"
                bind:value={email}
                on:focus={() => (emailFocused = true)}
                on:blur={() => (emailFocused = false)}
                disabled={loading}
                class="w-full px-4 py-3 rounded-xl border bg-zinc-50 focus:bg-white transition-all outline-none text-zinc-900
                  {emailFocused ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'}
                  {!emailValid && email ? 'border-red-500 bg-red-50' : ''}"
                autocomplete="email"
              />
            </div>
            {#if !emailValid && email}
              <p class="text-red-500 text-xs mt-1.5 ml-1" transition:fly={{ y: -5, duration: 200 }}>
                Please enter a valid email address
              </p>
            {/if}
          </div>

          <!-- Password -->
          <div>
            <label for="signup-password" class="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <div class="relative">
              <input
                type="password"
                id="signup-password"
                placeholder="••••••••"
                bind:value={password}
                on:focus={() => (passwordFocused = true)}
                on:blur={() => (passwordFocused = false)}
                disabled={loading}
                class="w-full px-4 py-3 rounded-xl border bg-zinc-50 focus:bg-white transition-all outline-none text-zinc-900
                  {passwordFocused ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'}
                  {!passwordValid && password ? 'border-red-500 bg-red-50' : ''}"
                autocomplete="new-password"
              />
            </div>
            {#if !passwordValid && password}
              <p class="text-red-500 text-xs mt-1.5 ml-1" transition:fly={{ y: -5, duration: 200 }}>
                Password must be at least 8 characters
              </p>
            {/if}
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="signup-confirm" class="block text-sm font-medium text-zinc-700 mb-1.5">Confirm Password</label>
            <div class="relative">
              <input
                type="password"
                id="signup-confirm"
                placeholder="••••••••"
                bind:value={confirmPassword}
                on:focus={() => (confirmFocused = true)}
                on:blur={() => (confirmFocused = false)}
                disabled={loading}
                class="w-full px-4 py-3 rounded-xl border bg-zinc-50 focus:bg-white transition-all outline-none text-zinc-900
                  {confirmFocused ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'}
                  {!confirmValid && confirmPassword ? 'border-red-500 bg-red-50' : ''}"
                autocomplete="new-password"
              />
            </div>
            {#if !confirmValid && confirmPassword}
              <p class="text-red-500 text-xs mt-1.5 ml-1" transition:fly={{ y: -5, duration: 200 }}>
                Passwords do not match
              </p>
            {/if}
          </div>

          {#if formError}
            <div
              class="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
              transition:fly={{ y: -5, duration: 200 }}
            >
              <div class="w-1.5 h-1.5 rounded-full bg-red-600"></div>
              {formError}
            </div>
          {/if}

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-zinc-900 text-white font-medium py-3.5 rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
          >
            {#if loading}
              <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating account...
            {:else}
              Get Started
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            {/if}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-zinc-500">
          Already have an account?
          <a href="/login" class="font-semibold text-zinc-900 hover:underline">Log in</a>
        </p>
      </div>
    </div>

    <!-- Right Side: Info Panel -->
    <div
      class="hidden lg:flex w-1/2 bg-zinc-900 p-16 flex-col justify-between relative overflow-hidden"
    >
      <!-- Background Decoration -->
      <div
        class="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"
      ></div>

      <div class="relative z-10">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/80 text-xs font-medium mb-8"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span>Why Broadr?</span>
        </div>

        <h2 class="text-4xl font-bold text-white mb-6 leading-tight">
          Reach
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">thousands</span>
          of customers in seconds.
        </h2>
        <p class="text-zinc-400 text-lg leading-relaxed max-w-md">
          Multi-brand bulk SMS, smart campaigns, AI-powered contact insights —
          all from one dashboard. Your Twilio account, your data.
        </p>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-2 gap-4 relative z-10 mt-12">
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <svg class="w-8 h-8 text-green-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          <div class="text-3xl font-bold text-white mb-1">Free</div>
          <div class="text-sm text-zinc-400">To Get Started</div>
        </div>
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <svg class="w-8 h-8 text-blue-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <div class="text-3xl font-bold text-white mb-1">Secure</div>
          <div class="text-sm text-zinc-400">Your Own Keys</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

  :global(body) {
    font-family: 'Poppins', sans-serif;
  }
</style>
