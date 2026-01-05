<!--
  CampaignInsightsPanel Component
  ================================
  Displays campaign metrics and analytics with visual charts.
  Uses inline SVG for lightweight, dependency-free visualizations.
-->

<script lang="ts">
  import type { CampaignInsightsResponse } from '$lib/api/campaigns';

  export let insights: CampaignInsightsResponse | null = null;
  export let isLoading: boolean = false;

  // Calculate percentages for visualizations
  $: deliveryRate =
    insights && insights.total_recipients > 0
      ? (insights.total_delivered / insights.total_recipients) * 100
      : 0;

  $: sentRate =
    insights && insights.total_recipients > 0
      ? (insights.total_sent / insights.total_recipients) * 100
      : 0;

  $: failRate =
    insights && insights.total_sent > 0 ? (insights.total_failed / insights.total_sent) * 100 : 0;

  $: replyRatePercent = insights ? insights.reply_rate * 100 : 0;

  // Delivery rate percentage
  $: deliveryRatePercent =
    insights && insights.total_sent > 0
      ? (insights.total_delivered / insights.total_sent) * 100
      : 0;

  function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  function formatTime(mins: number | null): string {
    if (!mins) return '—';
    if (mins < 60) return `${Math.round(mins)} min`;
    const hours = Math.floor(mins / 60);
    const remaining = Math.round(mins % 60);
    return `${hours}h ${remaining}m`;
  }

  // SVG ring chart helpers
  const ringRadius = 40;
  const ringStroke = 10;
  const ringCircumference = 2 * Math.PI * ringRadius;

  function getStrokeDashoffset(percent: number): number {
    return ringCircumference - (percent / 100) * ringCircumference;
  }
</script>

<div class="space-y-6">
  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="flex flex-col items-center gap-3">
        <div
          class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-sm text-gray-500">Loading insights...</p>
      </div>
    </div>
  {:else if !insights}
    <div class="flex flex-col items-center justify-center h-64 text-gray-400">
      <svg
        class="w-16 h-16 mb-4 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p class="text-base font-medium">No insights available yet</p>
      <p class="text-sm mt-1">Run a campaign to see analytics</p>
    </div>
  {:else}
    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <p class="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Sent</p>
        <p class="text-3xl font-bold mt-1">{formatNumber(insights.total_sent)}</p>
        <p class="text-blue-200 text-sm mt-1">{sentRate.toFixed(1)}% of recipients</p>
      </div>
      <div class="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white">
        <p class="text-emerald-100 text-xs font-medium uppercase tracking-wider">Delivered</p>
        <p class="text-3xl font-bold mt-1">{formatNumber(insights.total_delivered)}</p>
        <p class="text-emerald-200 text-sm mt-1">{deliveryRatePercent.toFixed(1)}% success rate</p>
      </div>
      <div class="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white">
        <p class="text-purple-100 text-xs font-medium uppercase tracking-wider">Replies</p>
        <p class="text-3xl font-bold mt-1">{formatNumber(insights.total_replies)}</p>
        <p class="text-purple-200 text-sm mt-1">{insights.unique_responders} unique responders</p>
      </div>
      <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
        <p class="text-amber-100 text-xs font-medium uppercase tracking-wider">Avg Response</p>
        <p class="text-3xl font-bold mt-1">{formatTime(insights.avg_response_time_mins)}</p>
        <p class="text-amber-200 text-sm mt-1">
          {insights.avg_response_time_mins && insights.avg_response_time_mins < 30
            ? '🔥 Fast!'
            : 'Time to first reply'}
        </p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Delivery Funnel -->
      <div
        class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
      >
        <h3 class="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg
              class="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </span>
          Delivery Funnel
        </h3>

        <div class="space-y-5">
          <!-- Recipients -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">Recipients</span>
              <span class="text-sm font-bold text-gray-900"
                >{formatNumber(insights.total_recipients)}</span
              >
            </div>
            <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"
                style="width: 100%"
              ></div>
            </div>
          </div>

          <!-- Sent -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">Sent</span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-blue-600 font-medium">{sentRate.toFixed(1)}%</span>
                <span class="text-sm font-bold text-gray-900"
                  >{formatNumber(insights.total_sent)}</span
                >
              </div>
            </div>
            <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                style="width: {sentRate}%"
              ></div>
            </div>
          </div>

          <!-- Delivered -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">Delivered</span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-green-600 font-medium">{deliveryRate.toFixed(1)}%</span>
                <span class="text-sm font-bold text-gray-900"
                  >{formatNumber(insights.total_delivered)}</span
                >
              </div>
            </div>
            <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                style="width: {deliveryRate}%"
              ></div>
            </div>
          </div>

          <!-- Failed -->
          {#if insights.total_failed > 0}
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">Failed</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-red-600 font-medium">{failRate.toFixed(1)}%</span>
                  <span class="text-sm font-bold text-red-600"
                    >{formatNumber(insights.total_failed)}</span
                  >
                </div>
              </div>
              <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-700"
                  style="width: {failRate}%"
                ></div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Reply Rate Ring Chart -->
      <div
        class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
      >
        <h3 class="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg
              class="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </span>
          Engagement Rate
        </h3>

        <div class="flex items-center justify-center gap-8">
          <!-- Ring Chart -->
          <div class="relative">
            <svg width="120" height="120" class="transform -rotate-90">
              <!-- Background ring -->
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                fill="none"
                stroke="#f3f4f6"
                stroke-width={ringStroke}
              />
              <!-- Progress ring -->
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                fill="none"
                stroke="url(#replyGrad)"
                stroke-width={ringStroke}
                stroke-linecap="round"
                stroke-dasharray={ringCircumference}
                stroke-dashoffset={getStrokeDashoffset(replyRatePercent)}
                class="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="replyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-bold text-gray-900">{replyRatePercent.toFixed(1)}%</span>
              <span class="text-xs text-gray-500">reply rate</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="space-y-4">
            <div>
              <p class="text-2xl font-bold text-purple-600">{insights.unique_responders}</p>
              <p class="text-sm text-gray-500">Unique responders</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{insights.total_replies}</p>
              <p class="text-sm text-gray-500">Total replies</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Insights -->
    {#if insights.ai_summary}
      <div
        class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 p-6"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">
              AI Insights
            </h3>
            <p class="text-sm text-gray-700 leading-relaxed">{insights.ai_summary}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Footer -->
    <p class="text-xs text-gray-400 text-center">
      Last calculated: {new Date(insights.calculated_at).toLocaleString()}
    </p>
  {/if}
</div>
