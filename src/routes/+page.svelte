<script lang="ts">
  /**
   * Root Page
   * =========
   * Redirects based on auth state.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated, isAuthInitialized } from '$lib/stores';

  // Redirect based on auth state
  $: if ($isAuthInitialized) {
    if ($isAuthenticated) {
      goto('/messages');
    } else {
      goto('/login');
    }
  }
</script>

<div class="loading-page">
  <div class="spinner"></div>
  <p class="loading-text">Loading...</p>
</div>

<style>
  .loading-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: #0f0f14;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
