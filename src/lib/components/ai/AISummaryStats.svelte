<!--
  AISummaryStats Component
  =========================
  Overview stats widget showing AI analysis summary.
  Modern zinc-based design.
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import AIGradientCard from './AIGradientCard.svelte';
  import { aiSummary, loadAISummary, aiStore } from '$lib/stores/aiStore';

  /** Brand ID to load summary for */
  export let brandId: string | null = null;

  /** Compact mode for smaller spaces */
  export let compact = false;

  const dispatch = createEventDispatcher<{
    viewHotLeads: void;
    viewDNC: void;
    viewPriority: { priority: number };
  }>();

  // Load on mount or brandId change
  $: {
    loadAISummary(brandId ?? undefined);
  }

  $: summary = $aiSummary;
  $: loading = $aiStore.isLoadingSummary;

  // Calculate percentages for progress bars
  $: totalAnalyzed = summary?.analyzed_contacts ?? 0;
  $: p3Percent = totalAnalyzed > 0 ? ((summary?.priority_3_count ?? 0) / totalAnalyzed) * 100 : 0;
  $: p2Percent = totalAnalyzed > 0 ? ((summary?.priority_2_count ?? 0) / totalAnalyzed) * 100 : 0;
  $: p1Percent = totalAnalyzed > 0 ? ((summary?.priority_1_count ?? 0) / totalAnalyzed) * 100 : 0;
  $: p0Percent = totalAnalyzed > 0 ? ((summary?.priority_0_count ?? 0) / totalAnalyzed) * 100 : 0;

  function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }
</script>

<AIGradientCard variant={compact ? 'compact' : 'default'}>
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <div
        class="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center border border-zinc-600"
      >
        <svg
          class="w-3.5 h-3.5 text-zinc-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 class="text-sm font-semibold text-zinc-100">AI Analysis</h3>
    </div>

    {#if loading}
      <div class="relative w-4 h-4">
        <div class="absolute inset-0 rounded-full border border-zinc-700"></div>
        <div class="absolute inset-0 rounded-full border border-t-zinc-400 animate-spin"></div>
      </div>
    {/if}
  </div>

  {#if !summary && !loading}
    <p class="text-sm text-zinc-500 text-center py-4">No data available</p>
  {:else if summary}
    <!-- Quick Stats Row -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <button
        class="p-2.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-all text-left"
        on:click={() => dispatch('viewHotLeads')}
      >
        <span class="text-lg font-semibold text-amber-400"
          >{formatNumber(summary.priority_3_count)}</span
        >
        <span class="text-xs text-zinc-500 block mt-0.5">Hot</span>
      </button>

      <div class="p-2.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-left">
        <span class="text-lg font-semibold text-zinc-300"
          >{formatNumber(summary.analyzed_contacts)}</span
        >
        <span class="text-xs text-zinc-500 block mt-0.5">Analyzed</span>
      </div>

      <button
        class="p-2.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-all text-left"
        on:click={() => dispatch('viewDNC')}
      >
        <span class="text-lg font-semibold text-zinc-400"
          >{formatNumber(summary.do_not_contact_count)}</span
        >
        <span class="text-xs text-zinc-500 block mt-0.5">DNC</span>
      </button>
    </div>

    <!-- Priority Breakdown -->
    {#if !compact}
      <div class="space-y-2">
        <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Priority</p>

        <!-- Priority 3 -->
        <button
          class="w-full flex items-center gap-2 group"
          on:click={() => dispatch('viewPriority', { priority: 3 })}
        >
          <span class="text-xs w-12 text-left text-zinc-500 group-hover:text-zinc-400">High</span>
          <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-amber-500/60 rounded-full transition-all"
              style="width: {p3Percent}%"
            ></div>
          </div>
          <span class="text-xs text-zinc-500 w-6 text-right">{summary.priority_3_count}</span>
        </button>

        <!-- Priority 2 -->
        <button
          class="w-full flex items-center gap-2 group"
          on:click={() => dispatch('viewPriority', { priority: 2 })}
        >
          <span class="text-xs w-12 text-left text-zinc-500 group-hover:text-zinc-400">Medium</span>
          <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500/60 rounded-full transition-all"
              style="width: {p2Percent}%"
            ></div>
          </div>
          <span class="text-xs text-zinc-500 w-6 text-right">{summary.priority_2_count}</span>
        </button>

        <!-- Priority 1 -->
        <button
          class="w-full flex items-center gap-2 group"
          on:click={() => dispatch('viewPriority', { priority: 1 })}
        >
          <span class="text-xs w-12 text-left text-zinc-500 group-hover:text-zinc-400">Low</span>
          <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-zinc-600 rounded-full transition-all"
              style="width: {p1Percent}%"
            ></div>
          </div>
          <span class="text-xs text-zinc-500 w-6 text-right">{summary.priority_1_count}</span>
        </button>

        <!-- Priority 0 -->
        <button
          class="w-full flex items-center gap-2 group"
          on:click={() => dispatch('viewPriority', { priority: 0 })}
        >
          <span class="text-xs w-12 text-left text-zinc-500 group-hover:text-zinc-400">None</span>
          <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-zinc-700 rounded-full transition-all"
              style="width: {p0Percent}%"
            ></div>
          </div>
          <span class="text-xs text-zinc-500 w-6 text-right">{summary.priority_0_count}</span>
        </button>
      </div>
    {/if}
  {/if}
</AIGradientCard>
