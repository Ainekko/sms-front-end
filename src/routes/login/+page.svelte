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

<div class="login-page">
  <div class="login-container">
    <div class="brand">
      <div class="brand-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <span class="brand-name">SMS Manager</span>
    </div>

    <LoginForm on:success={handleSuccess} />
  </div>

  <div class="page-decoration">
    <div class="decoration-circle decoration-1"></div>
    <div class="decoration-circle decoration-2"></div>
    <div class="decoration-circle decoration-3"></div>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f0f14 0%, #1a1a2e 50%, #16213e 100%);
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    z-index: 10;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-logo {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }

  .brand-logo svg {
    width: 100%;
    height: 100%;
    color: white;
  }

  .brand-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.025em;
  }

  /* Background decoration */
  .page-decoration {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
  }

  .decoration-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #6366f1 0%, transparent 70%);
    top: -200px;
    right: -200px;
  }

  .decoration-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
  }

  .decoration-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
