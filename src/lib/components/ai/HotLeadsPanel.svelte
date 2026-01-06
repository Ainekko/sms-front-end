<!--
  HotLeadsPanel Component
  ========================
  Slide-out panel displaying high-priority leads.
  Modern zinc-based design with proper loading states.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import AIGradientCard from './AIGradientCard.svelte';
  import { hotLeads, loadHotLeads, aiStore } from '$lib/stores/aiStore';
  import type { HotLead } from '$lib/api/ai';
  import { selectedBrand } from '$lib/stores/brandsStore';

  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    close: void;
    viewContact: { contactId: string };
    sendMessage: { phoneNumber: string; contactName: string | null };
  }>();

  let searchQuery = '';

  // Get loading state from store
  $: isLoading = $aiStore.isLoadingHotLeads;

  // Load hot leads when panel opens
  $: if (isOpen) {
    loadData();
  }

  async function loadData() {
    await loadHotLeads($selectedBrand?.id);
  }

  // Filter by search
  $: filteredLeads = $hotLeads.filter((lead: HotLead) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.phone_number.includes(query) ||
      lead.name?.toLowerCase().includes(query) ||
      lead.interests.some((i) => i.toLowerCase().includes(query))
    );
  });

  function formatPhone(phone: string): string {
    if (!phone) return 'Unknown';
    const digits = phone.replace(/^\+/, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  }

  function handleClose() {
    dispatch('close');
  }

  function handleViewContact(contactId: string) {
    dispatch('viewContact', { contactId });
  }

  function handleSendMessage(lead: HotLead) {
    dispatch('sendMessage', {
      phoneNumber: lead.phone_number,
      contactName: lead.name
    });
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
    transition:fade={{ duration: 150 }}
    on:click={handleClose}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="button"
    tabindex="0"
  ></div>

  <!-- Panel -->
  <div
    class="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 shadow-2xl z-50 flex flex-col border-l border-zinc-800"
    transition:fly={{ x: 400, duration: 200, opacity: 1 }}
  >
    <!-- Header -->
    <div class="p-5 border-b border-zinc-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30"
          >
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-zinc-100">Hot Leads</h2>
            <p class="text-xs text-zinc-500">{$hotLeads.length} high priority</p>
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

      <!-- Search -->
      <div class="mt-4 relative">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search..."
          class="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all outline-none"
        />
        <svg
          class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      {#if isLoading}
        <!-- Loading State -->
        <div class="flex flex-col items-center justify-center h-48">
          <div class="relative w-10 h-10">
            <div class="absolute inset-0 rounded-full border-2 border-zinc-700"></div>
            <div
              class="absolute inset-0 rounded-full border-2 border-t-amber-400 animate-spin"
            ></div>
          </div>
          <p class="text-sm text-zinc-500 mt-4">Loading leads...</p>
        </div>
      {:else if filteredLeads.length === 0}
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center h-48 text-zinc-500">
          <div class="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p class="text-sm font-medium text-zinc-400">No hot leads yet</p>
          <p class="text-xs text-zinc-600 mt-1">Keep engaging</p>
        </div>
      {:else}
        <!-- Lead List -->
        <div class="space-y-2">
          {#each filteredLeads as lead (lead.id)}
            <AIGradientCard variant="compact" shimmer={true}>
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center flex-shrink-0 text-amber-300 text-xs font-medium border border-amber-500/20"
                >
                  {(lead.name?.[0] || lead.phone_number.slice(-2)).toUpperCase()}
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-zinc-200 truncate">
                    {lead.name || formatPhone(lead.phone_number)}
                  </h4>
                  {#if lead.name}
                    <p class="text-xs text-zinc-500">{formatPhone(lead.phone_number)}</p>
                  {/if}

                  <!-- Interests -->
                  {#if lead.interests.length > 0}
                    <div class="flex flex-wrap gap-1 mt-2">
                      {#each lead.interests.slice(0, 3) as interest}
                        <span
                          class="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700"
                        >
                          {interest}
                        </span>
                      {/each}
                    </div>
                  {/if}

                  <!-- Recommendation -->
                  {#if lead.recommendation}
                    <p class="text-xs text-zinc-500 mt-2 line-clamp-1">
                      {lead.recommendation}
                    </p>
                  {/if}

                  <!-- Actions -->
                  <div class="flex gap-2 mt-3">
                    <button
                      class="flex-1 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-xs font-medium rounded border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
                      on:click={() => handleSendMessage(lead)}
                    >
                      Message
                    </button>
                    <button
                      class="px-3 py-1.5 bg-zinc-800/50 text-zinc-400 text-xs font-medium rounded border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300 transition-all"
                      on:click={() => handleViewContact(lead.id)}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </AIGradientCard>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-zinc-800">
      <button
        class="w-full px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-all"
        on:click={loadData}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  </div>
{/if}
