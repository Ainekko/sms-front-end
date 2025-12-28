<!--
  ConversationList Component
  ===========================
  Displays the list of SMS conversations in the sidebar.
  
  This component:
  - Shows all conversations with phone numbers
  - Displays last message preview and timestamp
  - Highlights selected conversation
  - Shows unread message count
  - Handles conversation selection
  
  Props: None
  
  Events: None (uses stores directly)
  
  Usage:
    <ConversationList />
-->

<script lang="ts">
  import { onMount } from 'svelte';

  // Import stores and actions
  import {
    conversationsStore,
    selectedConversationId,
    selectConversation,
    loadConversations,
    type ConversationSummary
  } from '../stores/conversationsStore';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Brand ID to filter conversations (from URL) */
  export let brandId: string | null = null;

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  // Subscribe to the conversations store
  $: conversations = $conversationsStore.conversations;
  $: isLoading = $conversationsStore.isLoading;
  $: error = $conversationsStore.error;
  $: selectedId = $selectedConversationId;

  // ==========================================================================
  // Reactive Loading - reload when brandId changes
  // ==========================================================================

  // Track the last loaded brandId to prevent duplicate loads
  let lastLoadedBrandId: string | null | undefined;

  $: if (brandId !== lastLoadedBrandId) {
    lastLoadedBrandId = brandId;
    loadConversations(brandId ?? undefined);
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Load conversations when component mounts.
   */
  onMount(() => {
    // Initial load handled by reactive statement above
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Format a phone number for display.
   * Adds formatting like (123) 456-7890 for US numbers.
   *
   * @param phone - Phone number in E.164 format
   * @returns Formatted phone number string
   */
  function formatPhoneNumber(phone: string): string {
    // Remove the + prefix if present
    const digits = phone.replace(/^\+/, '');

    // Format US numbers (11 digits starting with 1)
    if (digits.length === 11 && digits.startsWith('1')) {
      const area = digits.slice(1, 4);
      const prefix = digits.slice(4, 7);
      const line = digits.slice(7);
      return `(${area}) ${prefix}-${line}`;
    }

    // Format 10-digit numbers
    if (digits.length === 10) {
      const area = digits.slice(0, 3);
      const prefix = digits.slice(3, 6);
      const line = digits.slice(6);
      return `(${area}) ${prefix}-${line}`;
    }

    // Return as-is for other formats
    return phone;
  }

  /**
   * Format a timestamp for display.
   * Shows time if today, otherwise shows date.
   *
   * @param date - Date to format
   * @returns Formatted time/date string
   */
  function formatTime(date: Date): string {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      // Show time for today's messages
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Show date for older messages
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Truncate a message preview if too long.
   *
   * @param text - Message text (can be null/undefined)
   * @param maxLength - Maximum characters to show
   * @returns Truncated text with ellipsis if needed
   */
  function truncateMessage(text: string | null | undefined, maxLength: number = 50): string {
    // Handle null, undefined, or non-string values
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Handle clicking on a conversation.
   * Selects the conversation and marks it as read.
   *
   * @param phoneNumber - Phone number of the conversation
   */
  function handleSelectConversation(phoneNumber: string): void {
    selectConversation(phoneNumber);
  }

  /**
   * Retry loading conversations after an error.
   */
  function handleRetry(): void {
    loadConversations();
  }

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    newMessage: void;
  }>();
</script>

<!-- Conversations Sidebar Container -->
<div class="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden w-80">
  <!-- Header -->
  <div class="p-4 border-b border-gray-100">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold text-gray-800">Messages</h2>

      <!-- Refresh button -->
      <button
        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        on:click={handleRetry}
        title="Refresh conversations"
      >
        <svg
          class="w-5 h-5 {isLoading ? 'animate-spin' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>

    <!-- New Message Button -->
    <button
      class="w-full flex items-center justify-center space-x-2 px-4 py-2.5
                   text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600
                   rounded-lg hover:from-green-600 hover:to-emerald-700
                   transition-all shadow-sm hover:shadow-md"
      on:click={() => dispatch('newMessage')}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span>New Message</span>
    </button>
  </div>

  <!-- Content Area -->
  <div class="flex-1 overflow-y-auto">
    <!-- Loading State -->
    {#if isLoading && conversations.length === 0}
      <div class="flex items-center justify-center h-32">
        <div class="flex flex-col items-center space-y-2">
          <svg class="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            >
            </path>
          </svg>
          <span class="text-sm text-gray-500">Loading conversations...</span>
        </div>
      </div>

      <!-- Error State -->
    {:else if error}
      <div class="flex items-center justify-center h-32 p-4">
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
          <p class="text-sm text-gray-600 mb-2">{error}</p>
          <button
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            on:click={handleRetry}
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
    {:else if conversations.length === 0}
      <div class="flex items-center justify-center h-32 p-4">
        <div class="text-center">
          <svg
            class="w-12 h-12 text-gray-300 mx-auto mb-2"
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
          <p class="text-sm text-gray-500">No conversations yet</p>
        </div>
      </div>

      <!-- Conversation List -->
    {:else}
      {#each conversations as conversation (conversation.phoneNumber)}
        <button
          class="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50
                    {selectedId === conversation.phoneNumber
            ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-500'
            : 'border-l-4 border-l-transparent'}"
          on:click={() => handleSelectConversation(conversation.phoneNumber)}
        >
          <div class="flex items-start space-x-3">
            <!-- Avatar (using first digit of phone) -->
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500
                            flex items-center justify-center text-white font-semibold flex-shrink-0"
            >
              {conversation.phoneNumber.replace(/\D/g, '').slice(-2, -1) || '?'}
            </div>

            <!-- Conversation Details -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline">
                <!-- Phone Number -->
                <h3 class="text-sm font-semibold text-gray-900 truncate">
                  {formatPhoneNumber(conversation.phoneNumber)}
                </h3>
                <!-- Timestamp -->
                <span class="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTime(conversation.lastMessageAt)}
                </span>
              </div>

              <!-- Last Message Preview -->
              <div class="flex items-center justify-between mt-1">
                <p
                  class="text-sm truncate
                                    {conversation.unreadCount > 0
                    ? 'font-medium text-gray-900'
                    : 'text-gray-600'}"
                >
                  <!-- Direction indicator -->
                  {#if conversation.lastMessageDirection === 'outbound'}
                    <span class="text-gray-400">You: </span>
                  {/if}
                  {truncateMessage(conversation.lastMessage || '')}
                </p>

                <!-- Unread Count Badge -->
                {#if conversation.unreadCount > 0}
                  <span
                    class="ml-2 inline-flex items-center justify-center
                                        min-w-[20px] h-5 px-1.5 text-xs font-bold text-white
                                        bg-blue-500 rounded-full flex-shrink-0"
                  >
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>
