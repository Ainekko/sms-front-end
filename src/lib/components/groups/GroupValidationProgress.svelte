<!--
  GroupValidationProgress Component
  ==================================
  Displays validation progress and controls for a contact group.
  
  State Management:
  - Uses validation_status as source of truth
  - null → Show "Validate" button  
  - pending/processing → Show progress, poll /validation-status every 2s
  - completed → Show counts, show "Revalidate" button
  - failed → Show error, show "Retry" button
  - After POST, immediately set local state to pending to avoid UI flash
  
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

  // Local state - these override group values when set
  let localStatus: 'pending' | 'processing' | 'completed' | 'failed' | null = null;
  let localProgress = 0;
  let localValidCount = 0;
  let localInvalidCount = 0;
  let localPendingCount = 0;

  // Other state
  let isStartingValidation = false;
  let isPolling = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  // Use local state if set, otherwise fall back to group data
  $: displayStatus = localStatus ?? group.validation_status ?? null;
  $: displayProgress = localStatus ? localProgress : (group.validation_progress ?? 0);
  $: validCount = localStatus ? localValidCount : (group.valid_count ?? 0);
  $: invalidCount = localStatus ? localInvalidCount : (group.invalid_count ?? 0);
  $: pendingCount = localStatus ? localPendingCount : (group.pending_count ?? 0);
  $: isProcessing = displayStatus === 'processing' || displayStatus === 'pending';
  $: hasValidationData = validCount > 0 || invalidCount > 0;

  // Start polling when processing
  $: if (isProcessing && !isPolling) {
    startPolling();
  } else if (!isProcessing && isPolling) {
    stopPolling();
  }

  // Reset local state when group changes
  $: if (group.id) {
    resetLocalState();
  }

  onMount(() => {
    // Initial check - start polling if already processing
    if (group.validation_status === 'processing' || group.validation_status === 'pending') {
      startPolling();
    }
  });

  onDestroy(() => {
    stopPolling();
  });

  function resetLocalState() {
    localStatus = null;
    localProgress = 0;
    localValidCount = 0;
    localInvalidCount = 0;
    localPendingCount = 0;
  }

  function startPolling() {
    if (pollInterval) return;
    isPolling = true;

    // Poll immediately, then every 2 seconds
    pollValidationStatus();
    pollInterval = setInterval(pollValidationStatus, 2000);
  }

  async function pollValidationStatus() {
    try {
      const status = await groupsApi.getValidationStatus(group.id);

      // Update local state from polling response
      localStatus = status.validation_status;
      localProgress = status.progress;
      localValidCount = status.valid_count;
      localInvalidCount = status.invalid_count;
      localPendingCount = status.pending_count;

      // Stop polling when done
      if (status.validation_status === 'completed' || status.validation_status === 'failed') {
        stopPolling();
        dispatch('refresh');
      }
    } catch (err) {
      console.error('Failed to poll validation status:', err);
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    isPolling = false;
  }

  async function handleStartValidation(force = false) {
    isStartingValidation = true;

    // Immediately set local state to pending with reset counts
    // This prevents showing stale data
    localStatus = 'pending';
    localProgress = 0;
    localValidCount = 0;
    localInvalidCount = 0;
    localPendingCount = group.contact_count;

    try {
      await groupsApi.startGroupValidation(group.id, false, force);
      showSuccess('Validation started');
      startPolling();
    } catch (err) {
      console.error('Failed to start validation:', err);
      showError(err instanceof Error ? err.message : 'Failed to start validation');
      // Reset local state on error
      resetLocalState();
    } finally {
      isStartingValidation = false;
    }
  }

  async function handleDownload(filter: 'all' | 'valid' | 'invalid' | 'pending') {
    try {
      await groupsApi.exportGroupContacts(group.id, filter);
    } catch (err) {
      console.error('Failed to export contacts:', err);
      showError(err instanceof Error ? err.message : 'Failed to export contacts');
    }
  }
</script>

<!-- Validation Section - Dark Theme Design -->
<div class="bg-[#111113] rounded-xl border border-white/5">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between">
    <h3 class="text-[0.9rem] font-semibold text-[#f4f4f5] m-0">Phone Validation</h3>
    <div class="flex items-center space-x-3">
      {#if displayStatus === 'completed'}
        <span class="text-[0.75rem] font-semibold uppercase tracking-wider text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/20 px-2 py-1 rounded-md">Completed</span>
      {:else if displayStatus === 'processing' || displayStatus === 'pending'}
        <span class="text-sm text-zinc-400 flex items-center space-x-2">
          <svg class="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span>Validating...</span>
        </span>
      {:else if displayStatus === 'failed'}
        <span class="text-[0.75rem] font-semibold uppercase tracking-wider text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20 px-2 py-1 rounded-md">Failed</span>
      {/if}

      <!-- Action Buttons in Header -->
      {#if displayStatus === null && group.contact_count > 0}
        <button
          class="px-3 py-2 text-[0.78rem] font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-500 rounded-[9px] hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 flex items-center space-x-2 border-none"
          on:click={() => handleStartValidation(false)}
          disabled={isStartingValidation}
        >
          {#if isStartingValidation}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
          <span>Validate</span>
        </button>
      {/if}

      {#if (displayStatus === 'completed' || displayStatus === 'failed') && group.contact_count > 0}
        <button
          class="px-3 py-2 text-[0.78rem] font-semibold text-zinc-300 bg-transparent border border-white/10 rounded-[9px] hover:bg-white/5 transition-all disabled:opacity-50 flex items-center space-x-2"
          on:click={() => handleStartValidation(true)}
          disabled={isStartingValidation}
        >
          {#if isStartingValidation}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          {/if}
          <span>{displayStatus === 'failed' ? 'Retry' : 'Revalidate'}</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Content -->
  <div class="p-6">
    <!-- Progress Bar (when processing) -->
    {#if isProcessing}
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Progress</span>
          <span class="text-sm font-semibold text-zinc-100">{displayProgress}%</span>
        </div>
        <div class="w-full bg-white/5 rounded-full h-2 border border-white/5">
          <div
            class="bg-indigo-500 h-2 rounded-full transition-all duration-300 relative overflow-hidden"
            style="width: {displayProgress}%"
          >
            <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        <!-- Show live counts while processing -->
        <div class="grid grid-cols-3 gap-4 mt-6">
          <div class="text-center p-3 bg-white/5 rounded-xl border border-white/5">
            <p class="text-lg font-bold text-zinc-100">{localValidCount}</p>
            <p class="text-[0.7rem] uppercase tracking-wider text-zinc-500 mt-1">Valid</p>
          </div>
          <div class="text-center p-3 bg-white/5 rounded-xl border border-white/5">
            <p class="text-lg font-bold text-zinc-100">{localInvalidCount}</p>
            <p class="text-[0.7rem] uppercase tracking-wider text-zinc-500 mt-1">Invalid</p>
          </div>
          <div class="text-center p-3 bg-white/5 rounded-xl border border-white/5">
            <p class="text-lg font-bold text-zinc-100">{localPendingCount}</p>
            <p class="text-[0.7rem] uppercase tracking-wider text-zinc-500 mt-1">Pending</p>
          </div>
        </div>
      </div>
    {:else if hasValidationData}
      <!-- Completed Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-4 bg-white/5 rounded-xl border border-white/5">
          <p class="text-2xl font-bold text-zinc-100">{validCount}</p>
          <p class="text-[0.7rem] uppercase tracking-wider text-zinc-500 font-medium mt-1">Valid</p>
        </div>
        <div class="text-center p-4 bg-white/5 rounded-xl border border-white/5">
          <p class="text-2xl font-bold text-zinc-100">{invalidCount}</p>
          <p class="text-[0.7rem] uppercase tracking-wider text-zinc-500 font-medium mt-1">Invalid</p>
        </div>
        <div class="text-center p-4 bg-white/5 rounded-xl border border-white/5">
          <p class="text-2xl font-bold text-zinc-100">{pendingCount}</p>
          <p class="text-[0.7rem] uppercase tracking-wider text-zinc-500 font-medium mt-1">Pending</p>
        </div>
      </div>

      <!-- Download Actions -->
      <div class="flex flex-wrap gap-3">
        {#if validCount > 0}
          <button
            class="px-3 py-2 text-[0.78rem] font-semibold text-zinc-300 bg-transparent border border-white/10 rounded-[9px] hover:bg-white/5 transition-all flex items-center space-x-2"
            on:click={() => handleDownload('valid')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Valid ({validCount})</span>
          </button>
        {/if}

        {#if invalidCount > 0}
          <button
            class="px-3 py-2 text-[0.78rem] font-semibold text-zinc-300 bg-transparent border border-white/10 rounded-[9px] hover:bg-white/5 transition-all flex items-center space-x-2"
            on:click={() => handleDownload('invalid')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Invalid ({invalidCount})</span>
          </button>
        {/if}

        {#if group.contact_count > 0}
          <button
            class="px-3 py-2 text-[0.78rem] font-semibold text-zinc-300 bg-transparent border border-white/10 rounded-[9px] hover:bg-white/5 transition-all flex items-center space-x-2"
            on:click={() => handleDownload('all')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>All ({group.contact_count})</span>
          </button>
        {/if}
      </div>
    {:else if displayStatus === null && group.contact_count > 0}
      <!-- Empty state - never validated -->
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-zinc-300 mb-1">No contacts have been validated yet.</p>
        <p class="text-xs text-zinc-500 mb-5">Validate phone numbers to check deliverability.</p>
        <button
          class="px-4 py-2 text-[0.78rem] font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-500 rounded-[9px] hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 inline-flex items-center space-x-2 border-none"
          on:click={() => handleStartValidation(false)}
          disabled={isStartingValidation}
        >
          {#if isStartingValidation}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
          <span>Validate {group.contact_count} Contacts</span>
        </button>
      </div>
    {:else}
      <!-- No contacts state -->
      <div class="text-center py-8">
        <p class="text-sm text-zinc-500">Add contacts to this group to validate them.</p>
      </div>
    {/if}
  </div>
</div>
