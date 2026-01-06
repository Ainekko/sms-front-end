<!--
  DNCListPanel Component
  =======================
  Slide-out panel displaying Do-Not-Contact flagged contacts.
  Modern zinc-based design with proper loading states.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import AIGradientCard from './AIGradientCard.svelte';
  import { dncContacts, loadDNCList, aiStore } from '$lib/stores/aiStore';
  import type { DNCContact } from '$lib/api/ai';
  import { selectedBrand } from '$lib/stores/brandsStore';

  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    close: void;
    viewContact: { contactId: string };
  }>();

  let searchQuery = '';

  // Get loading state from store
  $: isLoading = $aiStore.isLoadingDNC;

  // Load DNC list when panel opens
  $: if (isOpen) {
    loadData();
  }

  async function loadData() {
    await loadDNCList($selectedBrand?.id);
  }

  // Filter by search
  $: filteredContacts = $dncContacts.filter((c: DNCContact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.phone_number.includes(query) ||
      c.name?.toLowerCase().includes(query) ||
      c.reason?.toLowerCase().includes(query)
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

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  }

  function handleClose() {
    dispatch('close');
  }

  function handleViewContact(contactId: string) {
    dispatch('viewContact', { contactId });
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-zinc-100">Do Not Contact</h2>
            <p class="text-xs text-zinc-500">{$dncContacts.length} flagged</p>
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
              class="absolute inset-0 rounded-full border-2 border-t-zinc-400 animate-spin"
            ></div>
          </div>
          <p class="text-sm text-zinc-500 mt-4">Loading contacts...</p>
        </div>
      {:else if filteredContacts.length === 0}
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center h-48 text-zinc-500">
          <div class="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-sm font-medium text-zinc-400">No flagged contacts</p>
          <p class="text-xs text-zinc-600 mt-1">All clear</p>
        </div>
      {:else}
        <!-- Contact List -->
        <div class="space-y-2">
          {#each filteredContacts as contact (contact.id)}
            <button class="w-full text-left" on:click={() => handleViewContact(contact.id)}>
              <AIGradientCard
                variant="compact"
                shimmer={false}
                class="hover:border-zinc-600 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center flex-shrink-0 text-zinc-400 text-xs font-medium"
                  >
                    {(contact.name?.[0] || contact.phone_number.slice(-2)).toUpperCase()}
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between gap-2">
                      <h4 class="text-sm font-medium text-zinc-200 truncate">
                        {contact.name || formatPhone(contact.phone_number)}
                      </h4>
                      <span class="text-xs text-zinc-600 flex-shrink-0">
                        {formatDate(contact.ai_last_analyzed)}
                      </span>
                    </div>

                    {#if contact.name}
                      <p class="text-xs text-zinc-500 mt-0.5">
                        {formatPhone(contact.phone_number)}
                      </p>
                    {/if}

                    {#if contact.reason}
                      <p class="text-xs text-zinc-500 mt-2 line-clamp-2">
                        {contact.reason}
                      </p>
                    {/if}
                  </div>

                  <svg
                    class="w-4 h-4 text-zinc-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </AIGradientCard>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-zinc-800">
      <p class="text-xs text-zinc-600 text-center">AI-flagged based on conversation analysis</p>
    </div>
  </div>
{/if}
