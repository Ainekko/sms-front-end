<!--
  GroupValidationProgress Component
  ==================================
  Displays validation progress and controls for a contact group.
  
  Features:
  - Progress bar with percentage (when processing)
  - Valid/Invalid/Pending counts
  - Auto-polling every 2 seconds while processing
  - Download CSV buttons by status
  - Start validation button for pending contacts
  
  Props:
    group: ContactGroup - The group to display validation status for
  
  Events:
    refresh - Emitted when group data should be refreshed
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { groupsApi, type ContactGroup, type ValidationStatusResponse } from '$lib/api/groups';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  /** The group to display validation status for */
  export let group: ContactGroup;

  const dispatch = createEventDispatcher<{
    refresh: void;
  }>();

  // State
  let isStartingValidation = false;
  let isPolling = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let validationStatus: ValidationStatusResponse | null = null;

  // Computed values from group or live status
  $: displayStatus = validationStatus?.validation_status ?? group.validation_status ?? null;
  $: displayProgress = validationStatus?.progress ?? group.validation_progress ?? 0;
  $: validCount = validationStatus?.valid_count ?? group.valid_count ?? 0;
  $: invalidCount = validationStatus?.invalid_count ?? group.invalid_count ?? 0;
  $: pendingCount = validationStatus?.pending_count ?? group.pending_count ?? 0;
  $: isProcessing = displayStatus === 'processing';
  $: hasValidationData = validCount > 0 || invalidCount > 0 || pendingCount > 0;

  // Start polling when processing
  $: if (isProcessing && !isPolling) {
    startPolling();
  } else if (!isProcessing && isPolling) {
    stopPolling();
  }

  onMount(() => {
    // Initial check - start polling if already processing
    if (group.validation_status === 'processing') {
      startPolling();
    }
  });

  onDestroy(() => {
    stopPolling();
  });

  function startPolling() {
    if (pollInterval) return;
    isPolling = true;
    pollInterval = setInterval(async () => {
      try {
        validationStatus = await groupsApi.getValidationStatus(group.id);
        if (validationStatus.validation_status !== 'processing') {
          stopPolling();
          dispatch('refresh');
        }
      } catch (err) {
        console.error('Failed to poll validation status:', err);
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    isPolling = false;
  }

  async function handleStartValidation(skipStage3 = false) {
    isStartingValidation = true;
    try {
      await groupsApi.startGroupValidation(group.id, skipStage3);
      showSuccess('Validation started');
      startPolling();
      dispatch('refresh');
    } catch (err) {
      console.error('Failed to start validation:', err);
      showError(err instanceof Error ? err.message : 'Failed to start validation');
    } finally {
      isStartingValidation = false;
    }
  }

  function handleDownload(filter: 'all' | 'valid' | 'invalid' | 'pending') {
    const url = groupsApi.getExportUrl(group.id, filter);
    // Open in new tab to trigger download
    window.open(url, '_blank');
  }
</script>

<!-- Validation Section -->
<div class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-bold text-gray-900">Phone Validation</h3>
    {#if displayStatus === 'completed'}
      <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
        Completed
      </span>
    {:else if displayStatus === 'processing'}
      <span
        class="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium flex items-center space-x-1"
      >
        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
        <span>Validating...</span>
      </span>
    {:else if displayStatus === 'failed'}
      <span class="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
        Failed
      </span>
    {/if}
  </div>

  <!-- Progress Bar (when processing) -->
  {#if isProcessing}
    <div class="mb-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm text-gray-600">Progress</span>
        <span class="text-sm font-medium text-gray-900">{displayProgress}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div
          class="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
          style="width: {displayProgress}%"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Validation Stats -->
  {#if hasValidationData || isProcessing}
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div class="text-center p-3 bg-emerald-50 rounded-xl">
        <p class="text-2xl font-bold text-emerald-600">{validCount}</p>
        <p class="text-xs text-emerald-700 font-medium">Valid</p>
      </div>
      <div class="text-center p-3 bg-red-50 rounded-xl">
        <p class="text-2xl font-bold text-red-600">{invalidCount}</p>
        <p class="text-xs text-red-700 font-medium">Invalid</p>
      </div>
      <div class="text-center p-3 bg-amber-50 rounded-xl">
        <p class="text-2xl font-bold text-amber-600">{pendingCount}</p>
        <p class="text-xs text-amber-700 font-medium">Pending</p>
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex flex-wrap gap-2">
    {#if !isProcessing && pendingCount > 0}
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 flex items-center space-x-2"
        on:click={() => handleStartValidation(false)}
        disabled={isStartingValidation}
      >
        {#if isStartingValidation}
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        {/if}
        <span>Validate {pendingCount} Contacts</span>
      </button>
    {/if}

    {#if validCount > 0}
      <button
        class="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center space-x-1"
        on:click={() => handleDownload('valid')}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>Download Valid</span>
      </button>
    {/if}

    {#if invalidCount > 0}
      <button
        class="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-1"
        on:click={() => handleDownload('invalid')}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>Download Invalid</span>
      </button>
    {/if}

    {#if group.contact_count > 0}
      <button
        class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
        on:click={() => handleDownload('all')}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>Download All</span>
      </button>
    {/if}
  </div>

  <!-- Empty state -->
  {#if !hasValidationData && !isProcessing && group.contact_count > 0}
    <div class="text-center py-6 text-gray-500">
      <svg
        class="w-12 h-12 mx-auto mb-3 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-sm">No contacts have been validated yet.</p>
      <p class="text-xs text-gray-400 mt-1 mb-4">
        Click below to check phone numbers for this group.
      </p>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 inline-flex items-center space-x-2"
        on:click={() => handleStartValidation(false)}
        disabled={isStartingValidation}
      >
        {#if isStartingValidation}
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        {/if}
        <span>Validate {group.contact_count} Contacts</span>
      </button>
    </div>
  {/if}
</div>
