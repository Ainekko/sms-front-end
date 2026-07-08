<script lang="ts">
  /**
   * Brand Analytics Page
   * =====================
   * Detailed dashboard displaying metrics, chart volumes, and AI insights.
   */
  import { selectedBrand } from '$lib/stores/brandsStore';
  import AnalyticsTab from '$lib/components/analytics/AnalyticsTab.svelte';

  export let data;
  $: brandId = data.brandId;
  $: brand = $selectedBrand;

  function formatPhone(phone: string): string {
    if (!phone) return '';
    const d = phone.replace(/^\+/, '');
    if (d.length === 11 && d.startsWith('1'))
      return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return phone;
  }
</script>

<svelte:head>
  <title>{brand?.name || 'Analytics'} | Broadr</title>
</svelte:head>

<div class="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
  <!-- Page Header -->
  <div class="flex items-center justify-between pb-6 border-b border-white/[0.04]">
    <div>
      <h1 class="text-2xl font-extrabold text-white font-[Poppins] tracking-tight">
        {#if brand}
          {brand.name} Analytics
        {:else}
          Brand Analytics
        {/if}
      </h1>
      {#if brand}
        <span class="text-xs font-semibold text-zinc-500 font-[Poppins] mt-1 block">{formatPhone(brand.phoneNumber)}</span>
      {/if}
    </div>
  </div>

  <!-- Analytics View -->
  <AnalyticsTab />
</div>
