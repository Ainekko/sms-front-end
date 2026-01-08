<script lang="ts">
  import type { CampaignResponse } from '$lib/api/campaigns';
  import { format } from 'date-fns';
  import { createEventDispatcher } from 'svelte';
  import {
    executeCampaign,
    cancelCampaign,
    deleteCampaign,
    startPolling,
    loadCampaigns
  } from '$lib/stores/campaignsStore';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  export let campaign: CampaignResponse;
  export let showFollowUpButton: boolean = true;

  const dispatch = createEventDispatcher();
  let isExecuting = false;
  let isCancelling = false;
  let isDeleting = false;

  // Computed properties for follow-up display
  $: isFollowUp = !!campaign.parent_campaign_id;
  $: hasExclusions = campaign.exclusion_filters && campaign.exclusion_filters.excluded_count > 0;

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700 animate-pulse';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  }

  function getTargetDisplay(c: CampaignResponse) {
    if (c.target_type === 'group') return `Group: ${c.target_group_name || 'Unknown Group'}`;
    if (c.target_type === 'brand') return `Brand: ${c.target_brand_name || 'Unknown Brand'}`;
    if (c.target_type === 'contacts')
      return `Contact: ${c.target_contact_name || 'Single Contact'}`;
    return 'Unknown Target';
  }

  async function handleExecute(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Run this campaign now?')) return;

    isExecuting = true;
    try {
      await executeCampaign(campaign.id);
      showSuccess('Campaign started');
      startPolling(campaign.id);
    } catch (error) {
      showError('Failed to start campaign');
    } finally {
      isExecuting = false;
    }
  }

  function handleFollowUp(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    dispatch('followup', campaign);
  }

  async function handleCancel(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to cancel this campaign?')) return;

    isCancelling = true;
    try {
      await cancelCampaign(campaign.id);
      showSuccess('Campaign cancelled');
    } catch (error) {
      showError('Failed to cancel campaign');
    } finally {
      isCancelling = false;
    }
  }

  async function handleDelete(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return;

    isDeleting = true;
    try {
      await deleteCampaign(campaign.id);
      showSuccess('Campaign deleted');
    } catch (error) {
      showError('Failed to delete campaign');
    } finally {
      isDeleting = false;
    }
  }
</script>

<a
  href="/campaigns/{campaign.id}"
  class="block group relative bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-100 hover:border-blue-100"
>
  <!-- Status Badge -->
  <div class="flex justify-between items-start mb-4">
    <div class="flex items-center gap-2">
      <span
        class={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(campaign.status)}`}
      >
        {campaign.status}
      </span>
      {#if isFollowUp}
        <span
          class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200"
        >
          Follow-up
        </span>
      {/if}
      {#if hasExclusions}
        <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 text-gray-400">
          -{campaign.exclusion_filters?.excluded_count} excluded
        </span>
      {/if}
    </div>
    <span class="text-xs text-gray-400 font-medium">
      {campaign.scheduled_at ? format(new Date(campaign.scheduled_at), 'MMM d, HH:mm') : 'Draft'}
    </span>
  </div>

  <!-- Parent Campaign Link (for follow-ups) -->
  {#if isFollowUp && campaign.parent_campaign_name}
    <div class="mb-2 text-xs text-gray-400 flex items-center gap-1">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16l-4-4m0 0l4-4m-4 4h18"
        />
      </svg>
      Based on: {campaign.parent_campaign_name}
    </div>
  {/if}

  <!-- Title & Target -->
  <h3
    class="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate"
  >
    {campaign.name || 'Untitled Campaign'}
  </h3>
  <p class="text-sm text-gray-500 mb-4 flex items-center">
    <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
    {getTargetDisplay(campaign)}
  </p>

  <!-- Message Preview -->
  <div class="bg-gray-50 rounded-xl p-3 mb-4">
    <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed">
      {campaign.message_body}
    </p>
  </div>

  <!-- Stats Footer -->
  <div class="flex items-center justify-between pt-4 border-t border-gray-50">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Sent</span>
      <span class="text-sm font-bold text-gray-900">{campaign.total_sent || 0}</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Delivered</span
      >
      <span class="text-sm font-bold text-gray-900">{campaign.total_delivered || 0}</span>
    </div>
    {#if campaign.status === 'pending'}
      <!-- Action buttons for pending campaigns -->
      <div class="flex items-center gap-2">
        <!-- Cancel Button -->
        <button
          class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600 transition-colors disabled:opacity-50"
          on:click={handleCancel}
          disabled={isCancelling}
          title="Cancel Campaign"
        >
          {#if isCancelling}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          {/if}
        </button>
        <!-- Delete Button -->
        <button
          class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
          on:click={handleDelete}
          disabled={isDeleting}
          title="Delete Campaign"
        >
          {#if isDeleting}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          {/if}
        </button>
        <!-- Play Button -->
        <button
          class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          on:click={handleExecute}
          disabled={isExecuting}
          title="Run Campaign"
        >
          {#if isExecuting}
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          {/if}
        </button>
      </div>
    {:else if campaign.status === 'cancelled'}
      <!-- Delete button for cancelled campaigns -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
        on:click={handleDelete}
        disabled={isDeleting}
        title="Delete Campaign"
      >
        {#if isDeleting}
          <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        {:else}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        {/if}
        Delete
      </button>
    {:else if campaign.status === 'completed' && showFollowUpButton}
      <!-- Follow-up Button -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
        on:click={handleFollowUp}
        title="Create Follow-up Campaign"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Follow-up
      </button>
    {:else}
      <div class="flex flex-col items-end">
        <span class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Failed</span>
        <span class="text-sm font-bold text-red-600">{campaign.total_failed || 0}</span>
      </div>
    {/if}
  </div>
</a>
