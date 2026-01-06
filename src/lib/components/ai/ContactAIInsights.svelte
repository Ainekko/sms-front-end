<!--
  ContactAIInsights Component
  ============================
  Displays AI-powered insights for a selected contact.
  Modern zinc-based design with proper loading states.
-->

<script lang="ts">
  import AIGradientCard from './AIGradientCard.svelte';
  import { getContactAIInsights, type ContactAIInsightsResponse } from '$lib/api/ai';

  /** Contact ID to fetch insights for */
  export let contactId: string;

  /** Optional: Callback when insights load */
  export let onLoad: ((insights: ContactAIInsightsResponse) => void) | undefined = undefined;

  let insights: ContactAIInsightsResponse | null = null;
  let isLoading = true;
  let error: string | null = null;

  // Priority level configurations
  const priorityConfig: Record<number, { label: string; color: string }> = {
    3: { label: 'High', color: 'text-amber-400' },
    2: { label: 'Medium', color: 'text-emerald-400' },
    1: { label: 'Low', color: 'text-zinc-400' },
    0: { label: 'None', color: 'text-zinc-500' }
  };

  // Sentiment configurations
  const sentimentConfig: Record<string, { color: string }> = {
    positive: { color: 'text-emerald-400' },
    neutral: { color: 'text-zinc-400' },
    negative: { color: 'text-red-400' }
  };

  async function loadInsights() {
    if (!contactId) return;

    isLoading = true;
    error = null;

    try {
      insights = await getContactAIInsights(contactId);
      onLoad?.(insights);
    } catch (e) {
      console.error('[ContactAIInsights] Failed to load:', e);
      error = e instanceof Error ? e.message : 'Failed to load AI insights';
    } finally {
      isLoading = false;
    }
  }

  // Reload when contactId changes
  $: if (contactId) {
    loadInsights();
  }

  $: priority = insights?.ai_priority ?? null;
  $: priorityInfo =
    priority !== null && priority in priorityConfig ? priorityConfig[priority] : null;
  $: sentiment = insights?.insights?.sentiment?.toLowerCase() ?? null;
  $: sentimentInfo = sentiment && sentiment in sentimentConfig ? sentimentConfig[sentiment] : null;

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }
</script>

<AIGradientCard>
  <!-- Header -->
  <div class="flex items-center gap-3 mb-4">
    <div
      class="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center border border-zinc-600"
    >
      <svg class="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
    <div>
      <h3 class="text-sm font-semibold text-zinc-100">AI Analysis</h3>
      <p class="text-xs text-zinc-500">Contact insights</p>
    </div>
  </div>

  {#if isLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-8">
      <div class="flex flex-col items-center gap-3">
        <div class="relative w-8 h-8">
          <div class="absolute inset-0 rounded-full border-2 border-zinc-700"></div>
          <div class="absolute inset-0 rounded-full border-2 border-t-zinc-400 animate-spin"></div>
        </div>
        <span class="text-xs text-zinc-500">Analyzing...</span>
      </div>
    </div>
  {:else if error}
    <div class="py-6 text-center">
      <p class="text-sm text-red-400">{error}</p>
      <button class="mt-2 text-xs text-zinc-400 hover:text-zinc-300" on:click={loadInsights}>
        Try again
      </button>
    </div>
  {:else if insights}
    <!-- DNC Warning -->
    {#if insights.ai_do_not_contact}
      <div
        class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
      >
        <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span class="text-sm font-medium text-red-400">Do Not Contact</span>
      </div>
    {/if}

    <!-- Priority & Sentiment Row -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <!-- Priority Badge -->
      <div class="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/50">
        <span class="text-xs text-zinc-500 block mb-1">Priority</span>
        {#if priorityInfo}
          <span class="text-sm font-medium {priorityInfo.color}">{priorityInfo.label}</span>
        {:else}
          <span class="text-sm text-zinc-600">N/A</span>
        {/if}
      </div>

      <!-- Sentiment -->
      <div class="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/50">
        <span class="text-xs text-zinc-500 block mb-1">Sentiment</span>
        {#if sentimentInfo}
          <span class="text-sm font-medium {sentimentInfo.color} capitalize">{sentiment}</span>
        {:else}
          <span class="text-sm text-zinc-600">N/A</span>
        {/if}
      </div>
    </div>

    <!-- Summary -->
    {#if insights.insights?.summary}
      <div class="mb-4">
        <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2"
          >Summary</span
        >
        <p class="text-sm text-zinc-300 leading-relaxed">{insights.insights.summary}</p>
      </div>
    {/if}

    <!-- Interest Indicators -->
    {#if insights.insights?.interest_indicators?.length}
      <div class="mb-4">
        <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2"
          >Interests</span
        >
        <div class="flex flex-wrap gap-1.5">
          {#each insights.insights.interest_indicators as interest}
            <span
              class="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700"
            >
              {interest}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recommended Action -->
    {#if insights.insights?.recommended_action}
      <div class="mb-4 p-3 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
        <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">
          Next Step
        </span>
        <p class="text-sm text-zinc-300">{insights.insights.recommended_action}</p>
      </div>
    {/if}

    <!-- Last Analyzed -->
    <div class="text-xs text-zinc-600 text-center pt-3 border-t border-zinc-800">
      Last analyzed: {formatDate(insights.ai_last_analyzed)}
    </div>
  {:else}
    <div class="py-6 text-center text-zinc-500">
      <p class="text-sm">No insights available</p>
    </div>
  {/if}
</AIGradientCard>
