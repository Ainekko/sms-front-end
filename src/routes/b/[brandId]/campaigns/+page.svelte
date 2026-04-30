<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { campaignsStore, loadCampaigns, isLoading } from '$lib/stores/campaignsStore';
  import CampaignCard from '$lib/components/campaigns/CampaignCard.svelte';
  import FollowUpCampaignModal from '$lib/components/campaigns/FollowUpCampaignModal.svelte';
  import type { CampaignResponse } from '$lib/api/campaigns';

  $: brandId = $page.params.brandId;

  // URL-based status filter
  type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';
  $: urlStatus = ($page.url.searchParams.get('status') as StatusFilter) || 'all';

  $: allCampaigns = $campaignsStore.campaigns;
  $: campaigns =
    urlStatus === 'all'
      ? allCampaigns
      : allCampaigns.filter((c: CampaignResponse) => c.status === urlStatus);

  let showFollowUpModal = false;
  let selectedParentCampaign: CampaignResponse | null = null;

  function setStatusFilter(status: StatusFilter) {
    const url = new URL($page.url);
    if (status === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', status);
    }
    goto(url.toString(), { replaceState: true, keepFocus: true });
  }

  function handleFollowUp(event: CustomEvent<CampaignResponse>) {
    selectedParentCampaign = event.detail;
    showFollowUpModal = true;
  }

  function closeFollowUpModal() {
    showFollowUpModal = false;
    selectedParentCampaign = null;
  }

  async function handleFollowUpCreated(event: CustomEvent<CampaignResponse>) {
    await loadCampaigns();
    goto(`/b/${brandId}/campaigns/${event.detail.id}`);
  }

  onMount(async () => {
    await loadCampaigns();
  });

  const statusFilters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'completed', label: 'Completed' },
    { id: 'failed', label: 'Failed' }
  ];
</script>

<svelte:head>
  <title>Campaigns | Broadr</title>
</svelte:head>

<div class="campaigns-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">Campaigns</h1>
      <p class="page-subtitle">Manage your SMS marketing campaigns</p>
    </div>
    <a href="/b/{brandId}/campaigns/new" class="btn-create">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
      New Campaign
    </a>
  </div>

  <!-- Status Filter Tabs -->
  <div class="filter-tabs">
    {#each statusFilters as filter}
      <button
        class="filter-tab"
        class:active={urlStatus === filter.id}
        on:click={() => setStatusFilter(filter.id)}
      >
        {filter.label}
        {#if filter.id === 'all'}
          <span class="tab-count">{allCampaigns.length}</span>
        {:else}
          {@const count = allCampaigns.filter((c) => c.status === filter.id).length}
          {#if count > 0}
            <span class="tab-count {filter.id}">{count}</span>
          {/if}
        {/if}
      </button>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="campaigns-content">
    {#if $isLoading && campaigns.length === 0}
      <div class="loading-state">
        <div class="spinner"></div>
      </div>
    {:else if campaigns.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <h3>No campaigns yet</h3>
        <p>Create your first campaign to start reaching your audience.</p>
        <a href="/b/{brandId}/campaigns/new" class="btn-create-empty">Create Campaign</a>
      </div>
    {:else}
      <div class="campaigns-grid">
        {#each campaigns as campaign (campaign.id)}
          <CampaignCard {campaign} on:followup={handleFollowUp} />
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if showFollowUpModal && selectedParentCampaign}
  <FollowUpCampaignModal
    parentCampaign={selectedParentCampaign}
    isOpen={showFollowUpModal}
    on:close={closeFollowUpModal}
    on:created={handleFollowUpCreated}
  />
{/if}

<style>
  .campaigns-page {
    height: 100%;
    overflow-y: auto;
    background: #09090b;
    color: #e4e4e7;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 32px 0;
  }
  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }
  .page-subtitle {
    font-size: 0.8rem;
    color: #71717a;
    margin: 0;
  }

  .btn-create {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .btn-create:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }

  /* Filter tabs */
  .filter-tabs {
    display: flex;
    gap: 4px;
    padding: 20px 32px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .filter-tab {
    padding: 8px 14px;
    font-size: 0.78rem;
    font-weight: 500;
    color: #71717a;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .filter-tab:hover { color: #a1a1aa; }
  .filter-tab.active {
    color: #818cf8;
    border-bottom-color: #6366f1;
  }
  .tab-count {
    padding: 1px 6px;
    font-size: 0.65rem;
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    color: #71717a;
    font-weight: 600;
  }
  .tab-count.completed { background: rgba(34,197,94,0.15); color: #4ade80; }
  .tab-count.failed { background: rgba(239,68,68,0.15); color: #f87171; }
  .tab-count.processing { background: rgba(99,102,241,0.15); color: #818cf8; }
  .tab-count.pending { background: rgba(251,191,36,0.15); color: #fbbf24; }

  /* Content */
  .campaigns-content {
    padding: 24px 32px;
  }

  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 80px 0;
  }
  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(255,255,255,0.08);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .empty-state {
    text-align: center;
    padding: 80px 0;
  }
  .empty-icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: rgba(99,102,241,0.1);
    color: #818cf8;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }
  .empty-state h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #f4f4f5;
    margin: 0 0 8px;
  }
  .empty-state p {
    font-size: 0.85rem;
    color: #71717a;
    margin: 0 0 24px;
    max-width: 360px;
    margin-left: auto;
    margin-right: auto;
  }
  .btn-create-empty {
    display: inline-flex;
    align-items: center;
    padding: 10px 20px;
    border-radius: 10px;
    background: rgba(99,102,241,0.12);
    color: #818cf8;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }
  .btn-create-empty:hover {
    background: rgba(99,102,241,0.2);
  }

  .campaigns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
