<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    campaignsStore,
    loadCampaign,
    createCampaign,
    executeCampaign,
    cancelCampaign,
    deleteCampaign,
    startPolling,
    stopPolling,
    loadCampaignConversations,
    loadCampaignInsights,
    isLoading,
    isLoadingInsights,
    currentInsights
  } from '$lib/stores/campaignsStore';
  import { showSuccess, showError } from '$lib/stores/uiStore';
  import CampaignForm from '$lib/components/campaigns/CampaignForm.svelte';
  import CampaignInsightsPanel from '$lib/components/campaigns/CampaignInsightsPanel.svelte';
  import ConversationList from '$lib/components/ConversationList.svelte';
  import type { CreateCampaignRequest } from '$lib/api/campaigns';
  import CampaignChatWindow from '$lib/components/campaigns/CampaignChatWindow.svelte';

  $: brandId = $page.params.brandId;
  $: id = $page.params.id;
  $: isNew = id === 'new';
  $: campaign = $campaignsStore.currentCampaign;
  $: conversations = $campaignsStore.campaignConversations;
  $: insights = $currentInsights;

  // URL-based tab state
  type TabType = 'details' | 'insights' | 'conversations';
  $: urlTab = ($page.url.searchParams.get('tab') as TabType) || 'details';
  $: activeTab = isNew ? 'details' : urlTab;

  // Chat view state (overlays the main content)
  let showChat = false;
  let selectedConversationId: string | null = null;
  let selectedContactName: string | null = null;

  // Polling interval
  let conversationPollingInterval: ReturnType<typeof setInterval> | null = null;

  function setTab(tab: string) {
    if (isNew) return;
    const url = new URL($page.url);
    url.searchParams.set('tab', tab);
    goto(url.toString(), { replaceState: true, keepFocus: true });
  }

  onMount(async () => {
    if (!isNew) {
      await loadCampaign(id);

      // Start polling if status is processing
      if (campaign && ['processing', 'pending'].includes(campaign.status)) {
        startPolling(id);
      }

      // Load data based on initial tab
      if (urlTab === 'insights' || urlTab === 'details') {
        await loadCampaignInsights(id);
      }
      if (urlTab === 'conversations') {
        await loadCampaignConversations(id);
      }
    } else {
      campaignsStore.setCurrentCampaign(null);
    }
  });

  // Reactively load insights when on details tab (insights merged in)
  $: if (!isNew && activeTab === 'details' && !insights) {
    loadCampaignInsights(id);
  }
  $: if (!isNew && activeTab === 'conversations' && conversations.length === 0) {
    loadCampaignConversations(id);
  }

  onDestroy(() => {
    stopPolling();
    if (conversationPollingInterval) clearInterval(conversationPollingInterval);
  });

  async function handleSubmit(event: CustomEvent<CreateCampaignRequest>) {
    try {
      const newCampaign = await createCampaign(event.detail);
      showSuccess('Campaign created successfully');
      goto(`/b/${brandId}/campaigns/${newCampaign.id}`);
    } catch (error) {
      showError('Failed to create campaign');
    }
  }

  async function handleExecute() {
    if (!campaign) return;
    if (!confirm('Are you sure you want to run this campaign now?')) return;

    try {
      await executeCampaign(campaign.id);
      showSuccess('Campaign execution started');
      startPolling(campaign.id);
    } catch (error) {
      showError('Failed to start campaign');
    }
  }

  async function handleCancel() {
    if (!campaign) return;
    if (!confirm('Are you sure you want to cancel this campaign?')) return;

    try {
      await cancelCampaign(campaign.id);
      showSuccess('Campaign cancelled');
    } catch (error) {
      showError('Failed to cancel campaign');
    }
  }

  async function handleDelete() {
    if (!campaign) return;
    if (!confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return;

    try {
      await deleteCampaign(campaign.id);
      showSuccess('Campaign deleted');
      goto(`/b/${brandId}/campaigns`);
    } catch (error) {
      showError('Failed to delete campaign');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  }

  function handleConversationSelect(e: CustomEvent<string>) {
    const conversationId = e.detail;
    selectedConversationId = conversationId;

    const conversation = conversations.find(
      (c: any) =>
        c.id === conversationId ||
        c.phone_number === conversationId ||
        c.phoneNumber === conversationId
    );
    selectedContactName = conversation?.contact_name || conversation?.contactName || null;
    showChat = true;
  }

  function closeChat() {
    showChat = false;
    selectedConversationId = null;
    selectedContactName = null;
  }
</script>

<div class="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200 flex-shrink-0 z-10">
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-4">
          <a
            href="/b/{brandId}/campaigns"
            class="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            title="Back to Campaigns"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </a>
          <div>
            <h1 class="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-3">
              {isNew ? 'New Campaign' : campaign?.name || 'Loading...'}
              {#if !isNew && campaign}
                <span
                  class={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(campaign.status)} ${campaign.status === 'processing' ? 'animate-pulse' : ''}`}
                >
                  {campaign.status}
                </span>
                {#if campaign.parent_campaign_id}
                  <span
                    class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200"
                  >
                    Follow-up
                  </span>
                {/if}
              {/if}
            </h1>
            {#if !isNew && campaign?.parent_campaign_id}
              <a
                href="/b/{brandId}/campaigns/{campaign.parent_campaign_id}"
                class="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 transition-colors"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Based on: {campaign.parent_campaign_name || 'Parent Campaign'}
              </a>
            {/if}
          </div>
        </div>

        <!-- Actions -->
        {#if !isNew && campaign}
          <div class="flex items-center space-x-3">
            {#if campaign.status === 'pending'}
              <!-- Cancel Button -->
              <button
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors disabled:opacity-50"
                on:click={handleCancel}
                disabled={$isLoading}
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </button>
              <!-- Delete Button -->
              <button
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors disabled:opacity-50"
                on:click={handleDelete}
                disabled={$isLoading}
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
              <!-- Premium Play Button -->
              <button
                class="group relative inline-flex items-center px-5 py-2.5 overflow-hidden rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);"
                on:click={handleExecute}
                disabled={$isLoading}
              >
                <!-- Animated shine effect -->
                <span class="absolute inset-0 overflow-hidden rounded-xl">
                  <span
                    class="absolute -left-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shine"
                  ></span>
                </span>
                <svg class="-ml-0.5 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run Campaign
              </button>
            {:else if campaign.status === 'cancelled'}
              <!-- Delete Button for cancelled -->
              <button
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors disabled:opacity-50"
                on:click={handleDelete}
                disabled={$isLoading}
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Tab Navigation (only for existing campaigns) -->
      {#if !isNew}
        <div class="flex space-x-1 -mb-px">
          {#each [{ id: 'details', label: 'Details & Insights', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }, { id: 'conversations', label: 'Conversations', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }] as tab}
            <button
              class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab ===
              tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              on:click={() => setTab(tab.id)}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d={tab.icon}
                />
              </svg>
              {tab.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Content -->
  <div class="flex-1 overflow-hidden">
    {#if showChat && selectedConversationId}
      <!-- Chat View (Full Width Overlay) -->
      <div class="h-full flex flex-col relative">
        <div class="absolute top-3 right-4 z-10">
          <button
            class="bg-white/90 backdrop-blur shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            on:click={closeChat}
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Close Chat
          </button>
        </div>
        <CampaignChatWindow
          conversationId={selectedConversationId}
          contactName={selectedContactName}
          brandId={campaign?.target_brand_id}
        />
      </div>
    {:else if activeTab === 'details'}
      <!-- Details Tab -->
      <div class="h-full overflow-y-auto p-6 lg:p-8">
        <div class="max-w-3xl mx-auto">
          {#if !isNew && campaign}
            <!-- Quick Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div
                class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
              >
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Recipients
                </p>
                <p class="text-2xl font-bold text-gray-900">{campaign.total_recipients}</p>
              </div>
              <div
                class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
              >
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sent</p>
                <p class="text-2xl font-bold text-blue-600">{campaign.total_sent}</p>
              </div>
              <div
                class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
              >
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Delivered
                </p>
                <p class="text-2xl font-bold text-green-600">{campaign.total_delivered || 0}</p>
              </div>
              <div
                class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
              >
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Failed</p>
                <p class="text-2xl font-bold text-red-600">{campaign.total_failed}</p>
              </div>
            </div>

            <!-- Insights Panel (for completed campaigns) -->
            {#if campaign.status !== 'pending'}
              <div class="mb-8">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    class="w-5 h-5 text-purple-500"
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
                  Campaign Insights
                </h3>
                <CampaignInsightsPanel insights={$currentInsights} isLoading={$isLoadingInsights} />
              </div>
            {/if}
          {/if}

          <!-- Form -->
          <CampaignForm {campaign} isLoading={$isLoading} on:submit={handleSubmit} />
        </div>
      </div>
    {:else if activeTab === 'conversations'}
      <!-- Conversations Tab -->
      <div class="h-full">
        <ConversationList
          mode="campaign"
          customConversations={conversations}
          isLoading={$isLoading}
          on:select={handleConversationSelect}
          on:retry={() => loadCampaignConversations(id)}
          on:refresh={() => loadCampaignConversations(id)}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes shine {
    to {
      left: 100%;
    }
  }
  :global(.group:hover .animate-shine) {
    animation: shine 0.75s ease-in-out;
  }
</style>
