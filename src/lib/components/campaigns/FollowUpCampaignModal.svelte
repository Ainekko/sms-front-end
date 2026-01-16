<!--
  FollowUpCampaignModal Component
  ================================
  Modal for creating follow-up campaigns with audience exclusion options.
  Uses minimal silver palette with light borders and subtle shadows.
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    getFollowUpPreview,
    createFollowUpCampaign,
    validateMessage,
    type CampaignResponse,
    type FollowUpPreviewResponse,
    type CreateFollowUpCampaignRequest,
    type MessageValidationResponse
  } from '$lib/api/campaigns';
  import { showSuccess, showError } from '$lib/stores/uiStore';
  import { getLocalMinDatetime, getTomorrowAtHour } from '$lib/utils/date';

  export let parentCampaign: CampaignResponse;
  export let isOpen: boolean = false;

  const dispatch = createEventDispatcher();

  // Form state
  let name = '';
  let messageBody = '';
  let scheduledAt = '';
  let excludeDnc = true;
  let excludeNoReply = false;
  let excludeFailedDelivery = true; // Exclude failed deliveries by default
  let targetOnlyNoReply = false; // Target ONLY non-responders (mutually exclusive with excludeNoReply)
  let minPriorityThreshold = 0; // 0 = include all, 1 = exclude 0, 2 = exclude 0-1, 3 = exclude 0-2

  // Preview state
  let preview: FollowUpPreviewResponse | null = null;
  let isLoadingPreview = false;
  let isSubmitting = false;
  let previewTimeout: ReturnType<typeof setTimeout> | null = null;

  // Message validation state
  let validation: MessageValidationResponse | null = null;
  let isValidating = false;
  let validationTimeout: ReturnType<typeof setTimeout> | null = null;
  let allowExpensiveEncoding = false;

  // Remaining count comes directly from server
  $: remainingCount = preview?.remaining_after_exclusions ?? 0;

  // Debounced preview fetch on any filter change
  $: {
    // Trigger on any filter change (this creates reactive dependency)
    excludeDnc, excludeNoReply, excludeFailedDelivery, targetOnlyNoReply, minPriorityThreshold;
    // Debounce the API call
    if (previewTimeout) clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => loadPreview(), 500);
  }

  onMount(async () => {
    name = `${parentCampaign.name} - Follow-up`;
    // Initial load happens via the reactive statement above
  });

  async function loadPreview() {
    isLoadingPreview = true;
    try {
      preview = await getFollowUpPreview(
        parentCampaign.id,
        excludeDnc,
        excludeNoReply,
        excludeFailedDelivery,
        targetOnlyNoReply,
        minPriorityThreshold > 0 ? minPriorityThreshold : undefined
      );
    } catch (error) {
      // If API fails, show error but keep last preview
      console.error('Failed to load follow-up preview:', error);
    } finally {
      isLoadingPreview = false;
    }
  }

  // Debounced message validation
  $: if (messageBody) {
    if (validationTimeout) clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => validateMessageBody(), 500);
  }

  async function validateMessageBody() {
    if (!messageBody.trim()) {
      validation = null;
      return;
    }
    isValidating = true;
    try {
      validation = await validateMessage(messageBody);
      if (!validation.requires_override) {
        allowExpensiveEncoding = false;
      }
    } catch (error) {
      console.error('Validation failed:', error);
      validation = null;
    } finally {
      isValidating = false;
    }
  }

  async function handleSubmit() {
    if (!messageBody.trim()) {
      showError('Message body is required');
      return;
    }

    // Block submit if expensive encoding not allowed
    if (validation?.requires_override && !allowExpensiveEncoding) {
      showError('Please enable expensive encoding override to proceed');
      return;
    }

    isSubmitting = true;
    try {
      const request: CreateFollowUpCampaignRequest = {
        parent_campaign_id: parentCampaign.id,
        name: name || undefined,
        message_body: messageBody,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        exclude_dnc: excludeDnc,
        exclude_no_reply: excludeNoReply,
        exclude_failed_delivery: excludeFailedDelivery,
        target_only_no_reply: targetOnlyNoReply,
        exclude_priority_below: minPriorityThreshold > 0 ? minPriorityThreshold : undefined,
        allow_expensive_encoding: allowExpensiveEncoding
      };

      const newCampaign = await createFollowUpCampaign(request);
      showSuccess('Follow-up campaign created');
      dispatch('created', newCampaign);
      close();
    } catch (error) {
      showError('Failed to create follow-up campaign');
    } finally {
      isSubmitting = false;
    }
  }

  function close() {
    isOpen = false;
    dispatch('close');
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      close();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Modal -->
    <div
      class="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 id="modal-title" class="text-lg font-bold text-gray-900">Create Follow-up Campaign</h2>
        <button
          type="button"
          class="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          on:click={close}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <!-- Parent Campaign Info -->
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
              <svg
                class="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Based on</p>
              <p class="font-semibold text-gray-900">{parentCampaign.name}</p>
              <p class="text-sm text-gray-500">
                {parentCampaign.total_recipients.toLocaleString()} original recipients
              </p>
            </div>
          </div>
        </div>

        <!-- Exclusion Options -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            Exclude from Follow-up
          </h3>

          <div class="space-y-2">
            <!-- DNC Option -->
            <div
              class="flex items-center gap-4 p-4 rounded-xl border transition-all
                {excludeDnc ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-100'}"
            >
              <div class="flex-1">
                <p class="font-medium text-gray-900">Do Not Contact (DNC)</p>
                <p class="text-sm text-gray-500">Contacts who asked not to be reached</p>
              </div>
              <span class="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                {isLoadingPreview ? '...' : (preview?.dnc_count || 0).toLocaleString()}
              </span>
              <!-- Toggle Switch -->
              <button
                type="button"
                role="switch"
                aria-checked={excludeDnc}
                on:click={() => (excludeDnc = !excludeDnc)}
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 {excludeDnc
                  ? 'bg-gray-900'
                  : 'bg-gray-200'}"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {excludeDnc
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
                ></span>
              </button>
            </div>

            <!-- Failed Delivery Option (New) -->
            <div
              class="flex items-center gap-4 p-4 rounded-xl border transition-all
                {excludeFailedDelivery ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-100'}"
            >
              <div class="flex-1">
                <p class="font-medium text-gray-900">Failed Delivery</p>
                <p class="text-sm text-gray-500">Messages that failed or were undelivered</p>
              </div>
              <span class="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                {isLoadingPreview ? '...' : (preview?.failed_delivery_count || 0).toLocaleString()}
              </span>
              <!-- Toggle Switch -->
              <button
                type="button"
                role="switch"
                aria-checked={excludeFailedDelivery}
                on:click={() => (excludeFailedDelivery = !excludeFailedDelivery)}
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 {excludeFailedDelivery
                  ? 'bg-gray-900'
                  : 'bg-gray-200'}"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {excludeFailedDelivery
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
                ></span>
              </button>
            </div>

            <!-- No Reply Section (Enhanced with Targeting Option) -->
            <div class="p-4 rounded-xl border border-gray-100 bg-white space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Non-Responders</p>
                    <p class="text-xs text-gray-500">Contacts who didn't reply</p>
                  </div>
                </div>
                <span
                  class="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg"
                >
                  {isLoadingPreview ? '...' : (preview?.no_reply_count || 0).toLocaleString()}
                </span>
              </div>

              <!-- Mutually Exclusive Options -->
              <div class="grid grid-cols-2 gap-2 pt-2">
                <!-- Exclude No Reply -->
                <button
                  type="button"
                  class="flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all {excludeNoReply
                    ? 'border-red-400 bg-red-50 ring-1 ring-red-400'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'}"
                  on:click={() => {
                    excludeNoReply = !excludeNoReply;
                    if (excludeNoReply) targetOnlyNoReply = false; // Mutually exclusive
                  }}
                >
                  <div
                    class="w-4 h-4 rounded-full border-2 flex items-center justify-center {excludeNoReply
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-300'}"
                  >
                    {#if excludeNoReply}
                      <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                  <div>
                    <p
                      class="text-xs font-semibold {excludeNoReply
                        ? 'text-red-700'
                        : 'text-gray-600'}"
                    >
                      Exclude
                    </p>
                    <p class="text-[10px] {excludeNoReply ? 'text-red-600' : 'text-gray-400'}">
                      Skip silent contacts
                    </p>
                  </div>
                </button>

                <!-- Target ONLY No Reply -->
                <button
                  type="button"
                  class="flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all {targetOnlyNoReply
                    ? 'border-green-400 bg-green-50 ring-1 ring-green-400'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'}"
                  on:click={() => {
                    targetOnlyNoReply = !targetOnlyNoReply;
                    if (targetOnlyNoReply) excludeNoReply = false; // Mutually exclusive
                  }}
                >
                  <div
                    class="w-4 h-4 rounded-full border-2 flex items-center justify-center {targetOnlyNoReply
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'}"
                  >
                    {#if targetOnlyNoReply}
                      <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                  <div>
                    <p
                      class="text-xs font-semibold {targetOnlyNoReply
                        ? 'text-green-700'
                        : 'text-gray-600'}"
                    >
                      Target Only
                    </p>
                    <p class="text-[10px] {targetOnlyNoReply ? 'text-green-600' : 'text-gray-400'}">
                      Re-engage non-responders
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <!-- AI Priority Threshold Slider -->
            <div class="p-4 rounded-xl border border-gray-100 bg-white">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Min AI Priority</p>
                    <p class="text-xs text-gray-500">Exclude contacts below this score</p>
                  </div>
                </div>
                <span
                  class="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg"
                >
                  {isLoadingPreview
                    ? '...'
                    : (preview?.priority_excluded_count ?? 0).toLocaleString()} excluded
                </span>
              </div>

              <!-- Slider -->
              <div class="px-1">
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  bind:value={minPriorityThreshold}
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />

                <!-- Labels -->
                <div class="flex justify-between mt-2 text-xs">
                  <button
                    type="button"
                    class="flex flex-col items-center transition-colors {minPriorityThreshold === 0
                      ? 'text-purple-600 font-semibold'
                      : 'text-gray-400'}"
                    on:click={() => (minPriorityThreshold = 0)}
                  >
                    <span>All</span>
                    <span class="text-[10px]">Include all</span>
                  </button>
                  <button
                    type="button"
                    class="flex flex-col items-center transition-colors {minPriorityThreshold === 1
                      ? 'text-purple-600 font-semibold'
                      : 'text-gray-400'}"
                    on:click={() => (minPriorityThreshold = 1)}
                  >
                    <span>≥1</span>
                    <span class="text-[10px]"
                      >{isLoadingPreview ? '...' : preview?.priority_breakdown['0'] || 0}</span
                    >
                  </button>
                  <button
                    type="button"
                    class="flex flex-col items-center transition-colors {minPriorityThreshold === 2
                      ? 'text-purple-600 font-semibold'
                      : 'text-gray-400'}"
                    on:click={() => (minPriorityThreshold = 2)}
                  >
                    <span>≥2</span>
                    <span class="text-[10px]"
                      >{isLoadingPreview
                        ? '...'
                        : (preview?.priority_breakdown['0'] || 0) +
                          (preview?.priority_breakdown['1'] || 0)}</span
                    >
                  </button>
                  <button
                    type="button"
                    class="flex flex-col items-center transition-colors {minPriorityThreshold === 3
                      ? 'text-purple-600 font-semibold'
                      : 'text-gray-400'}"
                    on:click={() => (minPriorityThreshold = 3)}
                  >
                    <span>≥3</span>
                    <span class="text-[10px]"
                      >{isLoadingPreview
                        ? '...'
                        : (preview?.priority_breakdown['0'] || 0) +
                          (preview?.priority_breakdown['1'] || 0) +
                          (preview?.priority_breakdown['2'] || 0)}</span
                    >
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Remaining Audience -->
          <div
            class="mt-4 flex items-center justify-between px-4 py-3 bg-gray-900 text-white rounded-xl"
          >
            <span class="text-sm font-medium">Remaining audience</span>
            <span class="text-lg font-bold">{remainingCount.toLocaleString()} recipients</span>
          </div>
        </div>

        <!-- Campaign Name -->
        <div>
          <label for="campaign-name" class="block text-sm font-semibold text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            id="campaign-name"
            type="text"
            bind:value={name}
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
            placeholder="Follow-up campaign name"
          />
        </div>

        <!-- When to Send Section -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-3">When to Send?</label>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <!-- Execute Now Card -->
            <button
              type="button"
              class="relative p-4 rounded-xl border-2 text-left transition-all duration-200 {!scheduledAt
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 ring-1 ring-green-500'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}"
              on:click={() => (scheduledAt = '')}
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center {!scheduledAt
                    ? 'bg-green-500'
                    : 'bg-gray-100'}"
                >
                  <svg
                    class="w-4 h-4 {!scheduledAt ? 'text-white' : 'text-gray-500'}"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-gray-900 text-sm">Execute Now</p>
                  <p class="text-xs text-gray-500">Send immediately</p>
                </div>
              </div>
              {#if !scheduledAt}
                <div class="absolute top-2 right-2 text-green-500">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              {/if}
            </button>

            <!-- Schedule Later Card -->
            <button
              type="button"
              class="relative p-4 rounded-xl border-2 text-left transition-all duration-200 {scheduledAt
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-500'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}"
              on:click={() => {
                if (!scheduledAt) {
                  scheduledAt = getTomorrowAtHour(9);
                }
              }}
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center {scheduledAt
                    ? 'bg-blue-500'
                    : 'bg-gray-100'}"
                >
                  <svg
                    class="w-4 h-4 {scheduledAt ? 'text-white' : 'text-gray-500'}"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-gray-900 text-sm">Schedule</p>
                  <p class="text-xs text-gray-500">Choose date & time</p>
                </div>
              </div>
              {#if scheduledAt}
                <div class="absolute top-2 right-2 text-blue-500">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              {/if}
            </button>
          </div>

          <!-- Date/Time Picker (only when scheduling) -->
          {#if scheduledAt}
            <div
              class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4"
            >
              <label
                class="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2"
              >
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                bind:value={scheduledAt}
                class="block w-full rounded-xl border-blue-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 text-sm py-3 px-4 shadow-sm"
                min={getLocalMinDatetime()}
              />
            </div>
          {/if}
        </div>

        <!-- Message Body -->
        <div>
          <label for="message-body" class="block text-sm font-semibold text-gray-700 mb-2">
            Message
          </label>
          <div class="relative">
            <textarea
              id="message-body"
              bind:value={messageBody}
              rows="4"
              class="w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 resize-none transition-colors {validation?.requires_override &&
              !allowExpensiveEncoding
                ? 'border-amber-400 ring-1 ring-amber-400'
                : 'border-gray-200'}"
              placeholder="Hey {name}, just following up on..."
            ></textarea>
            <span class="absolute bottom-3 right-3 text-xs text-gray-400">
              {messageBody.length} chars
            </span>
          </div>

          <!-- Segment Info Bar -->
          {#if messageBody.length > 0}
            <div
              class="mt-2 flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div class="flex items-center gap-3 text-xs">
                {#if isValidating}
                  <span class="text-gray-400 flex items-center gap-1">
                    <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
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
                    Analyzing...
                  </span>
                {:else if validation}
                  <span class="flex items-center gap-1">
                    <span class="font-semibold text-gray-700">{validation.segment_count}</span>
                    <span class="text-gray-500"
                      >segment{validation.segment_count !== 1 ? 's' : ''}</span
                    >
                  </span>
                  <span class="text-gray-300">•</span>
                  <span
                    class="{validation.encoding === 'GSM-7'
                      ? 'text-green-600'
                      : 'text-amber-600'} font-medium"
                  >
                    {validation.encoding}
                  </span>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Expensive Encoding Warning -->
          {#if validation?.requires_override}
            <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div class="flex-1">
                  <p class="text-xs text-amber-700">
                    <strong>Expensive encoding:</strong> Special characters require UCS-2 ({validation.segment_count}
                    segments).
                  </p>
                  <div class="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={allowExpensiveEncoding}
                      on:click={() => (allowExpensiveEncoding = !allowExpensiveEncoding)}
                      class="relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 {allowExpensiveEncoding
                        ? 'bg-amber-600'
                        : 'bg-gray-300'}"
                    >
                      <span
                        class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 {allowExpensiveEncoding
                          ? 'translate-x-4'
                          : 'translate-x-0'}"
                      ></span>
                    </button>
                    <span class="text-[11px] text-amber-700">Allow anyway</span>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50"
      >
        <button
          type="button"
          class="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          on:click={close}
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed {scheduledAt
            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 shadow-blue-500/30'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/20 shadow-green-500/30'}"
          on:click={handleSubmit}
          disabled={isSubmitting || remainingCount === 0}
        >
          {#if isSubmitting}
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
            {scheduledAt ? 'Scheduling...' : 'Creating...'}
          {:else if !scheduledAt}
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Create & Run Now
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Schedule Follow-up
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
