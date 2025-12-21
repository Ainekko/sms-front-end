<!--
  NewConversationModal Component
  ===============================
  Modal for starting a new SMS conversation.
  
  This component:
  - Phone number input with validation
  - Message composition
  - Shows which brand will be used
  - Sends message and opens conversation
  
  Props:
    isOpen: boolean - Whether the modal is visible
  
  Events:
    close - Modal should be closed
    sent - Message was sent successfully (includes phone number)
  
  Usage:
    <NewConversationModal 
      isOpen={showNewConvo} 
      on:close={() => showNewConvo = false}
      on:sent={(e) => selectConversation(e.detail.phoneNumber)}
    />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Import stores
  import { selectedBrand } from '../stores/brandsStore';
  import { messagesApi } from '../api/messages';
  import { showSuccess, showError } from '../stores/uiStore';
  import { loadConversations } from '../stores/conversationsStore';

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
    sent: { phoneNumber: string };
  }>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** Phone number input */
  let phoneNumber = '';

  /** Message content */
  let message = '';

  /** Sending state */
  let isSending = false;

  /** Error message */
  let error = '';

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  $: currentBrand = $selectedBrand;
  $: canSend = phoneNumber.trim().length > 0 && message.trim().length > 0;

  // Reset when modal opens
  $: if (isOpen) {
    resetForm();
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Reset form to initial state.
   */
  function resetForm(): void {
    phoneNumber = '';
    message = '';
    error = '';
  }

  /**
   * Format phone number as user types.
   */
  function handlePhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Add + if missing and starts with number
    if (value && !value.startsWith('+') && /^\d/.test(value)) {
      value = '+' + value;
      phoneNumber = value;
    }
  }

  /**
   * Validate phone number format.
   */
  function isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s-()]/g, '');
    return /^\+[1-9]\d{6,14}$/.test(cleaned);
  }

  /**
   * Handle sending the message.
   */
  async function handleSend(): Promise<void> {
    if (!canSend) return;

    error = '';

    // Clean phone number
    const cleanedPhone = phoneNumber.replace(/[\s-()]/g, '');

    if (!isValidPhone(cleanedPhone)) {
      error = 'Please enter a valid phone number (e.g., +1234567890)';
      return;
    }

    isSending = true;

    try {
      await messagesApi.sendMessage(cleanedPhone, message.trim(), currentBrand?.id);

      showSuccess('Message sent successfully');

      // Reload conversations to show the new one
      await loadConversations();

      // Emit event with phone number so parent can select the conversation
      dispatch('sent', { phoneNumber: cleanedPhone });
      dispatch('close');
    } catch (err) {
      console.error('Failed to send message:', err);
      error = err instanceof Error ? err.message : 'Failed to send message';
      showError(error);
    } finally {
      isSending = false;
    }
  }

  /**
   * Handle modal close.
   */
  function handleClose(): void {
    if (!isSending) {
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
    if (event.key === 'Escape' && isOpen && !isSending) {
      handleClose();
    }
  }

  /**
   * Format phone for display.
   */
  function formatPhone(phone: string): string {
    const digits = phone.replace(/^\+/, '');

    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone;
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
      class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-modal-in"
      on:click|stopPropagation
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800">New Conversation</h2>
        </div>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          on:click={handleClose}
          disabled={isSending}
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
        <!-- Error Message -->
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

        <!-- Brand Indicator -->
        {#if currentBrand}
          <div class="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
            <div
              class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                                    flex items-center justify-center text-white text-xs font-bold"
            >
              {currentBrand.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="text-xs text-gray-500">Sending from</p>
              <p class="text-sm font-medium text-gray-800">{currentBrand.name}</p>
            </div>
            <div class="ml-auto text-right">
              <p class="text-xs text-gray-400">Phone</p>
              <p class="text-sm font-mono text-gray-600">{formatPhone(currentBrand.phoneNumber)}</p>
            </div>
          </div>
        {:else}
          <div class="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-sm text-amber-700">No brand selected. Please select a brand first.</p>
          </div>
        {/if}

        <!-- Phone Number -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1.5">
            To <span class="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            bind:value={phoneNumber}
            on:input={handlePhoneInput}
            placeholder="+1234567890"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-green-500 focus:border-green-500
                               transition-colors placeholder:text-gray-400 font-mono"
            disabled={isSending}
          />
          <p class="mt-1 text-xs text-gray-500">Enter phone number in E.164 format</p>
        </div>

        <!-- Message -->
        <div>
          <label for="message" class="block text-sm font-medium text-gray-700 mb-1.5">
            Message <span class="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            bind:value={message}
            placeholder="Type your message..."
            rows="4"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
                               focus:ring-2 focus:ring-green-500 focus:border-green-500
                               transition-colors placeholder:text-gray-400"
            disabled={isSending}
          ></textarea>
          <p class="mt-1 text-xs text-gray-500 text-right">
            {message.length} characters
          </p>
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
          disabled={isSending}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-6 py-2 text-sm text-white bg-gradient-to-r from-green-500 to-emerald-600
                           rounded-lg hover:from-green-600 hover:to-emerald-700
                           transition-all shadow-md hover:shadow-lg disabled:opacity-50
                           flex items-center space-x-2"
          on:click={handleSend}
          disabled={!canSend || isSending || !currentBrand}
        >
          {#if isSending}
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
