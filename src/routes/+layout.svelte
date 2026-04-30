<script lang="ts">
  /**
   * Root Layout
   * ===========
   * Initializes auth and provides global UI elements.
   */
  import { onMount } from 'svelte';
  import { authStore, toasts } from '$lib/stores';
  import '../app.css';

  // Initialize auth on mount
  onMount(async () => {
    await authStore.initialize();
  });
</script>

<!-- Toast notifications -->
{#if $toasts.length > 0}
  <div class="toast-container">
    {#each $toasts as toast (toast.id)}
      <div class="toast toast-{toast.type}">
        <span class="toast-message">{toast.message}</span>
      </div>
    {/each}
  </div>
{/if}

<div class="text-zinc-900">
  <slot />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      'Poppins',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      sans-serif;
    background: #09090b;
    color: #e4e4e7;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 9999;
    max-width: 400px;
  }

  .toast {
    padding: 0.875rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .toast-success {
    background: rgba(16, 185, 129, 0.9);
    color: white;
  }

  .toast-error {
    background: rgba(239, 68, 68, 0.9);
    color: white;
  }

  .toast-warning {
    background: rgba(251, 191, 36, 0.9);
    color: #1f2937;
  }

  .toast-info {
    background: rgba(99, 102, 241, 0.9);
    color: white;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
