<!--
  BulkMessageModal Component
  ===========================
  Modal for sending bulk SMS messages to brand contacts.
  
  This component:
  - Multi-select brands to target
  - Compose message with character count
  - Preview recipients before sending
  - Progress during send operation
  - Results summary after completion
  
  Props:
    isOpen: boolean - Whether the modal is visible
  
  Events:
    close - Modal should be closed
  
  Usage:
    <BulkMessageModal 
      isOpen={showBulkModal} 
      on:close={() => showBulkModal = false}
    />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Import stores and API
  import { brandsStore, type Brand } from '../stores/brandsStore';
  import {
    bulkApi,
    type BulkPreviewResponse,
    type BulkSendResponse,
    type GroupSendRequest
  } from '../api/bulk';
  import { groupsApi, type ContactGroup } from '../api/groups';
  import { showSuccess, showError } from '../stores/uiStore';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Whether the modal is open */
  export let isOpen = false;

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** Selected brand IDs */
  let selectedBrandIds: Set<string> = new Set();

  /** Send mode: 'brands' or 'groups' */
  let sendMode: 'brands' | 'groups' = 'brands';

  /** Groups list and selection */
  let groups: ContactGroup[] = [];
  let selectedGroupId = '';
  let selectedFromBrandId = '';
  let isLoadingGroups = false;

  /** Message content */
  let message = '';

  /** Current step: 'compose' | 'preview' | 'sending' | 'results' */
  let step: 'compose' | 'preview' | 'sending' | 'results' = 'compose';

  /** Preview data */
  let previewData: BulkPreviewResponse | null = null;

  /** Send results */
  let sendResults: BulkSendResponse | null = null;

  /** Loading states */
  let isLoadingPreview = false;
  let isSending = false;

  /** Error message */
  let error = '';

  // ==========================================================================
  // Constants
  // ==========================================================================

  const MAX_MESSAGE_LENGTH = 1600;

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  $: brands = $brandsStore.brands;
  $: selectedBrands = brands.filter((b) => selectedBrandIds.has(b.id));
  $: canPreview =
    sendMode === 'brands'
      ? selectedBrandIds.size > 0 && message.trim().length > 0
      : selectedGroupId && selectedFromBrandId && message.trim().length > 0;
  $: messageLength = message.length;
  $: isOverLimit = messageLength > MAX_MESSAGE_LENGTH;

  // Reset state when modal opens
  $: if (isOpen) {
    resetState();
    loadGroups();
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Reset all state to initial values.
   */
  function resetState(): void {
    selectedBrandIds = new Set();
    selectedGroupId = '';
    selectedFromBrandId = brands.length > 0 ? brands[0].id : '';
    sendMode = 'brands';
    message = '';
    step = 'compose';
    previewData = null;
    sendResults = null;
    error = '';
  }

  /**
   * Load groups from API.
   */
  async function loadGroups(): Promise<void> {
    isLoadingGroups = true;
    try {
      groups = await groupsApi.listGroups();
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      isLoadingGroups = false;
    }
  }

  /**
   * Toggle brand selection.
   */
  function toggleBrand(brandId: string): void {
    const newSet = new Set(selectedBrandIds);
    if (newSet.has(brandId)) {
      newSet.delete(brandId);
    } else {
      newSet.add(brandId);
    }
    selectedBrandIds = newSet;
  }

  /**
   * Select all brands.
   */
  function selectAllBrands(): void {
    selectedBrandIds = new Set(brands.map((b) => b.id));
  }

  /**
   * Clear brand selection.
   */
  function clearSelection(): void {
    selectedBrandIds = new Set();
  }

  /**
   * Handle preview step.
   */
  async function handlePreview(): Promise<void> {
    if (!canPreview || isOverLimit) return;

    error = '';
    isLoadingPreview = true;

    try {
      if (sendMode === 'brands') {
        previewData = await bulkApi.previewBulkSend(Array.from(selectedBrandIds), message.trim());
      } else {
        previewData = await bulkApi.previewGroupSend({
          group_id: selectedGroupId,
          from_brand_id: selectedFromBrandId,
          message: message.trim()
        });
      }
      step = 'preview';
    } catch (err) {
      console.error('Failed to preview:', err);
      error = err instanceof Error ? err.message : 'Failed to load preview';
    } finally {
      isLoadingPreview = false;
    }
  }

  /**
   * Handle sending messages.
   */
  async function handleSend(): Promise<void> {
    if (!previewData) return;

    error = '';
    step = 'sending';
    isSending = true;

    try {
      if (sendMode === 'brands') {
        sendResults = await bulkApi.sendBulkMessage(Array.from(selectedBrandIds), message.trim());
      } else {
        sendResults = await bulkApi.sendToGroup({
          group_id: selectedGroupId,
          from_brand_id: selectedFromBrandId,
          message: message.trim()
        });
      }
      step = 'results';

      if (sendResults.success) {
        showSuccess(`Successfully sent ${sendResults.total_sent} messages`);
      } else {
        showError(`Sent ${sendResults.total_sent}, failed ${sendResults.total_failed}`);
      }
    } catch (err) {
      console.error('Failed to send:', err);
      error = err instanceof Error ? err.message : 'Failed to send messages';
      step = 'preview';
    } finally {
      isSending = false;
    }
  }

  /**
   * Go back to compose step.
   */
  function goBack(): void {
    step = 'compose';
    previewData = null;
  }

  /**
   * Handle modal close.
   */
  function handleClose(): void {
    if (!isSending) {
      resetState();
      dispatch('close');
    }
  }

  /**
   * Handle backdrop click.
   */
  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  /**
   * Handle Escape key.
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isOpen && !isSending) {
      handleClose();
    }
  }
</script>

<!-- Keyboard handler -->
<svelte:window on:keydown={handleKeydown} />

<!-- Modal Backdrop -->
{#if isOpen}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-modal-in"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600
                                flex items-center justify-center text-white"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Bulk Message</h2>
            <p class="text-sm text-gray-500">
              {#if step === 'compose'}
                Select brands and compose your message
              {:else if step === 'preview'}
                Review recipients before sending
              {:else if step === 'sending'}
                Sending messages...
              {:else}
                Send complete
              {/if}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          on:click={handleClose}
          disabled={isSending}
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

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Error Message -->
        {#if error}
          <div
            class="flex items-center space-x-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-4"
          >
            <svg
              class="w-5 h-5 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}

        <!-- Step: Compose -->
        {#if step === 'compose'}
          <div class="space-y-6">
            <!-- Mode Toggle -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Send To</label>
              <div class="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  class="flex-1 px-4 py-2.5 text-sm font-medium transition-colors
                         {sendMode === 'brands'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}"
                  on:click={() => (sendMode = 'brands')}
                >
                  <span class="flex items-center justify-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>By Brands</span>
                  </span>
                </button>
                <button
                  type="button"
                  class="flex-1 px-4 py-2.5 text-sm font-medium transition-colors
                         {sendMode === 'groups'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}"
                  on:click={() => (sendMode = 'groups')}
                >
                  <span class="flex items-center justify-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>By Group</span>
                  </span>
                </button>
              </div>
            </div>

            <!-- Brand Selection (when mode is 'brands') -->
            {#if sendMode === 'brands'}
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-sm font-medium text-gray-700">
                    Select Brands <span class="text-red-500">*</span>
                  </label>
                  <div class="flex space-x-2 text-xs">
                    <button
                      type="button"
                      class="text-blue-600 hover:underline"
                      on:click={selectAllBrands}
                    >
                      Select All
                    </button>
                    <span class="text-gray-300">|</span>
                    <button
                      type="button"
                      class="text-gray-500 hover:underline"
                      on:click={clearSelection}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {#each brands as brand (brand.id)}
                    <button
                      type="button"
                      class="flex items-center space-x-2 px-3 py-2 rounded-lg border text-left transition-colors
                             {selectedBrandIds.has(brand.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'}"
                      on:click={() => toggleBrand(brand.id)}
                    >
                      <div
                        class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                               {selectedBrandIds.has(brand.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'}"
                      >
                        {#if selectedBrandIds.has(brand.id)}
                          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fill-rule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        {/if}
                      </div>
                      <span class="text-sm font-medium truncate">{brand.name}</span>
                    </button>
                  {/each}
                </div>

                {#if selectedBrandIds.size > 0}
                  <p class="mt-2 text-xs text-gray-500">
                    {selectedBrandIds.size} brand{selectedBrandIds.size !== 1 ? 's' : ''} selected
                  </p>
                {/if}
              </div>

              <!-- Group Selection (when mode is 'groups') -->
            {:else}
              <div class="space-y-4">
                <!-- Select Group -->
                <div>
                  <label for="select-group" class="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Group <span class="text-red-500">*</span>
                  </label>
                  {#if isLoadingGroups}
                    <div class="flex items-center space-x-2 py-2">
                      <div
                        class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                      ></div>
                      <span class="text-sm text-gray-500">Loading groups...</span>
                    </div>
                  {:else if groups.length === 0}
                    <p class="text-sm text-gray-500 py-2">
                      No groups available. Create a group first.
                    </p>
                  {:else}
                    <select
                      id="select-group"
                      bind:value={selectedGroupId}
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             transition-colors bg-white"
                    >
                      <option value="">-- Select a group --</option>
                      {#each groups as group}
                        <option value={group.id}
                          >{group.name} ({group.contact_count} contacts)</option
                        >
                      {/each}
                    </select>
                  {/if}
                </div>

                <!-- Select From Brand -->
                <div>
                  <label for="from-brand" class="block text-sm font-medium text-gray-700 mb-1.5">
                    Send From <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="from-brand"
                    bind:value={selectedFromBrandId}
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-colors bg-white"
                  >
                    {#each brands.filter((b) => b.isActive) as brand}
                      <option value={brand.id}>{brand.name} ({brand.phoneNumber})</option>
                    {/each}
                  </select>
                  <p class="text-xs text-gray-500 mt-1">
                    Messages will be sent from this brand's phone number.
                  </p>
                </div>
              </div>
            {/if}

            <!-- Message Composition -->
            <div>
              <label for="bulk-message" class="block text-sm font-medium text-gray-700 mb-2">
                Message <span class="text-red-500">*</span>
              </label>
              <textarea
                id="bulk-message"
                bind:value={message}
                placeholder="Type your message here..."
                rows="5"
                class="w-full px-4 py-3 border rounded-lg resize-none
                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                       transition-colors placeholder:text-gray-400
                                       {isOverLimit ? 'border-red-500' : 'border-gray-300'}"
              ></textarea>
              <div class="flex justify-between mt-2">
                <p class="text-xs {isOverLimit ? 'text-red-500' : 'text-gray-500'}">
                  {messageLength} / {MAX_MESSAGE_LENGTH} characters
                </p>
                {#if messageLength > 160}
                  <p class="text-xs text-amber-600">
                    ~{Math.ceil(messageLength / 160)} SMS segments
                  </p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Step: Preview -->
        {:else if step === 'preview' && previewData}
          <div class="space-y-4">
            <!-- Summary -->
            <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p class="text-2xl font-bold text-blue-700">{previewData.total_recipients}</p>
                <p class="text-sm text-blue-600">Total Recipients</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-blue-700">
                  {previewData.brands.length} brand{previewData.brands.length !== 1 ? 's' : ''}
                </p>
                <p class="text-xs text-blue-600">will send this message</p>
              </div>
            </div>

            <!-- Brand Breakdown -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-2">Breakdown by Brand</h4>
              <div class="space-y-2">
                {#each previewData.brands as brand}
                  <div class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <span class="text-sm text-gray-700">{brand.brand_name}</span>
                    <span class="text-sm font-medium text-gray-900"
                      >{brand.contact_count} contacts</span
                    >
                  </div>
                {/each}
              </div>
            </div>

            <!-- Message Preview -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-2">Message Preview</h4>
              <div class="px-4 py-3 bg-gray-100 rounded-lg">
                <p class="text-sm text-gray-800 whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          </div>

          <!-- Step: Sending -->
        {:else if step === 'sending'}
          <div class="flex flex-col items-center justify-center py-12">
            <svg class="w-16 h-16 text-blue-500 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
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
            <p class="text-lg font-medium text-gray-700">Sending messages...</p>
            <p class="text-sm text-gray-500 mt-1">Please wait while we send to all recipients</p>
          </div>

          <!-- Step: Results -->
        {:else if step === 'results' && sendResults}
          <div class="space-y-4">
            <!-- Summary -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-green-50 rounded-lg text-center">
                <p class="text-3xl font-bold text-green-600">{sendResults.total_sent}</p>
                <p class="text-sm text-green-700">Sent Successfully</p>
              </div>
              <div class="p-4 bg-red-50 rounded-lg text-center">
                <p class="text-3xl font-bold text-red-600">{sendResults.total_failed}</p>
                <p class="text-sm text-red-700">Failed</p>
              </div>
            </div>

            <!-- Status Message -->
            {#if sendResults.success}
              <div class="flex items-center space-x-2 p-4 bg-green-100 rounded-lg">
                <svg
                  class="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p class="text-sm text-green-800">All messages sent successfully!</p>
              </div>
            {:else}
              <div class="flex items-center space-x-2 p-4 bg-amber-100 rounded-lg">
                <svg
                  class="w-6 h-6 text-amber-600"
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
                <p class="text-sm text-amber-800">
                  Some messages failed to send. Check the details below.
                </p>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl"
      >
        <div>
          {#if step === 'preview'}
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              on:click={goBack}
            >
              ← Back to Edit
            </button>
          {/if}
        </div>

        <div class="flex space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300
                               rounded-lg hover:bg-gray-50 transition-colors"
            on:click={handleClose}
            disabled={isSending}
          >
            {step === 'results' ? 'Done' : 'Cancel'}
          </button>

          {#if step === 'compose'}
            <button
              type="button"
              class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg
                                   hover:bg-blue-700 transition-colors disabled:opacity-50
                                   flex items-center space-x-2"
              on:click={handlePreview}
              disabled={!canPreview || isOverLimit || isLoadingPreview}
            >
              {#if isLoadingPreview}
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                <span>Loading...</span>
              {:else}
                <span>Preview Recipients</span>
              {/if}
            </button>
          {:else if step === 'preview'}
            <button
              type="button"
              class="px-6 py-2 text-sm text-white bg-gradient-to-r from-orange-500 to-pink-600
                                   rounded-lg hover:from-orange-600 hover:to-pink-700 transition-all
                                   shadow-md hover:shadow-lg"
              on:click={handleSend}
            >
              Send to {previewData?.total_recipients} Recipients
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-modal-in {
    animation: modal-in 0.2s ease-out;
  }
</style>
