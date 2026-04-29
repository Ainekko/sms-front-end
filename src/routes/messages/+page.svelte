<script lang="ts">
  /**
   * Legacy Messages Route - Redirect
   * ==================================
   * Redirects to the new brand-scoped messages route: /b/[brandId]/messages
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { brandsStore, loadBrands } from '$lib/stores/brandsStore';
  import { isAuthenticated, isAuthInitialized } from '$lib/stores';
  import { get } from 'svelte/store';

  $: if ($isAuthInitialized && !$isAuthenticated) {
    goto('/login');
  }

  onMount(async () => {
    // If we have a brand in URL params, use it
    const urlBrandId = $page.url.searchParams.get('brand');

    if ($brandsStore.brands.length === 0) {
      await loadBrands();
    }

    const state = get(brandsStore);
    const targetBrandId = urlBrandId || (state.brands.length > 0 ? state.brands[0].id : null);

    if (targetBrandId) {
      goto(`/b/${targetBrandId}/messages`, { replaceState: true });
    } else {
      // No brands — go to onboarding
      goto('/', { replaceState: true });
    }
  });
</script>

<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#fafafa;">
  <div style="width:2rem;height:2rem;border:3px solid rgba(24,24,27,0.1);border-top-color:#6366f1;border-radius:50%;animation:spin 1s linear infinite;"></div>
</div>

<style>
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>

