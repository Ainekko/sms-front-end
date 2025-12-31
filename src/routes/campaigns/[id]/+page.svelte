<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    campaignsStore,
    loadCampaign,
    createCampaign,
    executeCampaign,
    startPolling,
    stopPolling,
    loadCampaignConversations,
    isLoading
  } from '$lib/stores/campaignsStore';
  import { showSuccess, showError } from '$lib/stores/uiStore';
  import CampaignForm from '$lib/components/campaigns/CampaignForm.svelte';
  import ConversationList from '$lib/components/ConversationList.svelte';
  import type { CreateCampaignRequest } from '$lib/api/campaigns';

  import CampaignChatWindow from '$lib/components/campaigns/CampaignChatWindow.svelte';

  $: id = $page.params.id;
  $: isNew = id === 'new';
  $: campaign = $campaignsStore.currentCampaign;
  $: conversations = $campaignsStore.campaignConversations;

  // View state
  let view: 'details' | 'chat' = 'details';
  let selectedConversationId: string | null = null;
  let selectedContactName: string | null = null;

  // Polling for conversations if campaign is active
  let conversationPollingInterval: any;

  onMount(async () => {
    if (!isNew) {
      await loadCampaign(id);
      // Start polling if status is processing
      if (campaign && ['processing', 'pending'].includes(campaign.status)) {
        startPolling(id);
      }

      // Load conversations initially
      await loadCampaignConversations(id);
    } else {
      campaignsStore.setCurrentCampaign(null);
    }
  });

  onDestroy(() => {
    stopPolling();
    if (conversationPollingInterval) clearInterval(conversationPollingInterval);
  });

  async function handleSubmit(event: CustomEvent<CreateCampaignRequest>) {
    try {
      const newCampaign = await createCampaign(event.detail);
      showSuccess('Campaign created successfully');
      goto(`/campaigns/${newCampaign.id}`);
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

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  }

  function handleConversationSelect(e: CustomEvent<string>) {
    const conversationId = e.detail;
    selectedConversationId = conversationId;

    // Find contact name from conversations list
    const conversation = conversations.find(
      (c: any) =>
        c.id === conversationId ||
        c.phone_number === conversationId ||
        c.phoneNumber === conversationId
    );
    selectedContactName = conversation?.contact_name || conversation?.contactName || null;

    view = 'chat';
  }
</script>

<div class="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200 flex-shrink-0 z-10">
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-4">
          <a
            href="/campaigns"
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
                  class={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(campaign.status)}`}
                >
                  {campaign.status}
                </span>
              {/if}
            </h1>
          </div>
        </div>

        <!-- Actions -->
        {#if !isNew && campaign}
          <div class="flex items-center space-x-3">
            {#if campaign.status === 'pending'}
              <button
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-lg shadow-green-500/30 text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                on:click={handleExecute}
                disabled={$isLoading}
              >
                <svg
                  class="-ml-1 mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                Run Campaign
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Content (Side-by-Side) -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left: Campaign Details OR Chat -->
    <div class="flex-1 overflow-hidden flex flex-col relative">
      {#if view === 'details'}
        <div class="flex-1 overflow-y-auto p-6 lg:p-8">
          <div class="max-w-3xl mx-auto">
            {#if !isNew && campaign}
              <!-- Stats Grid -->
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
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Failed
                  </p>
                  <p class="text-2xl font-bold text-red-600">{campaign.total_failed}</p>
                </div>
              </div>
            {/if}

            <!-- Form -->
            <CampaignForm {campaign} isLoading={$isLoading} on:submit={handleSubmit} />
          </div>
        </div>
      {:else if view === 'chat' && selectedConversationId}
        <div class="flex-1 flex flex-col h-full relative">
          <!-- Back Button Overlay -->
          <div class="absolute top-3 right-4 z-10">
            <button
              class="bg-white/90 backdrop-blur shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              on:click={() => (view = 'details')}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                /></svg
              >
              Close Chat
            </button>
          </div>
          <CampaignChatWindow
            conversationId={selectedConversationId}
            contactName={selectedContactName}
            brandId={campaign?.target_brand_id}
          />
        </div>
      {/if}
    </div>

    <!-- Right: Conversations (Only if not new) -->
    {#if !isNew}
      <div class="w-96 border-l border-gray-200 bg-white flex-shrink-0">
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
