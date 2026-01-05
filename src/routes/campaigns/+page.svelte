<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { campaignsStore, loadCampaigns, isLoading } from '$lib/stores/campaignsStore';
  import CampaignCard from '$lib/components/campaigns/CampaignCard.svelte';
  import type { CampaignResponse } from '$lib/api/campaigns';

  // URL-based status filter
  type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';
  $: urlStatus = ($page.url.searchParams.get('status') as StatusFilter) || 'all';

  $: allCampaigns = $campaignsStore.campaigns;
  $: campaigns =
    urlStatus === 'all'
      ? allCampaigns
      : allCampaigns.filter((c: CampaignResponse) => c.status === urlStatus);

  function setStatusFilter(status: StatusFilter) {
    const url = new URL($page.url);
    if (status === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', status);
    }
    goto(url.toString(), { replaceState: true, keepFocus: true });
  }

  onMount(async () => {
    await loadCampaigns();
  });
</script>

<div class="min-h-screen bg-gray-50 font-sans">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Campaigns</h1>
            <p class="text-sm text-gray-500">Manage your SMS marketing campaigns</p>
          </div>
        </div>
        <div>
          <a
            href="/campaigns/new"
            class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-lg shadow-blue-500/30 text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Campaign
          </a>
        </div>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex space-x-1 mt-4 -mb-px">
        {#each [{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'processing', label: 'Processing' }, { id: 'completed', label: 'Completed' }, { id: 'failed', label: 'Failed' }] as filter}
          <button
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {urlStatus ===
            filter.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            on:click={() => setStatusFilter(filter.id)}
          >
            {filter.label}
            {#if filter.id === 'all'}
              <span class="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                >{allCampaigns.length}</span
              >
            {:else}
              {@const count = allCampaigns.filter((c) => c.status === filter.id).length}
              {#if count > 0}
                <span
                  class="ml-1.5 px-1.5 py-0.5 text-xs rounded-full {filter.id === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : filter.id === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : filter.id === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'}">{count}</span
                >
              {/if}
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if $isLoading && campaigns.length === 0}
      <div class="flex justify-center items-center h-64">
        <div
          class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
    {:else if campaigns.length === 0}
      <div class="text-center py-20">
        <div
          class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          <svg
            class="w-10 h-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">No campaigns yet</h3>
        <p class="text-gray-500 max-w-sm mx-auto mb-8">
          Get started by creating your first campaign to reach your audience.
        </p>
        <a
          href="/campaigns/new"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
        >
          Create Campaign
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each campaigns as campaign (campaign.id)}
          <CampaignCard {campaign} />
        {/each}
      </div>
    {/if}
  </main>
</div>
