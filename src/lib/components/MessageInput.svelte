<!--
  MessageInput Component
  =======================
  Input field and send button for composing and sending messages.
  
  This component:
  - Provides a textarea for message composition
  - Handles Enter key to send (Shift+Enter for new line)
  - Shows sending state with disabled button
  - Emits 'send' event with message text
  
  Props:
  - disabled: boolean - Whether input is disabled (e.g., while sending)
  
  Events:
  - send: { text: string } - Emitted when user sends a message
  
  Usage:
    <MessageInput 
      on:send={handleSend} 
      disabled={isSending} 
    />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Whether the input is disabled (e.g., while sending a message) */
  export let disabled: boolean = false;

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** The current message text in the textarea */
  let messageText = '';

  /** Reference to the textarea element for focus management */
  let textareaElement: HTMLTextAreaElement;

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  /**
   * Event dispatcher for component events.
   * Dispatches:
   * - 'send': When user submits a message
   */
  const dispatch = createEventDispatcher<{
    send: { text: string };
  }>();

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handle the send button click or Enter key press.
   * Validates message content and dispatches the send event.
   */
  function handleSend(): void {
    // Don't send if disabled or empty
    if (disabled) return;

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) return;

    // Dispatch the send event with the message text
    dispatch('send', { text: trimmedMessage });

    // Clear the input
    messageText = '';

    // Re-focus the textarea for convenience
    if (textareaElement) {
      textareaElement.focus();
    }
  }

  /**
   * Handle keyboard events in the textarea.
   * Enter sends the message, Shift+Enter adds a new line.
   *
   * @param event - Keyboard event from textarea
   */
  function handleKeydown(event: KeyboardEvent): void {
    // Enter without Shift sends the message
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  /** Whether the send button should be disabled */
  $: isButtonDisabled = disabled || !messageText.trim();
</script>

<!-- Input Container -->
<div class="p-4 bg-[#111113] border-t border-white/[0.06]">
  <div class="flex items-end space-x-2">
    <!-- Message Textarea -->
    <textarea
      bind:this={textareaElement}
      bind:value={messageText}
      on:keydown={handleKeydown}
      class="flex-1 p-3 font-normal text-base text-zinc-200 bg-white/[0.04] border border-white/[0.08] rounded-full
                focus:border-indigo-500/50 focus:bg-white/[0.06]
                resize-none
                disabled:bg-white/[0.02] disabled:text-zinc-600 disabled:cursor-not-allowed
                transition-colors outline-none placeholder-zinc-600"
      rows="1"
      placeholder={disabled ? 'Sending...' : 'Type a message...'}
      {disabled}
    ></textarea>

    <!-- Send Button -->
    <button
      class="px-4 py-3 bg-indigo-600 text-white rounded-full
                hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#111113]
                font-medium transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600
                flex items-center justify-center min-w-[80px]"
      on:click={handleSend}
      disabled={isButtonDisabled}
    >
      {#if disabled}
        <!-- Loading spinner when sending -->
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          >
          </path>
        </svg>
      {:else}
        <!-- Send text when ready -->
        Send
      {/if}
    </button>
  </div>

  <!-- Character count hint (optional, for long messages) -->
  {#if messageText.length > 140}
    <div class="mt-1 text-right">
      <span class="text-xs {messageText.length > 160 ? 'text-yellow-500' : 'text-zinc-600'}">
        {messageText.length} characters
        {#if messageText.length > 160}
          (may be split into multiple SMS)
        {/if}
      </span>
    </div>
  {/if}
</div>
