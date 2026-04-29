<script lang="ts">
  /**
   * Brand Root Page
   * ================
   * Redirects to the messages sub-route for this brand.
   */
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let data;

  $: if (data.brandId) {
    goto(`/b/${data.brandId}/messages`, { replaceState: true });
  }
</script>

<div class="flex items-center justify-center h-screen bg-zinc-50">
  <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
</div>
