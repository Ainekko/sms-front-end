<!--
  AddToGroupModal Component
  =========================
  Modal for adding contacts to a group.
  Allows selecting an existing group or creating a new one.
  
  Props:
    isOpen: boolean - Whether the modal is visible
    contactIds: string[] - IDs of contacts to add
  
  Events:
    close - Modal should be closed
    added - Contacts were added successfully
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { groupsApi, type ContactGroup } from '$lib/api/groups';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  export let isOpen = false;
  export let contactIds: string[] = [];

  const dispatch = createEventDispatcher<{
    close: void;
    added: { group: ContactGroup };
  }>();

  let groups: ContactGroup[] = [];
  let isLoadingGroups = false;
  let isSubmitting = false;
  let error = '';

  // Form State
  let selectedGroupId = '';
  let newGroupName = '';
  let mode: 'existing' | 'new' = 'existing';

  $: canSubmit =
    (mode === 'existing' && selectedGroupId) || (mode === 'new' && newGroupName.trim().length > 0);

  $: if (isOpen) {
    resetForm();
    loadGroups();
  }

  function resetForm() {
    selectedGroupId = '';
    newGroupName = '';
    mode = 'existing';
    error = '';
    isSubmitting = false;
  }

  async function loadGroups() {
    isLoadingGroups = true;
    try {
      groups = await groupsApi.listGroups();
    } catch (err) {
      console.error('Failed to load groups:', err);
      // Don't show error to user immediately, just log it
    } finally {
      isLoadingGroups = false;
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    isSubmitting = true;
    error = '';

    try {
      const result = await groupsApi.bulkAddContacts({
        contact_ids: contactIds,
        group_id: mode === 'existing' ? selectedGroupId : undefined,
        group_name: mode === 'new' ? newGroupName.trim() : undefined
      });

      showSuccess(
        `Added ${contactIds.length} contact${contactIds.length !== 1 ? 's' : ''} to group`
      );
      dispatch('added', { group: result });
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
      class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-modal-in"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600
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
            <h2 class="text-xl font-bold text-gray-800">Add to Group</h2>
            <p class="text-xs text-gray-500">
              {contactIds.length} contact{contactIds.length !== 1 ? 's' : ''} selected
            </p>
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

      <!-- Content -->
      <div class="p-6 space-y-5">
        {#if error}
          <div
            class="flex items-center space-x-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
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

        <!-- Mode Selection -->
        <div class="flex p-1 bg-gray-100 rounded-xl">
          <button
            class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all
                   {mode === 'existing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'}"
            on:click={() => (mode = 'existing')}
          >
            Existing Group
          </button>
          <button
            class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all
                   {mode === 'new'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'}"
            on:click={() => (mode = 'new')}
          >
            New Group
          </button>
        </div>

        {#if mode === 'existing'}
          <!-- Existing Group Select -->
          <div>
            <label for="group-select" class="block text-sm font-medium text-gray-700 mb-1.5">
              Select Group <span class="text-red-500">*</span>
            </label>
            {#if isLoadingGroups}
              <div class="flex items-center space-x-2 text-sm text-gray-500 py-2">
                <div
                  class="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"
                ></div>
                <span>Loading groups...</span>
              </div>
            {:else if groups.length === 0}
              <div class="text-sm text-gray-500 py-2">
                No groups found. <button
                  class="text-blue-600 hover:underline"
                  on:click={() => (mode = 'new')}>Create a new one</button
                >.
              </div>
            {:else}
              <select
                id="group-select"
                bind:value={selectedGroupId}
                class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                       focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                       transition-colors bg-white"
                disabled={isSubmitting}
              >
                <option value="" disabled selected>Choose a group...</option>
                {#each groups as group}
                  <option value={group.id}>{group.name} ({group.contact_count})</option>
                {/each}
              </select>
            {/if}
          </div>
        {:else}
          <!-- New Group Input -->
          <div>
            <label for="new-group-name" class="block text-sm font-medium text-gray-700 mb-1.5">
              Group Name <span class="text-red-500">*</span>
            </label>
            <input
              id="new-group-name"
              type="text"
              bind:value={newGroupName}
              placeholder="e.g. VIP Customers"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     transition-colors placeholder:text-gray-400"
              disabled={isSubmitting}
              autofocus
            />
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl"
      >
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
          class="px-6 py-2 text-sm text-white bg-gradient-to-r from-purple-500 to-pink-600
                           rounded-lg hover:from-purple-600 hover:to-pink-700
                           transition-all shadow-md hover:shadow-lg disabled:opacity-50
                           flex items-center space-x-2"
          on:click={handleSubmit}
          disabled={!canSubmit || isSubmitting}
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
            <span>Add to Group</span>
          {/if}
        </button>
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
