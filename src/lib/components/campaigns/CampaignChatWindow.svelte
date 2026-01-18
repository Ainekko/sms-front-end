<!--
  CampaignChatWindow Component
  =============================
  Adapted from ChatWindow.svelte for use in Campaign Detail view.
-->

<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { messagesStore, loadMessages, sendMessage } from '../../stores/messagesStore';
  import { showError } from '../../stores/uiStore';
  import { config } from '../../config';
  import MessageInput from '../MessageInput.svelte';

  export let conversationId: string | null = null;
  export let contactName: string | null = null;
  export let brandId: string | null = null;

  let chatContainer: HTMLElement;
  let shouldScrollToBottom = true;

  /** Lightbox state for viewing images full-size */
  let lightboxOpen = false;
  let lightboxUrl = '';

  $: messages = $messagesStore.messages;
  $: isLoading = $messagesStore.isLoading;
  $: isSending = $messagesStore.isSending;
  $: error = $messagesStore.error;

  // Load messages when conversationId changes
  $: if (conversationId) {
    loadMessages(conversationId, brandId || undefined);
    shouldScrollToBottom = true;
  }

  afterUpdate(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
    }
  });

  function scrollToBottom(): void {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  function formatMessageTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatPhoneNumber(phone: string): string {
    if (!phone) return 'Unknown';
    const digits = phone.replace(/^\+/, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

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

  async function handleSendMessage(event: CustomEvent<{ text: string }>): Promise<void> {
    const { text } = event.detail;
    if (!conversationId) return;

    try {
      await sendMessage(conversationId, text, brandId || undefined);
      shouldScrollToBottom = true;
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  function handleRetry(): void {
    if (conversationId) {
      loadMessages(conversationId, brandId || undefined);
    }
  }

  /**
   * Build full media URL from the relative API path.
   */
  function getMediaUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${config.apiBaseUrl}${url}`;
  }

  function openLightbox(url: string): void {
    lightboxUrl = getMediaUrl(url);
    lightboxOpen = true;
  }

  function closeLightbox(): void {
    lightboxOpen = false;
    lightboxUrl = '';
  }
</script>

<div class="flex flex-col h-full bg-gray-50 border-l border-gray-200">
  {#if conversationId}
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div class="flex items-center space-x-3">
        <div
          class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm"
        >
          {conversationId.replace(/\D/g, '').slice(-2, -1) || '?'}
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 text-sm">
            {contactName || formatPhoneNumber(conversationId)}
          </h3>
          <p class="text-xs text-gray-500">{formatPhoneNumber(conversationId)}</p>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3" bind:this={chatContainer}>
      {#if isLoading && messages.length === 0}
        <div class="flex items-center justify-center h-full">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      {:else if error}
        <div class="flex flex-col items-center justify-center h-full text-center">
          <p class="text-sm text-red-500 mb-2">{error}</p>
          <button class="text-xs text-blue-600 hover:underline" on:click={handleRetry}
            >Try Again</button
          >
        </div>
      {:else if messages.length === 0}
        <div class="flex items-center justify-center h-full text-gray-400 text-sm">
          No messages yet
        </div>
      {:else}
        {#each messages as message (message.id)}
          <div class="flex {message.direction === 'outbound' ? 'justify-end' : 'justify-start'}">
            <div
              class="max-w-[85%] {message.direction === 'outbound'
                ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl'
                : 'bg-white text-gray-800 border border-gray-200 rounded-r-2xl rounded-tl-2xl'} px-3 py-2 shadow-sm"
            >
              <!-- MMS Media Attachments -->
              {#if message.media && message.media.length > 0}
                <div class="mb-2 space-y-2">
                  {#each message.media as attachment}
                    {#if attachment.contentType.startsWith('image/')}
                      <!-- Image attachment -->
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block"
                      >
                        <img
                          src={attachment.url}
                          alt="MMS attachment"
                          class="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style="max-height: 200px; object-fit: contain;"
                          loading="lazy"
                        />
                      </a>
                    {:else if attachment.contentType.startsWith('video/')}
                      <!-- Video attachment -->
                      <video
                        src={attachment.url}
                        controls
                        class="max-w-full rounded-lg"
                        style="max-height: 200px;"
                        preload="metadata"
                      >
                        <track kind="captions" src="" label="No captions available" />
                        Your browser does not support the video tag.
                      </video>
                    {:else}
                      <!-- Other file types -->
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center gap-2 p-2 rounded-lg {message.direction ===
                        'outbound'
                          ? 'bg-blue-500'
                          : 'bg-gray-100'} hover:opacity-80"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span class="text-xs">Attachment</span>
                      </a>
                    {/if}
                  {/each}
                </div>
              {/if}

              <!-- Message Body -->
              {#if message.body}
                <p class="text-sm whitespace-pre-wrap break-words">{message.body}</p>
              {/if}

              <div class="flex items-center justify-end space-x-1 mt-1">
                <span class="text-[10px] opacity-70">{formatMessageTime(message.createdAt)}</span>
                {#if message.direction === 'outbound'}
                  <span class="text-[10px] {getStatusClass(message.status)}"
                    >{getStatusIndicator(message.status)}</span
                  >
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Input -->
    <div class="p-3 bg-white border-t border-gray-200">
      <MessageInput on:send={handleSendMessage} disabled={isSending} />
    </div>
  {:else}
    <div class="flex-1 flex items-center justify-center text-gray-400">
      <p>Select a conversation to view messages</p>
    </div>
  {/if}
</div>
