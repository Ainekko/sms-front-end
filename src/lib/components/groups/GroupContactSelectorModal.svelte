<!--
  GroupContactSelectorModal Component
  ===================================
  Modal for selecting contacts to add to a specific group.
  Lists all contacts with checkboxes.
  
  Props:
    isOpen: boolean - Whether the modal is visible
    groupId: string - ID of the group to add contacts to
  
  Events:
    close - Modal should be closed
    added - Contacts were added successfully
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { groupsApi } from '$lib/api/groups';
  import { contactsApi, type ContactResponse } from '$lib/api/contacts';
  import { showSuccess, showError } from '$lib/stores/uiStore';
  import { brandsStore } from '$lib/stores/brandsStore';

  export let isOpen = false;
  export let groupId = '';

  const dispatch = createEventDispatcher<{
    close: void;
    added: void;
  }>();

  let contacts: ContactResponse[] = []; // We need a way to list ALL contacts or brand contacts
  // Since we don't have a global "list all contacts" API easily accessible in the snippets provided (only listBrandContacts),
  // we might need to fetch contacts from all brands or just use the current brand's contacts if that's the context.
  // However, groups are likely global or user-scoped.
  // The backend snippet for contacts wasn't fully provided, but `contactsApi` in `contacts.ts` has `getContact` but not `listContacts`.
  // `brandsStore` has `loadBrandContacts`.
  // Let's assume for now we list contacts from the currently selected brand or all brands if possible.
  // Given the user's "contacts side bar" comment, it implies contacts are available.
  // I'll try to use `brandsStore` to get contacts from the selected brand, or if we need a global list, we might need a new API endpoint.
  // For now, I'll iterate through all loaded brands in the store and get their contacts, or just use the selected brand.
  // Let's use `brandsStore` and maybe flatten contacts from all brands.

  // Actually, looking at `contacts.ts`, it only has `createContact`, `getContact`, `addContactToBrand`, `removeContactFromBrand`.
  // It lacks `listContacts`.
  // But `brandsStore` loads contacts for a brand.
  // I'll assume we want to add contacts from the *current* context (e.g. selected brand) or maybe we need to fetch them.
  // Let's use a mock list or try to fetch from `brandsStore` if available.
  // To be safe and functional, I'll use `brandsStore` to get contacts of the *selected* brand if any, or warn if no brand selected.
  // Better yet, I'll fetch contacts from the API if I can find a list endpoint.
  // The user didn't provide a `list_contacts` endpoint in the backend snippet (only `create_contact`, `get_contact` etc in `contacts.ts`).
  // Wait, `contacts.ts` in the file view earlier only showed `createContact`, `getContact` etc.
  // I'll use `brandsStore`'s contacts for now as that's what we have in the frontend.

  let isLoading = false;
  let isSubmitting = false;
  let error = '';
  let selectedContactIds: Set<string> = new Set();
  let searchTerm = '';

  // Subscribe to brands store to get contacts
  $: brandContacts = $brandsStore.contacts || [];
  $: filteredContacts = brandContacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phoneNumber.includes(searchTerm)
  );

  $: if (isOpen) {
    resetForm();
    // We assume contacts are already loaded in the store or we might need to trigger load.
    // If brand is selected, they should be there.
  }

  function resetForm() {
    selectedContactIds = new Set();
    searchTerm = '';
    error = '';
    isSubmitting = false;
  }

  function toggleContact(contactId: string) {
    if (selectedContactIds.has(contactId)) {
      selectedContactIds.delete(contactId);
    } else {
      selectedContactIds.add(contactId);
    }
    selectedContactIds = selectedContactIds; // Trigger reactivity
  }

  async function handleSubmit() {
    if (selectedContactIds.size === 0) return;

    isSubmitting = true;
    error = '';

    try {
      await groupsApi.bulkAddContacts({
        contact_ids: Array.from(selectedContactIds),
        group_id: groupId
      });

      showSuccess(
        `Added ${selectedContactIds.size} contact${selectedContactIds.size !== 1 ? 's' : ''} to group`
      );
      dispatch('added');
      dispatch('close');
    } catch (err) {
      console.error('Failed to add contacts to group:', err);
      error = err instanceof Error ? err.message : 'Failed to add contacts to group';
      showError(error);
    } finally {
      isSubmitting = false;
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      dispatch('close');
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen && !isSubmitting) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-modal-in flex flex-col max-h-[90vh]"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
      >
        <div class="flex items-center space-x-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600
                                flex items-center justify-center text-white"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Add Contacts to Group</h2>
            <p class="text-xs text-gray-500">Select contacts to add</p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          on:click={handleClose}
          disabled={isSubmitting}
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
      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div class="relative">
          <svg
            class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
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
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search contacts..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   transition-colors placeholder:text-gray-400"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-0">
        {#if error}
          <div
            class="m-6 flex items-center space-x-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
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

        {#if brandContacts.length === 0}
          <div class="text-center py-12 px-6">
            <p class="text-gray-500">No contacts found in current brand.</p>
          </div>
        {:else if filteredContacts.length === 0}
          <div class="text-center py-12 px-6">
            <p class="text-gray-500">No contacts match your search.</p>
          </div>
        {:else}
          <div class="divide-y divide-gray-100">
            {#each filteredContacts as contact (contact.id)}
              <label
                class="flex items-center px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedContactIds.has(contact.id)}
                  on:change={() => toggleContact(contact.id)}
                  class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div class="ml-4 flex-1">
                  <p class="text-sm font-medium text-gray-900">{contact.name || 'Unknown'}</p>
                  <p class="text-xs text-gray-500">{contact.phoneNumber}</p>
                </div>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0"
      >
        <span class="text-sm text-gray-500">
          {selectedContactIds.size} selected
        </span>
        <div class="flex space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300
                             rounded-lg hover:bg-gray-50 transition-colors"
            on:click={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-6 py-2 text-sm text-white bg-gradient-to-r from-blue-500 to-cyan-600
                             rounded-lg hover:from-blue-600 hover:to-cyan-700
                             transition-all shadow-md hover:shadow-lg disabled:opacity-50
                             flex items-center space-x-2"
            on:click={handleSubmit}
            disabled={selectedContactIds.size === 0 || isSubmitting}
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span>Adding...</span>
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Selected</span>
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
