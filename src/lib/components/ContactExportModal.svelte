<!--
  ContactExportModal Component
  ============================
  Modal for exporting contacts as CSV with toggle switches.
  Modern zinc-based design matching AI panels.
  Uses has_replied field from backend for no-reply filtering.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { brandsApi, type BrandContactResponse } from '../api/brands';
  import { downloadCsv } from '../utils/csv';
  import { showSuccess, showError } from '../stores/uiStore';

  // ==========================================================================
  // Props
  // ==========================================================================

  export let isOpen = false;
  export let brandId: string | null = null;

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  const dispatch = createEventDispatcher<{ close: void }>();

  // ==========================================================================
  // Filter State - Simple boolean toggles
  // ==========================================================================

  let includeRegular = true;
  let includeDNC = false;
  let includeHotLeads = true;
  let includeNoReply = true;

  // ==========================================================================
  // Data State
  // ==========================================================================

  let contacts: BrandContactResponse[] = [];
  let isLoading = false;

  // ==========================================================================
  // Reactive Loading
  // ==========================================================================

  $: if (isOpen && brandId) {
    loadContacts();
  }

  // Categorize contacts using has_replied from backend
  $: dncContacts = contacts.filter((c) => c.ai_do_not_contact === true);
  $: hotLeadContacts = contacts.filter((c) => c.ai_priority === 3 && c.ai_do_not_contact !== true);
  $: noReplyContacts = contacts.filter(
    (c) => c.ai_do_not_contact !== true && c.ai_priority !== 3 && !c.has_replied
  );
  $: repliedContacts = contacts.filter(
    (c) => c.ai_do_not_contact !== true && c.ai_priority !== 3 && c.has_replied
  );

  // Apply filters based on toggles
  $: filteredContacts = [
    ...(includeRegular ? repliedContacts : []),
    ...(includeDNC ? dncContacts : []),
    ...(includeHotLeads ? hotLeadContacts : []),
    ...(includeNoReply ? noReplyContacts : [])
  ];

  // ==========================================================================
  // Functions
  // ==========================================================================

  async function loadContacts(): Promise<void> {
    if (!brandId) return;

    isLoading = true;
    try {
      contacts = await brandsApi.getBrandContacts(brandId);
    } catch (err) {
      console.error('Failed to load contacts for export:', err);
      showError('Failed to load contacts');
      contacts = [];
    } finally {
      isLoading = false;
    }
  }

  function generateCSV(data: BrandContactResponse[]): string {
    const headers = ['Name', 'Phone Number', 'Address', 'AI Priority', 'DNC', 'Created At'];
    const rows = data.map((c) => {
      return [
        escapeCsvField(c.name || ''),
        escapeCsvField(c.phone_number),
        escapeCsvField(c.address || ''),
        c.ai_priority?.toString() || '',
        c.ai_do_not_contact ? 'Yes' : 'No',
        escapeCsvField(c.created_at)
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  function escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async function handleExport(): Promise<void> {
    if (filteredContacts.length === 0) {
      showError('No contacts to export');
      return;
    }

    try {
      const csv = generateCSV(filteredContacts);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `contacts_export_${timestamp}.csv`;

      downloadCsv(csv, filename);
      showSuccess(`Exported ${filteredContacts.length} contacts`);
      handleClose();
    } catch (err) {
      console.error('Failed to export contacts:', err);
      showError('Failed to export contacts');
    }
  }

  function handleClose(): void {
    includeRegular = true;
    includeDNC = false;
    includeHotLeads = true;
    includeNoReply = true;
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isOpen) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
    transition:fade={{ duration: 150 }}
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="button"
    tabindex="-1"
  ></div>

  <!-- Modal -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="button"
    tabindex="-1"
  >
    <div
      class="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-800"
      transition:scale={{ duration: 150, start: 0.95 }}
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="p-5 border-b border-zinc-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700"
            >
              <svg
                class="w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-semibold text-zinc-100">Export Contacts</h2>
              <p class="text-xs text-zinc-500">{contacts.length} total</p>
            </div>
          </div>
          <button
            class="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            on:click={handleClose}
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
      </div>

      <!-- Content -->
      <div class="p-5">
        {#if isLoading}
          <div class="flex flex-col items-center justify-center h-40">
            <div class="relative w-10 h-10">
              <div class="absolute inset-0 rounded-full border-2 border-zinc-700"></div>
              <div
                class="absolute inset-0 rounded-full border-2 border-t-zinc-400 animate-spin"
              ></div>
            </div>
            <p class="text-sm text-zinc-500 mt-4">Loading contacts...</p>
          </div>
        {:else}
          <!-- Toggle Switches -->
          <div class="space-y-2">
            <!-- Replied (Regular) Contacts -->
            <div
              class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div>
                  <span class="text-sm font-medium text-zinc-200">Replied</span>
                  <span class="text-xs text-zinc-500 ml-2">{repliedContacts.length}</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeRegular}
                class="relative w-11 h-6 rounded-full transition-colors {includeRegular
                  ? 'bg-emerald-500'
                  : 'bg-zinc-700'}"
                on:click={() => (includeRegular = !includeRegular)}
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform {includeRegular
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
                ></span>
              </button>
            </div>

            <!-- No Reply Contacts -->
            <div
              class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-orange-400"
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
                  <span class="text-sm font-medium text-zinc-200">No Reply</span>
                  <span class="text-xs text-zinc-500 ml-2">{noReplyContacts.length}</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeNoReply}
                class="relative w-11 h-6 rounded-full transition-colors {includeNoReply
                  ? 'bg-orange-500'
                  : 'bg-zinc-700'}"
                on:click={() => (includeNoReply = !includeNoReply)}
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform {includeNoReply
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
                ></span>
              </button>
            </div>

            <!-- Hot Leads -->
            <div
              class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                    />
                  </svg>
                </div>
                <div>
                  <span class="text-sm font-medium text-zinc-200">Hot Leads</span>
                  <span class="text-xs text-zinc-500 ml-2">{hotLeadContacts.length}</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeHotLeads}
                class="relative w-11 h-6 rounded-full transition-colors {includeHotLeads
                  ? 'bg-amber-500'
                  : 'bg-zinc-700'}"
                on:click={() => (includeHotLeads = !includeHotLeads)}
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform {includeHotLeads
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
                ></span>
              </button>
            </div>

            <!-- DNC Contacts -->
            <div
              class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-red-400"
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
                </div>
                <div>
                  <span class="text-sm font-medium text-zinc-200">DNC</span>
                  <span class="text-xs text-zinc-500 ml-2">{dncContacts.length}</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeDNC}
                class="relative w-11 h-6 rounded-full transition-colors {includeDNC
                  ? 'bg-red-500'
                  : 'bg-zinc-700'}"
                on:click={() => (includeDNC = !includeDNC)}
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform {includeDNC
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
                ></span>
              </button>
            </div>
          </div>

          <!-- Export Count -->
          <div class="mt-5 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-400">To export</span>
              <span class="text-2xl font-bold text-zinc-100">{filteredContacts.length}</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-zinc-800 flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          on:click={handleClose}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          on:click={handleExport}
          disabled={isLoading || filteredContacts.length === 0}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download CSV
        </button>
      </div>
    </div>
  </div>
{/if}
