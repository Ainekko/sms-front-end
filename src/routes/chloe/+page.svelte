<!--
  Chloe Calls Page
  ================
  Master-detail view for viewing Retell.ai call recordings.
  Design inspired by the groups page for consistency.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { chloeApi, type ChloeCall } from '$lib/api/chloe';
  import { showError } from '$lib/stores/uiStore';

  // State
  let calls: ChloeCall[] = [];
  let selectedCall: ChloeCall | null = null;
  let isLoading = true;
  let searchQuery = '';

  // Filtered calls
  $: filteredCalls = calls.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.call_id.toLowerCase().includes(q) ||
      (c.transcript && c.transcript.toLowerCase().includes(q)) ||
      (c.call_summary && c.call_summary.toLowerCase().includes(q))
    );
  });

  // URL State Management
  $: selectedCallId = $page.url.searchParams.get('id');

  $: if (selectedCallId && calls.length > 0) {
    const call = calls.find((c) => c.call_id === selectedCallId);
    if (call && selectedCall?.call_id !== call.call_id) {
      selectedCall = call;
    }
  } else if (!selectedCallId) {
    selectedCall = null;
  }

  onMount(async () => {
    await loadCalls();
  });

  async function loadCalls() {
    isLoading = true;
    try {
      calls = await chloeApi.listCalls();
      
      // If ID in URL, select it
      if (selectedCallId) {
        const call = calls.find((c) => c.call_id === selectedCallId);
        if (call) {
          selectedCall = call;
        }
      }
    } catch (err) {
      console.error('Failed to load calls:', err);
      showError('Failed to load calls');
    } finally {
      isLoading = false;
    }
  }

  function selectCall(call: ChloeCall) {
    selectedCall = call;
    const url = new URL(window.location.href);
    url.searchParams.set('id', call.call_id);
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function handleBack() {
    goto('/messages');
  }

  function formatDuration(ms: number | null): string {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function getSentimentColor(sentiment: string | null): string {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-700';
      case 'negative':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }

  function getStatusColor(successful: boolean | null): string {
    if (successful === true) return 'bg-emerald-100 text-emerald-700';
    if (successful === false) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  }
</script>

<div class="flex h-screen bg-gray-50 font-sans overflow-hidden">
  <!-- Sidebar -->
  <aside
    class="w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
  >
    <!-- Header -->
    <div class="p-6 border-b border-gray-100">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-3">
          <button
            class="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            on:click={handleBack}
            title="Back to Messages"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900 tracking-tight">Chloe Calls</h1>
        </div>
        <!-- Phone icon -->
        <div class="p-2 text-indigo-600 bg-indigo-50 rounded-xl">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
      </div>

      <!-- Search -->
      <div class="relative group">
        <svg
          class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search calls..."
          class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900
                 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
        />
      </div>
    </div>

    <!-- Call List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      {#if isLoading}
        <div class="flex justify-center py-12">
          <div
            class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
      {:else if calls.length === 0}
        <div class="text-center py-12 px-4">
          <div
            class="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <p class="text-base font-semibold text-gray-900">No calls yet</p>
          <p class="text-sm text-gray-500 mt-1">Calls from Chloe will appear here</p>
        </div>
      {:else if filteredCalls.length === 0}
        <div class="text-center py-12">
          <p class="text-gray-500">No calls match your search</p>
        </div>
      {:else}
        {#each filteredCalls as call (call.id)}
          <button
            class="w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden
                   {selectedCall?.call_id === call.call_id ? 'bg-indigo-50 shadow-sm' : 'hover:bg-gray-50'}"
            on:click={() => selectCall(call)}
          >
            {#if selectedCall?.call_id === call.call_id}
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"
              ></div>
            {/if}

            <!-- Call Icon -->
            <div
              class="flex-shrink-0 transition-transform duration-200 {selectedCall?.call_id === call.call_id
                ? 'scale-110'
                : 'group-hover:scale-105'}"
            >
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center
                          {selectedCall?.call_id === call.call_id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'}"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p
                  class="text-sm font-semibold truncate {selectedCall?.call_id === call.call_id
                    ? 'text-gray-900'
                    : 'text-gray-700'}"
                >
                  {formatDate(call.created_at)}
                </p>
                {#if call.user_sentiment}
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-medium {getSentimentColor(call.user_sentiment)}"
                  >
                    {call.user_sentiment}
                  </span>
                {/if}
              </div>
              <p
                class="text-xs truncate mt-0.5 {selectedCall?.call_id === call.call_id
                  ? 'text-indigo-600 font-medium'
                  : 'text-gray-500'}"
              >
                {formatDuration(call.duration_ms)} • {call.call_type || 'Unknown'}
              </p>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col min-w-0 bg-gray-50 relative overflow-hidden">
    <!-- Background Decoration -->
    <div
      class="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-white to-transparent pointer-events-none"
    ></div>

    {#if selectedCall}
      <!-- Call Header -->
      <div class="relative px-8 py-8 flex-shrink-0 z-10">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-3 mb-2">
              <h2 class="text-3xl font-bold text-gray-900 tracking-tight">Call Details</h2>
              <span
                class="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider"
              >
                {selectedCall.call_type || 'Call'}
              </span>
            </div>
            <p class="text-gray-500 text-lg">
              {formatDate(selectedCall.created_at)}
            </p>
          </div>
          {#if selectedCall.recording_url}
            <a
              href={selectedCall.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Play Recording</span>
            </a>
          {/if}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-4 gap-6 mt-8">
          <div
            class="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Duration</p>
            <p class="text-3xl font-bold text-gray-900">{formatDuration(selectedCall.duration_ms)}</p>
          </div>
          <div
            class="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Sentiment</p>
            <div class="flex items-center space-x-2 mt-1">
              <span
                class="px-3 py-1 rounded-full text-sm font-semibold {getSentimentColor(selectedCall.user_sentiment)}"
              >
                {selectedCall.user_sentiment || 'Unknown'}
              </span>
            </div>
          </div>
          <div
            class="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Status</p>
            <div class="flex items-center space-x-2 mt-1">
              <span
                class="px-3 py-1 rounded-full text-sm font-semibold {getStatusColor(selectedCall.call_successful)}"
              >
                {selectedCall.call_successful === true ? 'Successful' : selectedCall.call_successful === false ? 'Unsuccessful' : 'Unknown'}
              </span>
            </div>
          </div>
          <div
            class="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Disconnection</p>
            <p class="text-lg font-semibold text-gray-900 capitalize">
              {selectedCall.disconnection_reason?.replace(/_/g, ' ') || '-'}
            </p>
          </div>
        </div>
      </div>

      <!-- Call Content -->
      <div class="flex-1 px-8 pb-8 overflow-y-auto z-10 space-y-6">
        <!-- Summary Section -->
        {#if selectedCall.call_summary}
          <div
            class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
          >
            <h3 class="text-lg font-bold text-gray-900 mb-4">Summary</h3>
            <p class="text-gray-700 leading-relaxed">{selectedCall.call_summary}</p>
          </div>
        {/if}

        <!-- Transcript Section -->
        <div
          class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex-1 flex flex-col min-h-[300px]"
        >
          <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-bold text-gray-900">Transcript</h3>
          </div>
          <div class="flex-1 overflow-y-auto p-6">
            {#if selectedCall.transcript}
              <p class="text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                {selectedCall.transcript}
              </p>
            {:else}
              <div class="flex flex-col items-center justify-center h-full text-center">
                <div
                  class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"
                >
                  <svg
                    class="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p class="text-gray-500">No transcript available</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
        <div
          class="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          <svg
            class="w-16 h-16 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">Select a Call</h3>
        <p class="text-gray-500 max-w-md text-lg leading-relaxed">
          Choose a call from the sidebar to view its details, transcript, and summary.
        </p>
      </div>
    {/if}
  </main>
</div>
