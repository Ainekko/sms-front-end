<script lang="ts">
  /**
   * Login Page
   * ==========
   * Public login page — creatorbook-style split layout.
   */
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  import { authStore, isAuthenticated, isAuthInitialized } from '$lib/stores';

  // Redirect if already authenticated
  $: if ($isAuthInitialized && $isAuthenticated) {
    goto('/');
  }

  let email = '';
  let password = '';
  let loading = false;
  let formError = '';

  let emailFocused = false;
  let passwordFocused = false;
  let emailValid = true;
  let passwordValid = true;

  function validateForm(): boolean {
    emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    passwordValid = password.length > 0;
    return emailValid && passwordValid;
  }

  async function handleLogin() {
    if (!validateForm()) {
      formError = 'Please check the form for errors';
      return;
    }

    loading = true;
    formError = '';

    const success = await authStore.login(email, password);

    if (success) {
      goto('/');
    } else {
      formError = 'Invalid email or password. Please try again.';
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>Login | Broadr</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex items-center justify-center p-4 lg:p-8">
  <div
    class="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]"
  >
    <!-- Left Side: Login Form -->
    <div class="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center relative">
      <div class="max-w-md mx-auto w-full">
        <!-- Logo -->
        <a href="/" class="inline-block mb-12 text-2xl font-bold text-zinc-900">
          broad<span class="font-['Pacifico'] text-indigo-600">r</span>
        </a>

        <div class="mb-10">
          <h1 class="text-3xl lg:text-4xl font-bold text-zinc-900 mb-3">Welcome back</h1>
          <p class="text-zinc-500">Enter your details to access your dashboard.</p>
        </div>

        <form on:submit|preventDefault={handleLogin} class="space-y-5">
          <!-- Email -->
          <div>
            <label for="login-email" class="block text-sm font-medium text-zinc-700 mb-1.5">Email Address</label>
            <div class="relative">
              <input
                type="email"
                id="login-email"
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
            <label for="login-password" class="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <div class="relative">
              <input
                type="password"
                id="login-password"
                placeholder="••••••••"
                bind:value={password}
                on:focus={() => (passwordFocused = true)}
                on:blur={() => (passwordFocused = false)}
                disabled={loading}
                class="w-full px-4 py-3 rounded-xl border bg-zinc-50 focus:bg-white transition-all outline-none text-zinc-900
                  {passwordFocused ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'}
                  {!passwordValid && password ? 'border-red-500 bg-red-50' : ''}"
                autocomplete="current-password"
              />
            </div>
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
              Logging in...
            {:else}
              Log In
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            {/if}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-zinc-500">
          Don't have an account?
          <a href="/signup" class="font-semibold text-zinc-900 hover:underline">Sign up for free</a>
        </p>
      </div>
    </div>

    <!-- Right Side: Info Panel -->
    <div
      class="hidden lg:flex w-1/2 bg-zinc-900 p-16 flex-col justify-between relative overflow-hidden"
    >
      <!-- Background Decoration -->
      <div
        class="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"
      ></div>

      <div class="relative z-10">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/80 text-xs font-medium mb-8"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span>SMS Fact</span>
        </div>

        <h2 class="text-4xl font-bold text-white mb-6 leading-tight">
          SMS messages have a
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">98%</span>
          open rate.
        </h2>
        <p class="text-zinc-400 text-lg leading-relaxed max-w-md">
          Compared to email's 20%, SMS is the most direct way to reach your customers.
          Broadr makes bulk messaging effortless.
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 gap-4 relative z-10 mt-12">
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <svg class="w-8 h-8 text-indigo-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h13" />
          </svg>
          <div class="text-3xl font-bold text-white mb-1">10x</div>
          <div class="text-sm text-zinc-400">Faster Outreach</div>
        </div>
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <svg class="w-8 h-8 text-violet-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <div class="text-3xl font-bold text-white mb-1">Multi</div>
          <div class="text-sm text-zinc-400">Brand Support</div>
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
