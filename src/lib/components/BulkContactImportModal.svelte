<!--
  BulkContactImportModal Component
  =================================
  Modal for importing contacts from CSV file.
  
  This component:
  - File upload with drag-and-drop
  - CSV preview with validation
  - Brand association options
  - Progress and results display
  
  Props:
    isOpen: boolean - Whether the modal is visible
  
  Events:
    close - Modal should be closed
    imported - Contacts were successfully imported
  
  Usage:
    <BulkContactImportModal 
      isOpen={showImportModal} 
      on:close={() => showImportModal = false}
      on:imported={handleImported}
    />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Import stores and API
  import { brandsStore, type Brand } from '../stores/brandsStore';
  import {
    bulkImportContacts,
    type BulkContactImportResponse,
    type BulkContactImportError
  } from '../api/contacts';
  import { showSuccess, showError } from '../stores/uiStore';
  import { groupsApi, type ContactGroup } from '../api/groups';

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
    imported: { created_count: number };
  }>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** Selected brand IDs to associate contacts with */
  let selectedBrandIds: Set<string> = new Set();

  /** Available groups */
  let groups: ContactGroup[] = [];
  let isLoadingGroups = false;

  /** Selected Group ID */
  let selectedGroupId = '';

  /** New Group Name */
  let newGroupName = '';

  /** Skip duplicates option */
  let skipDuplicates = true;

  /** File input reference */
  let fileInput: HTMLInputElement;

  /** Selected file */
  let selectedFile: File | null = null;

  /** CSV content preview */
  let csvPreview: string[] = [];

  /** Current step: 'upload' | 'configure' | 'importing' | 'results' */
  let step: 'upload' | 'configure' | 'importing' | 'results' = 'upload';

  /** Import results */
  let importResults: BulkContactImportResponse | null = null;

  /** Loading/error states */
  let isImporting = false;
  let error = '';

  /** Drag-and-drop state */
  let isDragOver = false;

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  $: brands = $brandsStore.brands;

  // Reset state when modal opens
  $: if (isOpen) {
    resetState();
    fetchGroups();
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
    newGroupName = '';
    skipDuplicates = true;
    selectedFile = null;
    csvPreview = [];
    step = 'upload';
    importResults = null;
    error = '';
    isDragOver = false;
  }

  /**
   * Fetch available groups.
   */
  async function fetchGroups(): Promise<void> {
    try {
      isLoadingGroups = true;
      groups = await groupsApi.listGroups();
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      // Don't show error to user as this is optional functionality
    } finally {
      isLoadingGroups = false;
    }
  }

  /**
   * Handle file selection.
   */
  async function handleFileSelect(file: File): Promise<void> {
    if (!file.name.endsWith('.csv')) {
      error = 'Please select a CSV file';
      return;
    }

    error = '';
    selectedFile = file;

    // Read and preview first few lines
    try {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 6); // Header + 5 data rows max
      csvPreview = lines.filter((line) => line.trim());
      step = 'configure';
    } catch (err) {
      error = 'Failed to read file';
      console.error('File read error:', err);
    }
  }

  /**
   * Handle file input change.
   */
  function handleInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      handleFileSelect(input.files[0]);
    }
  }

  /**
   * Handle drag over.
   */
  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    isDragOver = true;
  }

  /**
   * Handle drag leave.
   */
  function handleDragLeave(): void {
    isDragOver = false;
  }

  /**
   * Handle drop.
   */
  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    isDragOver = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      handleFileSelect(file);
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
   * Handle import.
   */
  async function handleImport(): Promise<void> {
    if (!selectedFile) return;

    error = '';
    step = 'importing';
    isImporting = true;

    try {
      const csvContent = await selectedFile.text();

      importResults = await bulkImportContacts({
        csv_content: csvContent,
        brand_ids: selectedBrandIds.size > 0 ? Array.from(selectedBrandIds) : undefined,
        skip_duplicates: skipDuplicates,
        group_id: selectedGroupId || undefined,
        group_name: !selectedGroupId && newGroupName ? newGroupName : undefined
      });

      step = 'results';

      if (importResults.success && importResults.created_count > 0) {
        showSuccess(`Imported ${importResults.created_count} contacts`);
        dispatch('imported', { created_count: importResults.created_count });
      } else if (importResults.created_count > 0) {
        showSuccess(`Imported ${importResults.created_count} contacts with some errors`);
        dispatch('imported', { created_count: importResults.created_count });
      }
    } catch (err) {
      console.error('Import failed:', err);
      error = err instanceof Error ? err.message : 'Import failed';
      step = 'configure';
    } finally {
      isImporting = false;
    }
  }

  /**
   * Go back to upload step.
   */
  function goBack(): void {
    if (step === 'configure') {
      step = 'upload';
      selectedFile = null;
      csvPreview = [];
    } else if (step === 'results') {
      resetState();
    }
  }

  /**
   * Handle modal close.
   */
  function handleClose(): void {
    if (!isImporting) {
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
    if (event.key === 'Escape' && isOpen && !isImporting) {
      handleClose();
    }
  }

  /**
   * Trigger file input click.
   */
  function triggerFileInput(): void {
    fileInput?.click();
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
      class="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-modal-in"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600
                   flex items-center justify-center text-white"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Import Contacts</h2>
            <p class="text-sm text-gray-500">
              {#if step === 'upload'}
                Upload a CSV file to import contacts
              {:else if step === 'configure'}
                Configure import options
              {:else if step === 'importing'}
                Importing contacts...
              {:else}
                Import complete
              {/if}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          on:click={handleClose}
          disabled={isImporting}
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

        <!-- Step: Upload -->
        {#if step === 'upload'}
          <div class="space-y-4">
            <!-- Drop Zone -->
            <div
              class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                     {isDragOver
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}"
              on:click={triggerFileInput}
              on:dragover={handleDragOver}
              on:dragleave={handleDragLeave}
              on:drop={handleDrop}
              role="button"
              tabindex="0"
            >
              <svg
                class="w-12 h-12 mx-auto mb-4 {isDragOver ? 'text-emerald-500' : 'text-gray-400'}"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="text-gray-700 font-medium mb-1">
                {isDragOver ? 'Drop CSV file here' : 'Click or drag CSV file to upload'}
              </p>
              <p class="text-sm text-gray-500">Supports CSV files with phone numbers</p>
            </div>

            <input
              bind:this={fileInput}
              type="file"
              accept=".csv"
              class="hidden"
              on:change={handleInputChange}
            />

            <!-- CSV Format Info -->
            <div class="bg-gray-50 rounded-lg p-4 text-sm">
              <h4 class="font-medium text-gray-700 mb-2">Expected CSV Format</h4>
              <code class="block bg-white p-3 rounded border text-xs text-gray-600 overflow-x-auto">
                First Name,Last Name,Phone Number,Email,Address<br />
                John,Little,7167035161,john@example.com,"284 Elmwood Ave"
              </code>
              <ul class="mt-3 space-y-1 text-gray-600">
                <li class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span><strong>Phone Number</strong> is required</span>
                </li>
                <li class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>Phone numbers are auto-normalized to E.164 format</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Step: Configure -->
        {:else if step === 'configure'}
          <div class="space-y-6">
            <!-- File Info -->
            <div class="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
              <svg
                class="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{selectedFile?.name}</p>
                <p class="text-xs text-gray-500">
                  {Math.round((selectedFile?.size || 0) / 1024)} KB
                </p>
              </div>
              <button
                type="button"
                class="text-gray-400 hover:text-red-500 transition-colors"
                on:click={goBack}
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

            <!-- CSV Preview -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div class="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                <table class="text-xs text-left w-full">
                  {#each csvPreview as line, i}
                    <tr class={i === 0 ? 'font-semibold text-gray-700' : 'text-gray-600'}>
                      {#each line.split(',').slice(0, 5) as cell}
                        <td class="px-2 py-1 whitespace-nowrap"
                          >{cell.replace(/"/g, '').trim() || '-'}</td
                        >
                      {/each}
                    </tr>
                  {/each}
                </table>
              </div>
            </div>

            <!-- Options -->
            <div class="space-y-4">
              <!-- Skip Duplicates -->
              <label class="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={skipDuplicates}
                  class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span class="text-sm text-gray-700">Skip duplicate phone numbers</span>
              </label>

              <!-- Brand Selection (Optional) -->
              {#if brands.length > 0}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Associate with brands (optional)
                  </label>
                  <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                    {#each brands as brand (brand.id)}
                      <button
                        type="button"
                        class="flex items-center space-x-2 px-3 py-2 rounded-lg border text-left transition-colors text-sm
                               {selectedBrandIds.has(brand.id)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'}"
                        on:click={() => toggleBrand(brand.id)}
                      >
                        <div
                          class="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                 {selectedBrandIds.has(brand.id)
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'}"
                        >
                          {#if selectedBrandIds.has(brand.id)}
                            <svg
                              class="w-2.5 h-2.5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          {/if}
                        </div>
                        <span class="truncate">{brand.name}</span>
                      </button>
                    {/each}
                  </div>
                  {#if selectedBrandIds.size > 0}
                    <p class="mt-2 text-xs text-gray-500">
                      {selectedBrandIds.size} brand{selectedBrandIds.size !== 1 ? 's' : ''} selected
                    </p>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Group Assignment -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
              <label class="block text-sm font-medium text-gray-700">
                Assign to Group (Optional)
              </label>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-500">
                <!-- Select Existing Group -->
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Select Existing Group</label>
                  <select
                    bind:value={selectedGroupId}
                    class="w-full rounded-lg p-2 border border-gray-300 bg-gray-50 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    disabled={!!newGroupName}
                  >
                    <option value="">-- Select Group --</option>
                    {#each groups as group}
                      <option value={group.id}>{group.name} ({group.contact_count} contacts)</option
                      >
                    {/each}
                  </select>
                </div>

                <!-- Create New Group -->
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Or Create New Group</label>
                  <input
                    type="text"
                    bind:value={newGroupName}
                    placeholder="Enter new group name"
                    class="w-full rounded-lg border p-2 border-gray-300 bg-gray-50 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    disabled={!!selectedGroupId}
                  />
                </div>
              </div>

              {#if selectedGroupId}
                <p class="text-xs text-emerald-600">Contacts will be added to selected group.</p>
              {:else if newGroupName}
                <p class="text-xs text-emerald-600">
                  New group "{newGroupName}" will be created.
                </p>
              {/if}
            </div>
          </div>

          <!-- Step: Importing -->
        {:else if step === 'importing'}
          <div class="flex flex-col items-center justify-center py-12">
            <svg
              class="w-16 h-16 text-emerald-500 animate-spin mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            <p class="text-lg font-medium text-gray-700">Importing contacts...</p>
            <p class="text-sm text-gray-500 mt-1">Please wait while we process your file</p>
          </div>

          <!-- Step: Results -->
        {:else if step === 'results' && importResults}
          <div class="space-y-4">
            <!-- Summary Grid -->
            <div class="grid grid-cols-3 gap-3">
              <div class="p-4 bg-emerald-50 rounded-lg text-center">
                <p class="text-2xl font-bold text-emerald-600">{importResults.created_count}</p>
                <p class="text-xs text-emerald-700">Created</p>
              </div>
              <div class="p-4 bg-amber-50 rounded-lg text-center">
                <p class="text-2xl font-bold text-amber-600">{importResults.skipped_count}</p>
                <p class="text-xs text-amber-700">Skipped</p>
              </div>
              <div class="p-4 bg-red-50 rounded-lg text-center">
                <p class="text-2xl font-bold text-red-600">{importResults.error_count}</p>
                <p class="text-xs text-red-700">Errors</p>
              </div>
            </div>

            <!-- Group Info -->
            {#if importResults.group_name}
              <div
                class="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-sm"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Contacts assigned to group: <strong>{importResults.group_name}</strong></span>
              </div>
            {/if}

            <!-- Status Message -->
            {#if importResults.success}
              <div class="flex items-center space-x-2 p-4 bg-emerald-100 rounded-lg">
                <svg
                  class="w-6 h-6 text-emerald-600"
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
                <p class="text-sm text-emerald-800">Import completed successfully!</p>
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
                <p class="text-sm text-amber-800">Import completed with some issues</p>
              </div>
            {/if}

            <!-- Error Details -->
            {#if importResults.errors.length > 0}
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Errors</h4>
                <div class="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                  {#each importResults.errors as err}
                    <div class="flex items-start space-x-2 text-sm">
                      <span class="text-red-500 font-medium whitespace-nowrap">Row {err.row}:</span>
                      <span class="text-gray-600">{err.error}</span>
                    </div>
                  {/each}
                </div>
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
          {#if step === 'configure' || step === 'results'}
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              on:click={goBack}
              disabled={isImporting}
            >
              ← {step === 'results' ? 'Import Another' : 'Back'}
            </button>
          {/if}
        </div>

        <div class="flex space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300
                   rounded-lg hover:bg-gray-50 transition-colors"
            on:click={handleClose}
            disabled={isImporting}
          >
            {step === 'results' ? 'Done' : 'Cancel'}
          </button>

          {#if step === 'configure'}
            <button
              type="button"
              class="px-6 py-2 text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600
                     rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all
                     shadow-md hover:shadow-lg disabled:opacity-50"
              on:click={handleImport}
              disabled={isImporting}
            >
              Import Contacts
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
