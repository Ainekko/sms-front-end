<!--
  ElioConfigModal Component
  ===============================
  Modal for configuring the Elio Reddit Agent.
  
  Features:
  - Side-by-side design
  - Tag inputs for keywords
  - Unsaved changes tracking
  - Manual Scan button
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { elioApi, type ElioConfig } from '../../api/elio';
  import { showSuccess, showError } from '../../stores/uiStore';

  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  // State
  let isLoading = false;
  let isSaving = false;
  let error = '';
  let showUnsavedWarning = false;

  // Form Fields
  let includedKeywords: string[] = [];
  let excludedKeywords: string[] = [];
  let relevancyThreshold = 5;
  let promptText = '';

  // Input bindings for tags
  let newIncludedKeyword = '';
  let newExcludedKeyword = '';

  // Original state to track dirtiness
  let originalState = '';

  $: if (isOpen) {
    // Reset state when opened
    showUnsavedWarning = false;
    error = '';
    loadConfig();
  }

  // Dirtiness Check
  $: currentStateJson = JSON.stringify({
    includedKeywords,
    excludedKeywords,
    relevancyThreshold,
    promptText
  });

  $: hasUnsavedChanges = currentStateJson !== originalState && originalState !== '';

  async function loadConfig() {
    isLoading = true;
    error = '';

    try {
      const config = await elioApi.getConfig();
      includedKeywords = config.included_keywords || [];
      excludedKeywords = config.excluded_keywords || [];
      relevancyThreshold = config.relevancy_threshold ?? 5;
      promptText = config.prompt || '';

      // Save original state to check for dirtiness later
      originalState = JSON.stringify({
        includedKeywords,
        excludedKeywords,
        relevancyThreshold,
        promptText
      });
    } catch (err) {
      console.error('Failed to load Elio config:', err);
      // Initialize with empty state for backend-less dev
      includedKeywords = [];
      excludedKeywords = [];
      relevancyThreshold = 5;
      promptText = '';
      originalState = JSON.stringify({
        includedKeywords,
        excludedKeywords,
        relevancyThreshold,
        promptText
      });
      error = err instanceof Error ? err.message : 'Could not load config.';
    } finally {
      isLoading = false;
    }
  }

  // --- Tag Input Handlers ---

  function addIncluded(e: KeyboardEvent | Event) {
    if (e instanceof KeyboardEvent && e.key !== 'Enter') return;
    if (e instanceof KeyboardEvent) e.preventDefault();

    const val = newIncludedKeyword.trim();
    if (val && !includedKeywords.includes(val)) {
      includedKeywords = [...includedKeywords, val];
    }
    newIncludedKeyword = '';
  }

  function removeIncluded(keyword: string) {
    includedKeywords = includedKeywords.filter((k) => k !== keyword);
  }

  function addExcluded(e: KeyboardEvent | Event) {
    if (e instanceof KeyboardEvent && e.key !== 'Enter') return;
    if (e instanceof KeyboardEvent) e.preventDefault();

    const val = newExcludedKeyword.trim();
    if (val && !excludedKeywords.includes(val)) {
      excludedKeywords = [...excludedKeywords, val];
    }
    newExcludedKeyword = '';
  }

  function removeExcluded(keyword: string) {
    excludedKeywords = excludedKeywords.filter((k) => k !== keyword);
  }

  // --- API Handlers ---

  async function handleSave() {
    if (!hasUnsavedChanges) return;

    error = '';
    isSaving = true;
    showUnsavedWarning = false;

    const payload: Partial<ElioConfig> = {
      included_keywords: includedKeywords,
      excluded_keywords: excludedKeywords,
      relevancy_threshold: relevancyThreshold,
      prompt: promptText.trim()
    };

    try {
      await elioApi.updateConfig(payload);
      showSuccess('Configuration saved successfully');

      // Update original state
      originalState = JSON.stringify({
        includedKeywords,
        excludedKeywords,
        relevancyThreshold,
        promptText: payload.prompt
      });

      dispatch('close');
    } catch (err) {
      console.error('Failed to save config:', err);
      error = err instanceof Error ? err.message : 'Failed to save configuration';
      showError(error);
    } finally {
      isSaving = false;
    }
  }

  // --- Close Handlers ---

  function requestClose() {
    if (isSaving) return;

    if (hasUnsavedChanges) {
      if (!showUnsavedWarning) {
        showUnsavedWarning = true;
        // Also show a toast notification for slickness
        showError('You have unsaved changes. Save or discard them to continue.');
      } else {
        // Discarding changes
        dispatch('close');
      }
    } else {
      dispatch('close');
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      requestClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen && !isSaving) {
      requestClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-6xl animate-modal-in flex flex-col h-[85vh]"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0"
      >
        <div class="flex items-center space-x-4">
          <div
            class="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600
                   flex items-center justify-center text-white shadow-md shadow-orange-500/20"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Agent Configuration</h2>
            <p class="text-sm text-gray-500 font-medium">
              Fine-tune Elio's Reddit lead scanning behavior.
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <!-- Close Modal Icon -->
          <button
            type="button"
            class="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            on:click={requestClose}
            disabled={isSaving}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="flex-1 min-h-0 flex flex-col md:flex-row p-8 gap-8 bg-zinc-50/30 overflow-hidden">
        {#if isLoading}
          <div class="w-full h-full flex justify-center items-center">
            <div
              class="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
        {:else}
          <!-- LEFT COLUMN: Keywords & Settings -->
          <div class="w-full md:w-5/12 lg:w-4/12 flex flex-col space-y-8 overflow-y-auto pr-2 pb-4">
            <!-- Included Keywords -->
            <div class="space-y-2">
              <label for="includedKeywords" class="block text-sm font-bold text-gray-800">
                Keywords to Include
              </label>
              <p class="text-xs text-gray-500 font-medium">
                Require leads to have at least one of these keywords.
              </p>

              <div
                class="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all"
              >
                <div class="flex flex-wrap gap-2 mb-2">
                  {#each includedKeywords as keyword}
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {keyword}
                      <button
                        type="button"
                        class="ml-1.5 focus:outline-none hover:text-emerald-900"
                        on:click={() => removeIncluded(keyword)}
                      >
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"
                          ><path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          ></path></svg
                        >
                      </button>
                    </span>
                  {/each}
                </div>
                <input
                  type="text"
                  bind:value={newIncludedKeyword}
                  on:keydown={addIncluded}
                  placeholder="Type keyword and press Enter..."
                  class="w-full bg-transparent border-none p-1 focus:ring-0 text-sm font-medium text-gray-800 placeholder-gray-400"
                  disabled={isSaving}
                />
              </div>
            </div>

            <!-- Excluded Keywords -->
            <div class="space-y-2">
              <label for="excludedKeywords" class="block text-sm font-bold text-gray-800">
                Keywords to Exclude
              </label>
              <p class="text-xs text-gray-500 font-medium">
                Reject any leads that contain these keywords.
              </p>

              <div
                class="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all"
              >
                <div class="flex flex-wrap gap-2 mb-2">
                  {#each excludedKeywords as keyword}
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-100"
                    >
                      {keyword}
                      <button
                        type="button"
                        class="ml-1.5 focus:outline-none hover:text-red-900"
                        on:click={() => removeExcluded(keyword)}
                      >
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"
                          ><path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          ></path></svg
                        >
                      </button>
                    </span>
                  {/each}
                </div>
                <input
                  type="text"
                  bind:value={newExcludedKeyword}
                  on:keydown={addExcluded}
                  placeholder="Type keyword and press Enter..."
                  class="w-full bg-transparent border-none p-1 focus:ring-0 text-sm font-medium text-gray-800 placeholder-gray-400"
                  disabled={isSaving}
                />
              </div>
            </div>

            <!-- Relevancy Slider -->
            <div class="space-y-4 pt-4 border-t border-gray-200/60">
              <div class="flex justify-between items-center">
                <div>
                  <label for="relevancy" class="block text-sm font-bold text-gray-800">
                    Minimum Relevancy
                  </label>
                  <p class="text-xs text-gray-500 font-medium mt-0.5">
                    Filter out low-scoring leads.
                  </p>
                </div>
                <span
                  class="inline-flex items-center justify-center w-10 h-10 bg-orange-50 text-orange-600 rounded-xl text-lg font-black border border-orange-100 shadow-sm"
                >
                  {relevancyThreshold}
                </span>
              </div>

              <input
                id="relevancy"
                type="range"
                min="1"
                max="10"
                step="1"
                bind:value={relevancyThreshold}
                class="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500 shadow-inner"
                disabled={isSaving}
              />
              <div class="flex justify-between text-xs font-bold text-gray-400 px-1">
                <span>1 (Broad)</span>
                <span>10 (Strict)</span>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Prompt -->
          <div class="flex-1 flex flex-col h-full border-l border-gray-200/60 pl-8">
            <div class="mb-3">
              <label for="promptText" class="block text-sm font-bold text-gray-800">
                Agent System Prompt
              </label>
              <p class="text-xs text-gray-500 font-medium mt-1">
                Dictates how Elio evaluates and scores the Reddit posts. You can write as much as
                you need.
              </p>
            </div>

            <textarea
              id="promptText"
              bind:value={promptText}
              class="flex-1 w-full p-5 bg-white border border-gray-200 rounded-3xl resize-none shadow-sm
                     focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                     transition-all text-sm text-gray-800 placeholder-gray-400 font-mono leading-relaxed"
              placeholder="You are an expert sales assistant. Analyze the incoming Reddit posts and score them based on..."
              disabled={isSaving}
            ></textarea>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-white rounded-b-3xl flex-shrink-0"
      >
        <!-- Error or Warning display -->
        <div class="flex-1">
          {#if error}
            <p class="text-sm font-medium text-red-600 truncate mr-4 flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
                ><path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >
              {error}
            </p>
          {:else if showUnsavedWarning}
            <p class="text-sm font-bold text-red-600 flex items-center gap-2 animate-pulse">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
                ><path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >
              Unsaved changes! Click 'Discard' to ignore them.
            </p>
          {:else if hasUnsavedChanges}
            <p class="text-sm font-medium text-orange-500 flex items-center gap-2">
              ● You have unsaved changes
            </p>
          {/if}
        </div>

        <div class="flex items-center space-x-3 ml-auto">
          {#if showUnsavedWarning}
            <button
              type="button"
              class="px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100
                     rounded-xl transition-colors"
              on:click={() => dispatch('close')}
            >
              Discard Changes
            </button>
          {:else}
            <button
              type="button"
              class="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100
                     rounded-xl transition-colors"
              on:click={requestClose}
              disabled={isSaving}
            >
              {hasUnsavedChanges ? 'Cancel' : 'Close'}
            </button>
          {/if}

          <button
            type="button"
            class="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500
                   rounded-xl hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20
                   transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0
                   flex items-center space-x-2"
            on:click={handleSave}
            disabled={isSaving || isLoading || !hasUnsavedChanges}
          >
            {#if isSaving}
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
              <span>Saving...</span>
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{hasUnsavedChanges ? 'Save Settings' : 'Saved'}</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: scale(0.97) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-modal-in {
    animation: modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
</style>
