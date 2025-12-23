<script lang="ts">
  /**
   * Login Page
   * ==========
   * Public login page for user authentication.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore, isAuthenticated, isAuthInitialized } from '$lib/stores';
  import LoginForm from '$lib/components/auth/LoginForm.svelte';

  // Redirect if already authenticated
  $: if ($isAuthInitialized && $isAuthenticated) {
    goto('/messages');
  }

  /**
   * Handle successful login.
   */
  function handleSuccess() {
    goto('/messages');
  }
</script>

<svelte:head>
  <title>Login | SMS Manager</title>
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

    <LoginForm on:success={handleSuccess} />
  </div>
</div>
