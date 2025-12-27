<!--
  SendToGroupModal Component
  ==========================
  Modal for sending a message to all contacts in a group.
  
  Props:
    isOpen: boolean - Whether the modal is visible
    groupId: string - ID of the group to send to
    groupName: string - Name of the group (for display)
  
  Events:
    close - Modal should be closed
    sent - Message was sent successfully
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { bulkApi, type GroupSendRequest, type BulkSendResponse } from '$lib/api/bulk';
  import { brandsStore, type Brand } from '$lib/stores/brandsStore';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  export let isOpen = false;
  export let groupId = '';
  export let groupName = '';

  const dispatch = createEventDispatcher<{
    close: void;
    sent: { response: BulkSendResponse };
  }>();

  let brands: Brand[] = [];
  let selectedBrandId = '';
  let message = '';
  let isSubmitting = false;
  let error = '';

  $: brands = $brandsStore.brands.filter((b) => b.isActive);
  $: canSubmit = selectedBrandId && message.trim().length > 0;

  $: if (isOpen) {
    resetForm();
  }

  function resetForm() {
    selectedBrandId = brands.length > 0 ? brands[0].id : '';
    message = '';
    error = '';
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    isSubmitting = true;
    error = '';

    try {
      const request: GroupSendRequest = {
        group_id: groupId,
        from_brand_id: selectedBrandId,
        message: message.trim()
      };

      const response = await bulkApi.sendToGroup(request);

      if (response.success) {
        showSuccess(
          `Message sent to ${response.total_sent} contact${response.total_sent !== 1 ? 's' : ''}`
        );
      } else {
        showSuccess(`Sent: ${response.total_sent}, Failed: ${response.total_failed}`);
      }

      dispatch('sent', { response });
      dispatch('close');
    } catch (err) {
      console.error('Failed to send to group:', err);
      error = err instanceof Error ? err.message : 'Failed to send message';
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
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-modal-in"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600
                            flex items-center justify-center text-white"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Send to Group</h2>
            <p class="text-xs text-gray-500">{groupName}</p>
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

        <!-- From Brand -->
        <div>
          <label for="from-brand" class="block text-sm font-medium text-gray-700 mb-1.5">
            Send From <span class="text-red-500">*</span>
          </label>
          {#if brands.length === 0}
            <div class="text-sm text-gray-500 py-2">No active brands available.</div>
          {:else}
            <select
              id="from-brand"
              bind:value={selectedBrandId}
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                     focus:ring-2 focus:ring-green-500 focus:border-green-500
                     transition-colors bg-white"
              disabled={isSubmitting}
            >
              {#each brands as brand}
                <option value={brand.id}>{brand.name} ({brand.phoneNumber})</option>
              {/each}
            </select>
          {/if}
        </div>

        <!-- Message -->
        <div>
          <label for="message" class="block text-sm font-medium text-gray-700 mb-1.5">
            Message <span class="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            bind:value={message}
            placeholder="Type your message here..."
            rows="4"
            maxlength="1600"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900
                   focus:ring-2 focus:ring-green-500 focus:border-green-500
                   transition-colors placeholder:text-gray-400 resize-none"
            disabled={isSubmitting}
          ></textarea>
          <p class="text-xs text-gray-400 mt-1 text-right">{message.length}/1600</p>
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
          class="px-6 py-2 text-sm text-white bg-gradient-to-r from-green-500 to-emerald-600
                           rounded-lg hover:from-green-600 hover:to-emerald-700
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
            <span>Sending...</span>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>Send Message</span>
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
