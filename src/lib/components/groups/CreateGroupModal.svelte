<!--
  CreateGroupModal Component
  ==========================
  Modal for creating a new contact group.
  
  Props:
    isOpen: boolean - Whether the modal is visible
  
  Events:
    close - Modal should be closed
    created - Group was created successfully
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { groupsApi, type ContactGroup } from '$lib/api/groups';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    close: void;
    created: { group: ContactGroup };
  }>();

  let name = '';
  let description = '';
  let isSubmitting = false;
  let error = '';

  $: canSubmit = name.trim().length > 0;

  $: if (isOpen) {
    resetForm();
  }

  function resetForm() {
    name = '';
    description = '';
    error = '';
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    isSubmitting = true;
    error = '';

    try {
      const group = await groupsApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined
      });

      showSuccess('Group created successfully');
      dispatch('created', { group });
      dispatch('close');
    } catch (err) {
      console.error('Failed to create group:', err);
      error = err instanceof Error ? err.message : 'Failed to create group';
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
            class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                flex items-center justify-center text-white"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800">Create New Group</h2>
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

        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">
            Group Name <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="e.g. VIP Customers"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               transition-colors placeholder:text-gray-400"
            disabled={isSubmitting}
            autofocus
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span class="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="description"
            bind:value={description}
            placeholder="What is this group for?"
            rows="3"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none text-gray-900
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               transition-colors placeholder:text-gray-400"
            disabled={isSubmitting}
          ></textarea>
        </div>
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
          class="px-6 py-2 text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600
                           rounded-lg hover:from-blue-600 hover:to-indigo-700
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
            <span>Creating...</span>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Create Group</span>
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
