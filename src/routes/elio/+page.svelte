<!--
  Elio Leads Page
  ===============
  Master-detail view for browsing Reddit leads from MHR Elio scanner.
  Design inspired by the Chloe calls page for consistency.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { elioApi, type ElioLead } from '$lib/api/elio';
  import { showError } from '$lib/stores/uiStore';
  import ElioConfigModal from '$lib/components/elio/ElioConfigModal.svelte';

  // State
  let leads: ElioLead[] = [];
  let selectedLead: ElioLead | null = null;
  let isLoading = true;
  let isUpdatingStatus = false;
  let isScanning = false;
  let showConfig = false;
  let searchQuery = '';
  let total = 0;
  let offset = 0;
  const limit = 50;

  // Filters
  let filterSubreddit = '';
  let filterStatus = '';
  let filterMinUrgency = 0;

  // Available filter options (populated from data)
  let availableSubreddits: string[] = [];

  // Filtered leads (client-side search on top of server-side filters)
  $: filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lead.title && lead.title.toLowerCase().includes(q)) ||
      (lead.content_preview && lead.content_preview.toLowerCase().includes(q)) ||
      (lead.author && lead.author.toLowerCase().includes(q)) ||
      (lead.location && lead.location.toLowerCase().includes(q))
    );
  });

  // URL State Management
  $: selectedLeadId = $page.url.searchParams.get('id');

  $: if (selectedLeadId && leads.length > 0) {
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (lead && selectedLead?.id !== lead.id) {
      selectedLead = lead;
    }
  } else if (!selectedLeadId) {
    selectedLead = null;
  }

  onMount(async () => {
    await loadLeads();
  });

  async function loadLeads(append = false) {
    if (!append) {
      isLoading = true;
      offset = 0;
    }

    try {
      const params: Record<string, any> = { limit, offset: append ? offset + limit : 0 };
      if (filterSubreddit) params.subreddit = filterSubreddit;
      if (filterStatus) params.status = filterStatus;
      if (filterMinUrgency > 0) params.min_urgency = filterMinUrgency;

      const response = await elioApi.listLeads(params);

      if (append) {
        leads = [...leads, ...response.leads];
        offset = response.offset;
      } else {
        leads = response.leads;
        offset = 0;
      }
      total = response.total;

      // Extract unique subreddits for filter dropdown
      const subs = new Set(leads.map((l) => l.subreddit).filter(Boolean) as string[]);
      availableSubreddits = Array.from(subs).sort();

      // Select from URL if present
      if (selectedLeadId) {
        const lead = leads.find((l) => l.id === selectedLeadId);
        if (lead) selectedLead = lead;
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
      showError('Failed to load leads');
    } finally {
      isLoading = false;
    }
  }

  function selectLead(lead: ElioLead) {
    selectedLead = lead;
    const url = new URL(window.location.href);
    url.searchParams.set('id', lead.id);
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function handleBack() {
    goto('/messages');
  }

  async function handleStatusChange(newStatus: string) {
    if (!selectedLead || isUpdatingStatus) return;

    isUpdatingStatus = true;
    try {
      const updated = await elioApi.updateLeadStatus(selectedLead.id, newStatus);
      leads = leads.map((l) => (l.id === updated.id ? updated : l));
      selectedLead = updated;
    } catch (err) {
      console.error('Failed to update status:', err);
      showError('Failed to update status');
    } finally {
      isUpdatingStatus = false;
    }
  }

  async function handleScan() {
    if (isScanning) return;
    isScanning = true;
    try {
      await elioApi.startScan();
      showSuccess('Reddit scan initiated successfully');
      loadLeads(); // Refresh leads in background
    } catch (err) {
      console.error('Failed to start scan:', err);
      showError(err instanceof Error ? err.message : 'Failed to start scan');
    } finally {
      isScanning = false;
    }
  }

  function handleFilterChange() {
    loadLeads();
  }

  function handleScroll(e: Event) {
    const target = e.target as HTMLElement;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
    if (nearBottom && !isLoading && leads.length < total) {
      loadLeads(true);
    }
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

  function getUrgencyColor(score: number): string {
    if (score >= 8) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 5) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'contacted':
        return 'bg-purple-100 text-purple-700';
      case 'converted':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'new':
        return '🆕';
      case 'contacted':
        return '📧';
      case 'converted':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '•';
    }
  }
</script>

<div class="flex h-screen bg-gray-50 font-sans overflow-hidden">
  <!-- Sidebar -->
  <aside
    class="w-96 bg-white border-r border-gray-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
  >
    <!-- Header -->
    <div class="p-6 border-b border-gray-100">
      <div class="flex items-center justify-between mb-5">
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
          <h1 class="text-xl font-bold text-gray-900 tracking-tight">Reddit Leads</h1>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Scan Button -->
          <button
            class="px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 border border-orange-200/60
                   rounded-xl hover:bg-orange-100 transition-all flex items-center space-x-2 shadow-sm
                   disabled:opacity-50"
            on:click={handleScan}
            disabled={isScanning}
          >
            {#if isScanning}
              <svg class="w-4 h-4 animate-spin text-orange-600" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span>Scanning...</span>
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Scan Now</span>
            {/if}
          </button>

          <!-- Settings Icon -->
          <button
            class="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
            on:click={() => (showConfig = true)}
            title="Agent Configuration"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
          </button>
          <!-- Reddit icon -->
          <div class="p-2 text-orange-600 bg-orange-50 rounded-xl">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="relative group mb-4">
        <svg
          class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-orange-500 transition-colors"
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
          placeholder="Search leads..."
          class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900
                 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
        />
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-3 gap-2">
        <select
          bind:value={filterSubreddit}
          on:change={handleFilterChange}
          class="px-3 py-2 bg-gray-50 border-none rounded-lg text-xs font-medium text-gray-700
                 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer"
        >
          <option value="">All Subs</option>
          {#each availableSubreddits as sub}
            <option value={sub}>r/{sub}</option>
          {/each}
        </select>

        <select
          bind:value={filterStatus}
          on:change={handleFilterChange}
          class="px-3 py-2 bg-gray-50 border-none rounded-lg text-xs font-medium text-gray-700
                 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          bind:value={filterMinUrgency}
          on:change={handleFilterChange}
          class="px-3 py-2 bg-gray-50 border-none rounded-lg text-xs font-medium text-gray-700
                 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer"
        >
          <option value={0}>Any Urgency</option>
          <option value={8}>High (8+)</option>
          <option value={5}>Medium (5+)</option>
          <option value={3}>Low (3+)</option>
        </select>
      </div>
    </div>

    <!-- Leads List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2" on:scroll={handleScroll}>
      {#if isLoading && leads.length === 0}
        <div class="flex justify-center py-12">
          <div
            class="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
      {:else if leads.length === 0}
        <div class="text-center py-12 px-4">
          <div
            class="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <svg class="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
              />
            </svg>
          </div>
          <p class="text-base font-semibold text-gray-900">No leads yet</p>
          <p class="text-sm text-gray-500 mt-1">Reddit leads will appear here when scanned</p>
        </div>
      {:else if filteredLeads.length === 0}
        <div class="text-center py-12">
          <p class="text-gray-500">No leads match your search</p>
        </div>
      {:else}
        {#each filteredLeads as lead (lead.id)}
          <button
            class="w-full flex items-start space-x-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden
                   {selectedLead?.id === lead.id ? 'bg-orange-50 shadow-sm' : 'hover:bg-gray-50'}"
            on:click={() => selectLead(lead)}
          >
            {#if selectedLead?.id === lead.id}
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-orange-500 rounded-r-full"
              ></div>
            {/if}

            <!-- Urgency Badge -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border
                     {getUrgencyColor(lead.urgency_score)}"
            >
              {lead.urgency_score}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p
                  class="text-sm font-semibold truncate {selectedLead?.id === lead.id
                    ? 'text-gray-900'
                    : 'text-gray-700'}"
                >
                  {lead.title || 'Untitled Post'}
                </p>
              </div>
              <div class="flex items-center gap-2 mt-1">
                {#if lead.subreddit}
                  <span class="text-xs text-orange-600 font-medium">r/{lead.subreddit}</span>
                {/if}
                <span class="text-xs text-gray-400">•</span>
                <span class="text-xs text-gray-500">{formatDate(lead.date_iso)}</span>
              </div>
              <div class="flex items-center gap-2 mt-1.5">
                <span
                  class="px-1.5 py-0.5 rounded text-xs font-medium {getStatusColor(lead.status)}"
                >
                  {lead.status}
                </span>
                {#if lead.location && lead.location !== 'Not specified'}
                  <span class="text-xs text-gray-500 truncate">📍 {lead.location}</span>
                {/if}
              </div>
            </div>
          </button>
        {/each}

        {#if isLoading}
          <div class="flex justify-center py-4">
            <div
              class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
        {/if}

        {#if leads.length < total && !isLoading}
          <p class="text-center text-xs text-gray-400 py-2">
            Showing {leads.length} of {total} leads
          </p>
        {/if}
      {/if}
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col min-w-0 bg-gray-50 relative overflow-hidden">
    <!-- Background Decoration -->
    <div
      class="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-white to-transparent pointer-events-none"
    ></div>

    {#if selectedLead}
      <!-- Lead Header -->
      <div class="relative px-8 py-8 flex-shrink-0 z-10">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0 pr-4">
            <div class="flex items-center space-x-3 mb-2 flex-wrap gap-2">
              <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
                {selectedLead.title || 'Untitled Post'}
              </h2>
              {#if selectedLead.subreddit}
                <span
                  class="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold"
                >
                  r/{selectedLead.subreddit}
                </span>
              {/if}
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold border {getUrgencyColor(
                  selectedLead.urgency_score
                )}"
              >
                Urgency: {selectedLead.urgency_score}/10
              </span>
            </div>
            <p class="text-gray-500 text-lg">
              Posted by u/{selectedLead.author || 'unknown'} • {formatDate(selectedLead.date_iso)}
            </p>
          </div>
          <a
            href={selectedLead.link}
            target="_blank"
            rel="noopener noreferrer"
            class="flex-shrink-0 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all shadow-sm flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>Open in Reddit</span>
          </a>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-5 gap-4 mt-6">
          <div
            class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Score</p>
            <p class="text-2xl font-bold text-gray-900">⬆️ {selectedLead.score}</p>
          </div>
          <div
            class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Comments</p>
            <p class="text-2xl font-bold text-gray-900">💬 {selectedLead.num_comments}</p>
          </div>
          <div
            class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Location</p>
            <p class="text-lg font-semibold text-gray-900 truncate">
              {selectedLead.location || 'Not specified'}
            </p>
          </div>
          <div
            class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Request Type</p>
            <p class="text-lg font-semibold text-gray-900 truncate capitalize">
              {selectedLead.request_type || 'Unknown'}
            </p>
          </div>
          <div
            class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Reply Method</p>
            <p class="text-lg font-semibold text-gray-900 truncate capitalize">
              {selectedLead.reply_method || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      <!-- Lead Content -->
      <div class="flex-1 px-8 pb-8 overflow-y-auto z-10 space-y-6">
        <!-- Content Preview -->
        <div
          class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-4">Post Content</h3>
          {#if selectedLead.content_preview}
            <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedLead.content_preview}
            </p>
          {:else}
            <p class="text-gray-500 italic">No content preview available</p>
          {/if}
        </div>

        <!-- Status Management -->
        <div
          class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-4">Lead Status</h3>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 mr-4">
              <span class="text-sm text-gray-500">Current:</span>
              <span
                class="px-3 py-1.5 rounded-lg text-sm font-semibold {getStatusColor(
                  selectedLead.status
                )}"
              >
                {getStatusIcon(selectedLead.status)}
                {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
              </span>
            </div>
            <div class="h-8 w-px bg-gray-200"></div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">Change to:</span>
              {#each ['new', 'contacted', 'converted', 'rejected'] as status}
                {#if status !== selectedLead.status}
                  <button
                    class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm disabled:opacity-50
                           {status === 'new'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : status === 'contacted'
                        ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                        : status === 'converted'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'}"
                    on:click={() => handleStatusChange(status)}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? '...' : getStatusIcon(status)}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <!-- Metadata -->
        <div
          class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-4">Metadata</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Lead ID:</span>
              <span class="ml-2 font-mono text-gray-700">{selectedLead.id}</span>
            </div>
            <div>
              <span class="text-gray-500">Batch ID:</span>
              <span class="ml-2 font-mono text-gray-700">{selectedLead.batch_id || 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-500">Created:</span>
              <span class="ml-2 text-gray-700">{formatDate(selectedLead.created_at)}</span>
            </div>
            <div>
              <span class="text-gray-500">Real Request:</span>
              <span class="ml-2 text-gray-700"
                >{selectedLead.is_real_request ? '✅ Yes' : '❌ No'}</span
              >
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
        <div
          class="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          <svg class="w-16 h-16 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
            />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">Select a Lead</h3>
        <p class="text-gray-500 max-w-md text-lg leading-relaxed">
          Choose a lead from the sidebar to view its details, content preview, and manage its
          status.
        </p>
      </div>
    {/if}
  </main>
</div>

<!-- Configuration Modal -->
<ElioConfigModal isOpen={showConfig} on:close={() => (showConfig = false)} />
