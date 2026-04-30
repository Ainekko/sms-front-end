<!--
  ChatWindow Component
  =====================
  Displays the messages for the currently selected conversation.
  
  This component:
  - Shows all messages in the selected conversation
  - Displays message bubbles with direction-based styling
  - Shows message status indicators (sent, delivered, etc.)
  - Handles sending new messages via the input
  - Auto-scrolls to the latest message
  - Shows loading state while fetching messages
  
  Props: None
  
  Events: None (uses stores directly)
  
  Usage:
    <ChatWindow />
-->

<script lang="ts">
  import { afterUpdate, onMount } from 'svelte';

  // Import stores and actions
  import { messagesStore, loadMessages, sendMessage, type Message } from '../stores/messagesStore';
  import { selectedConversationId, selectedConversation } from '../stores/conversationsStore';
  import { selectedBrand } from '../stores/brandsStore';
  import { showError, showSuccess } from '../stores/uiStore';
  import { config } from '../config';

  // Import sub-components
  import MessageInput from './MessageInput.svelte';

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** Reference to the chat container for scrolling */
  let chatContainer: HTMLElement;

  /** Whether we should scroll on next update */
  let shouldScrollToBottom = true;

  /** Lightbox state for viewing images full-size */
  let lightboxOpen = false;
  let lightboxUrl = '';

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  // Subscribe to stores
  $: messages = $messagesStore.messages;
  $: isLoading = $messagesStore.isLoading;
  $: isSending = $messagesStore.isSending;
  $: error = $messagesStore.error;
  $: currentPhoneNumber = $messagesStore.currentPhoneNumber;
  $: selectedId = $selectedConversationId;
  $: conversation = $selectedConversation;

  // Load messages when selected conversation changes
  $: if (selectedId && selectedId !== currentPhoneNumber) {
    loadMessages(selectedId, $selectedBrand?.id);
    shouldScrollToBottom = true;
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Scroll to bottom after DOM updates (new messages).
   */
  afterUpdate(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
    }
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Scroll the chat container to the bottom.
   */
  function scrollToBottom(): void {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  /**
   * Format a timestamp for display in message bubbles.
   *
   * @param date - Date to format
   * @returns Formatted time string
   */
  function formatMessageTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format a phone number for display.
   *
   * @param phone - Phone number in E.164 format
   * @returns Formatted phone number string
   */
  function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/^\+/, '');

    if (digits.length === 11 && digits.startsWith('1')) {
      const area = digits.slice(1, 4);
      const prefix = digits.slice(4, 7);
      const line = digits.slice(7);
      return `(${area}) ${prefix}-${line}`;
    }

    if (digits.length === 10) {
      const area = digits.slice(0, 3);
      const prefix = digits.slice(3, 6);
      const line = digits.slice(6);
      return `(${area}) ${prefix}-${line}`;
    }

    return phone;
  }

  /**
   * Get the CSS class for message status indicator.
   *
   * @param status - Message status
   * @returns CSS class string
   */
  function getStatusClass(status: string): string {
    switch (status) {
      case 'delivered':
        return 'text-green-500';
      case 'sent':
        return 'text-blue-400';
      case 'failed':
      case 'undelivered':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  }

  /**
   * Get the status icon for a message.
   *
   * @param status - Message status
   * @returns Status indicator text/icon
   */
  function getStatusIndicator(status: string): string {
    switch (status) {
      case 'delivered':
        return '✓✓';
      case 'sent':
        return '✓';
      case 'queued':
      case 'sending':
        return '◷';
      case 'failed':
      case 'undelivered':
        return '✗';
      default:
        return '';
    }
  }

  /**
   * Handle sending a new message.
   * Called when user submits from the message input.
   *
   * @param event - Custom event with message text
   */
  async function handleSendMessage(event: CustomEvent<{ text: string }>): Promise<void> {
    const { text } = event.detail;

    if (!selectedId) {
      showError('No conversation selected');
      return;
    }

    try {
      await sendMessage(selectedId, text, $selectedBrand?.id);
      shouldScrollToBottom = true;
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error toast is shown by the store
    }
  }

  /**
   * Retry loading messages after an error.
   */
  function handleRetry(): void {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }

  /**
   * Build full media URL from the relative API path.
   * The backend returns paths like /api/v1/messages/{id}/media/{index}
   * We need to prefix with the backend base URL.
   */
  function getMediaUrl(url: string): string {
    // If already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Prefix with backend base URL
    return `${config.apiBaseUrl}${url}`;
  }

  /**
   * Open the lightbox with a specific image URL.
   */
  function openLightbox(url: string): void {
    lightboxUrl = getMediaUrl(url);
    lightboxOpen = true;
  }

  /**
   * Close the lightbox.
   */
  function closeLightbox(): void {
    lightboxOpen = false;
    lightboxUrl = '';
  }
</script>

<!-- Chat Window Container -->
<div class="flex flex-col h-full bg-[#09090b]">
  <!-- If a conversation is selected -->
  {#if selectedId}
    <!-- Chat Header -->
    <div class="flex items-center justify-between px-6 py-4 bg-[#111113] border-b border-white/[0.06]">
      <div class="flex items-center space-x-3">
        <!-- Avatar -->
        <div
          class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500
                    flex items-center justify-center text-white font-semibold"
        >
          {selectedId.replace(/\D/g, '').slice(-2, -1) || '?'}
        </div>

        <!-- Phone Number / Contact Name -->
        <div>
          <h3 class="font-semibold text-zinc-100">
            {conversation?.contactName || formatPhoneNumber(selectedId)}
          </h3>
          {#if conversation}
            <p class="text-xs text-zinc-500">
              {conversation.messageCount} messages
              {#if conversation.contactName}
                • {formatPhoneNumber(selectedId)}
              {/if}
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4" bind:this={chatContainer}>
      <!-- Loading State -->
      {#if isLoading && messages.length === 0}
        <div class="flex items-center justify-center h-full">
          <div class="flex flex-col items-center space-y-2">
            <svg class="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              >
              </path>
            </svg>
            <span class="text-sm text-zinc-500">Loading messages...</span>
          </div>
        </div>

        <!-- Error State -->
      {:else if error}
        <div class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg
              class="w-12 h-12 text-red-400 mx-auto mb-2"
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
            <p class="text-sm text-zinc-400 mb-2">{error}</p>
            <button
              class="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
              on:click={handleRetry}
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- Empty Messages -->
      {:else if messages.length === 0}
        <div class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg
              class="w-12 h-12 text-zinc-600 mx-auto mb-2"
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
            <p class="text-sm text-zinc-500">No messages yet</p>
            <p class="text-xs text-zinc-600 mt-1">Send a message to start the conversation</p>
          </div>
        </div>

        <!-- Message List -->
      {:else}
        <!-- Conversation starter indicator -->
        <div class="flex justify-center mb-4">
          <span class="text-xs text-zinc-500 bg-white/[0.05] px-3 py-1 rounded-full">
            Conversation with {formatPhoneNumber(selectedId)}
          </span>
        </div>

        <!-- Messages -->
        {#each messages as message (message.id)}
          <div class="flex {message.direction === 'outbound' ? 'justify-end' : 'justify-start'}">
            <div
              class="max-w-[70%] {message.direction === 'outbound'
                ? 'bg-indigo-600 text-white rounded-l-2xl rounded-tr-2xl'
                : 'bg-[#1a1a1f] text-zinc-200 border border-white/[0.06] rounded-r-2xl rounded-tl-2xl'} 
                                px-4 py-3 shadow-sm"
            >
              <!-- MMS Media Attachments -->
              {#if message.media && message.media.length > 0}
                <div class="mb-2 space-y-2">
                  {#each message.media as attachment}
                    {#if attachment.contentType.startsWith('image/')}
                      <!-- Image attachment - click to open lightbox -->
                      <button
                        type="button"
                        class="block w-full text-left"
                        on:click={() => openLightbox(attachment.url)}
                      >
                        <img
                          src={getMediaUrl(attachment.url)}
                          alt="MMS attachment"
                          class="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style="max-height: 300px; object-fit: contain;"
                          loading="lazy"
                        />
                      </button>
                    {:else if attachment.contentType.startsWith('video/')}
                      <!-- Video attachment -->
                      <video
                        src={getMediaUrl(attachment.url)}
                        controls
                        class="max-w-full rounded-lg"
                        style="max-height: 300px;"
                        preload="metadata"
                      >
                        <track kind="captions" src="" label="No captions available" />
                        Your browser does not support the video tag.
                      </video>
                    {:else}
                      <!-- Other file types -->
                      <a
                        href={getMediaUrl(attachment.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center gap-2 p-2 rounded-lg {message.direction ===
                        'outbound'
                          ? 'bg-indigo-500'
                          : 'bg-white/[0.06]'} hover:opacity-80"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span class="text-sm">Attachment</span>
                      </a>
                    {/if}
                  {/each}
                </div>
              {/if}

              <!-- Message Body -->
              {#if message.body}
                <p class="text-sm whitespace-pre-wrap break-words">{message.body}</p>
              {/if}

              <!-- Timestamp and Status -->
              <div class="flex items-center justify-end space-x-1 mt-1">
                <span class="text-[10px] opacity-70">
                  {formatMessageTime(message.createdAt)}
                </span>

                <!-- Status indicator for outbound messages -->
                {#if message.direction === 'outbound'}
                  <span class="text-[10px] {getStatusClass(message.status)}" title={message.status}>
                    {getStatusIndicator(message.status)}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        <!-- Sending indicator -->
        {#if isSending}
          <div class="flex justify-end">
            <div class="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-sm">Sending...</div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Message Input -->
    <MessageInput on:send={handleSendMessage} disabled={isSending} />

    <!-- No conversation selected -->
  {:else}
    <div class="flex-1 flex items-center justify-center text-zinc-500">
      <div class="text-center">
        <svg
          class="w-16 h-16 mx-auto mb-4 text-zinc-700"
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
        <p class="text-lg font-medium text-zinc-400">Select a conversation</p>
        <p class="text-sm text-zinc-600 mt-1">
          Choose a conversation from the list to start messaging
        </p>
      </div>
    </div>
  {/if}
</div>

<!-- Image Lightbox Modal -->
{#if lightboxOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    role="dialog"
    aria-modal="true"
    on:click={closeLightbox}
    on:keydown={(e) => e.key === 'Escape' && closeLightbox()}
  >
    <!-- Close button -->
    <button
      type="button"
      class="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      on:click={closeLightbox}
      aria-label="Close image"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Full-size image -->
    <img
      src={lightboxUrl}
      alt="Full size image"
      class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      on:click|stopPropagation
    />
  </div>
{/if}
