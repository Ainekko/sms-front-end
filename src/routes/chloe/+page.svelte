<script lang="ts">
  /**
   * Dashboard Page
   * ==============
   * Master dashboard displaying recent Chloe calls.
   * Design matching Chloe V1, utilizing existing backend fields.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore, isAuthenticated, isAuthInitialized, currentUser } from '$lib/stores';
  import { chloeApi, type ChloeCall } from '$lib/api/chloe';
  import Card from './components/Card.svelte';
  import Button from './components/Button.svelte';
  import Badge from './components/Badge.svelte';
  import Spinner from './components/Spinner.svelte';

  // Auth guard
  $: if ($isAuthInitialized && !$isAuthenticated) {
    goto('/login');
  }

  // State
  let recentCalls: ChloeCall[] = [];
  let loadingCalls = true;
  let expandedCallId: string | null = null;

  onMount(async () => {
    try {
      recentCalls = await chloeApi.listCalls(50, 0);
    } catch (e) {
      recentCalls = [];
      console.error('Failed to load calls:', e);
    } finally {
      loadingCalls = false;
    }
  });

  function handleLogout() {
    authStore.logout();
    goto('/login');
  }

  function toggleCallDetail(callId: string) {
    expandedCallId = expandedCallId === callId ? null : callId;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function formatDuration(ms: number | null): string {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function getSentimentVariant(
    sentiment: string | null
  ): 'success' | 'warning' | 'error' | 'neutral' {
    if (!sentiment) return 'neutral';
    const s = sentiment.toLowerCase();
    if (s === 'positive') return 'success';
    if (s === 'negative') return 'error';
    return 'neutral';
  }

  function getCallerDisplay(call: ChloeCall): { name: string; sub: string | null } {
    const defaultNumber = call.direction === 'outbound' ? call.to_number : call.from_number;
    return { name: defaultNumber || 'Unknown Caller', sub: null };
  }
</script>

<svelte:head>
  <title>Dashboard | Chloe</title>
</svelte:head>

{#if !$isAuthInitialized}
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-900">
    <Spinner size="lg" />
  </div>
{:else}
  <div class="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
    <!-- Top Bar -->
    <header class="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg
              class="w-4.5 h-4.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <span class="text-base font-semibold text-zinc-900">Chloe</span>
        </div>
        <div class="flex items-center gap-4">
          {#if $currentUser}
            <span class="text-sm text-zinc-500">{$currentUser.email}</span>
          {/if}
          <Button variant="ghost" size="sm" on:click={handleLogout}>Logout</Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      <div class="mb-6 flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-zinc-900">Chloe Calls</h1>
        <p class="text-sm text-zinc-500">
          Review all your recent Chloe interactions and transcripts.
        </p>
      </div>

      <!-- ═══════════════════════ Recent Calls Table ═══════════════════════ -->
      <Card padding="p-0">
        <div class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 class="text-sm font-medium text-zinc-500">Recent Calls</h3>
          <span class="text-xs text-zinc-400">{recentCalls.length} calls</span>
        </div>

        {#if loadingCalls}
          <div class="flex items-center justify-center py-12">
            <Spinner />
          </div>
        {:else if recentCalls.length === 0}
          <div class="text-center py-12 text-sm text-zinc-400">
            <svg
              class="w-10 h-10 mx-auto mb-3 text-zinc-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            No calls yet. Wait for inbound or outbound interactions to occur.
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  <th class="px-6 py-3 w-5"></th>
                  <th class="px-6 py-3">Phone</th>
                  <th class="px-6 py-3">Summary</th>
                  <th class="px-6 py-3">Duration</th>
                  <th class="px-6 py-3">Sentiment</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {#each recentCalls as call (call.call_id)}
                  {@const caller = getCallerDisplay(call)}
                  {@const isExpanded = expandedCallId === call.call_id}

                  <!-- Main row -->
                  <tr
                    class="border-t border-zinc-100 hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    on:click={() => toggleCallDetail(call.call_id)}
                  >
                    <!-- Expand chevron -->
                    <td class="pl-5 pr-0 py-3.5">
                      <svg
                        class="w-4 h-4 text-zinc-400 transition-transform duration-200 {isExpanded
                          ? 'rotate-90'
                          : ''}"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>

                    <!-- Caller -->
                    <td class="px-6 py-3.5">
                      <div class="flex flex-col gap-1">
                        <span class="text-sm font-medium text-zinc-900 font-mono"
                          >{caller.name}</span
                        >
                      </div>
                    </td>

                    <!-- Summary -->
                    <td class="px-6 py-3.5 max-w-xs">
                      <p class="text-sm text-zinc-600 truncate" title={call.call_summary || ''}>
                        {call.call_summary || '--'}
                      </p>
                    </td>

                    <!-- Duration -->
                    <td class="px-6 py-3.5 text-sm text-zinc-600 font-mono">
                      {formatDuration(call.duration_ms)}
                    </td>

                    <!-- Sentiment -->
                    <td class="px-6 py-3.5">
                      <Badge variant={getSentimentVariant(call.user_sentiment)}>
                        {call.user_sentiment || '--'}
                      </Badge>
                    </td>

                    <!-- Status indicators -->
                    <td class="px-6 py-3.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        <Badge variant={call.call_successful ? 'success' : 'neutral'}>
                          {call.call_successful ? 'Successful' : call.call_status || '--'}
                        </Badge>
                      </div>
                    </td>

                    <!-- Time -->
                    <td class="px-6 py-3.5 text-sm text-zinc-400 whitespace-nowrap">
                      {formatTime(call.created_at)}
                    </td>
                  </tr>

                  <!-- ── Expandable Detail Row ────────────────────────────── -->
                  {#if isExpanded}
                    <tr>
                      <td colspan="7" class="p-0 border-t border-zinc-100">
                        <div class="px-6 py-5 bg-zinc-50/60 border-b border-zinc-100">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <!-- Card 1: Call Details -->
                            <div
                              class="bg-white rounded-lg border border-zinc-200/60 p-4 shadow-sm"
                            >
                              <h4
                                class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3"
                              >
                                Call Details
                              </h4>
                              <div class="space-y-2.5">
                                <div class="flex items-center gap-2">
                                  <svg
                                    class="w-4 h-4 text-zinc-400 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    ></path></svg
                                  >
                                  <span class="text-sm text-zinc-700 font-mono"
                                    >From: {call.from_number || '--'}</span
                                  >
                                </div>
                                <div class="flex items-center gap-2">
                                  <svg
                                    class="w-4 h-4 text-zinc-400 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    ></path></svg
                                  >
                                  <span class="text-sm text-zinc-700 font-mono"
                                    >To: {call.to_number || '--'}</span
                                  >
                                </div>
                              </div>
                            </div>

                            <!-- Card 2: Technical Info -->
                            <div
                              class="bg-white rounded-lg border border-zinc-200/60 p-4 shadow-sm"
                            >
                              <h4
                                class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3"
                              >
                                Technical Info
                              </h4>
                              <div class="space-y-2.5 text-sm">
                                <div class="flex justify-between">
                                  <span class="text-zinc-400">Direction</span>
                                  <span class="text-zinc-700 capitalize"
                                    >{call.direction || '--'}</span
                                  >
                                </div>
                                <div class="flex justify-between">
                                  <span class="text-zinc-400">Disconnection</span>
                                  <span class="text-zinc-700"
                                    >{call.disconnection_reason || '--'}</span
                                  >
                                </div>
                                <div class="flex justify-between items-center">
                                  <span class="text-zinc-400">Call ID</span>
                                  <span
                                    class="text-zinc-500 font-mono text-xs truncate max-w-[140px]"
                                    title={call.call_id}>{call.call_id}</span
                                  >
                                </div>
                                {#if call.recording_url}
                                  <div class="pt-1">
                                    <a
                                      href={call.recording_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      class="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                                    >
                                      <svg
                                        class="w-3.5 h-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                      >
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                      </svg>
                                      Play Recording
                                    </a>
                                  </div>
                                {/if}
                              </div>
                            </div>
                          </div>

                          <!-- Transcript Block -->
                          <div
                            class="bg-white rounded-lg border border-zinc-200/60 overflow-hidden shadow-sm"
                          >
                            <div
                              class="px-4 py-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center gap-2"
                            >
                              <svg
                                class="w-4 h-4 text-zinc-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                ></path></svg
                              >
                              <span
                                class="text-xs font-semibold text-zinc-600 uppercase tracking-wider"
                                >Full Transcript</span
                              >
                            </div>
                            <div class="p-5 max-h-[400px] overflow-y-auto">
                              {#if call.transcript}
                                <p
                                  class="text-sm text-zinc-600 font-mono leading-relaxed whitespace-pre-wrap"
                                >
                                  {call.transcript}
                                </p>
                              {:else}
                                <p class="text-sm text-zinc-400 italic">
                                  No transcript available for this call.
                                </p>
                              {/if}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </Card>
    </main>
  </div>
{/if}

<style>
  /* Base styles for table hover states in case tailwind group-hover isn't enough */
  :global(tr.group:hover td) {
    background-color: rgba(250, 250, 250, 0.8);
  }
</style>
