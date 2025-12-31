<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    conversationsStore,
    selectedConversationId,
    selectConversation,
    loadConversations,
    type ConversationSummary
  } from '../stores/conversationsStore';
  import { archiveContact, unarchiveContact } from '$lib/api/contacts';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Brand ID to filter conversations (from URL) */
  export let brandId: string | null = null;

  /** Optional: Override conversations list (for Campaigns mode) */
  export let customConversations: any[] | null = null;

  /** Mode: 'default' (Brand/Global) or 'campaign' */
  export let mode: 'default' | 'campaign' = 'default';

  /** Optional: Loading state (for Campaigns mode) */
  export let isLoading: boolean = false;

  // ==========================================================================
  // Internal State
  // ==========================================================================

  let activeFolder: 'all' | 'unread' | 'archived' = 'all';
  let searchQuery = '';
  const dispatch = createEventDispatcher();

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  // Use custom conversations if provided, otherwise use store
  $: rawConversations = customConversations ?? $conversationsStore.conversations;
  $: effectiveLoading = mode === 'campaign' ? isLoading : $conversationsStore.isLoading;
  $: error = mode === 'campaign' ? null : $conversationsStore.error;
  $: selectedId = $selectedConversationId;

  $: {
    if (mode === 'campaign') {
      console.log('ConversationList [Campaign Mode] Raw:', rawConversations);
      console.log('ConversationList [Campaign Mode] Loading:', effectiveLoading);
    }
  }

  // Filter conversations based on active folder
  $: filteredConversations = (() => {
    const uniqueMap = new Map();

    // Deduplicate based on ID or Phone Number
    rawConversations.forEach((c: any) => {
      const key = c.id || c.phoneNumber || c.phone_number;
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      }
    });

    const uniqueConversations = Array.from(uniqueMap.values());

    if (mode === 'campaign') {
      console.log('Unique Conversations:', uniqueConversations);
    }

    return uniqueConversations.filter((c: any) => {
      // In campaign mode, we might have different field names or need to adapt
      // Default to false if undefined, as campaign conversations might not have this field populated yet
      const isArchived = c.contact?.is_archived || c.isArchived || false;

      // Folder filtering
      if (activeFolder === 'archived' && !isArchived) return false;
      if (activeFolder !== 'archived' && isArchived) return false;

      if (activeFolder === 'unread') {
        const direction = c.lastMessageDirection || c.last_message_direction;
        const count = c.unreadCount || c.unread_count || 0;
        if (count === 0 && direction !== 'inbound') return false;
      }

      // Search filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = getDisplayName(c).toLowerCase();
        const phone = (c.phoneNumber || c.phone_number || '').toLowerCase();
        const message = getMessagePreview(c).toLowerCase();

        if (!name.includes(query) && !phone.includes(query) && !message.includes(query)) {
          return false;
        }
      }

      return true;
    });
  })();

  // ==========================================================================
  // Reactive Loading (Default Mode Only)
  // ==========================================================================

  let lastLoadedBrandId: string | null | undefined;

  $: if (mode === 'default' && brandId !== lastLoadedBrandId) {
    lastLoadedBrandId = brandId;
    loadConversations(brandId ?? undefined);
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

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

  function formatTime(dateInput: Date | string): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function getDisplayName(conversation: any): string {
    // Handle both camelCase (Store) and snake_case (API)
    const name = conversation.contactName || conversation.contact_name;
    const phone = conversation.phoneNumber || conversation.phone_number;
    return name || formatPhoneNumber(phone);
  }

  function getMessagePreview(conversation: any): string {
    const rawText =
      conversation.lastMessage || conversation.last_message_body || conversation.last_message;

    let text = '';
    if (typeof rawText === 'object' && rawText !== null) {
      text =
        rawText.body ||
        rawText.text ||
        rawText.content ||
        rawText.message ||
        JSON.stringify(rawText);
    } else {
      text = rawText ? String(rawText) : '';
    }

    if (text.length <= 50) return text;
    return text.substring(0, 50).trim() + '...';
  }

  function getDirection(conversation: any): string {
    return conversation.lastMessageDirection || conversation.last_message_direction || '';
  }

  function getUnreadCount(conversation: any): number {
    return conversation.unreadCount || conversation.unread_count || 0;
  }

  function getContactId(conversation: any): string {
    return conversation.contactId || conversation.contact_id;
  }

  function getIsArchived(conversation: any): boolean {
    return conversation.contact?.is_archived || conversation.isArchived;
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  function handleSelectConversation(conversation: any): void {
    const phone = conversation.phoneNumber || conversation.phone_number;
    const id = conversation.id || phone; // Use ID if available, else phone

    if (mode === 'default') {
      selectConversation(phone);
    } else {
      dispatch('select', id);
    }
  }

  function handleRetry(): void {
    if (mode === 'default') loadConversations();
    else dispatch('retry');
  }

  async function handleArchive(conversation: any, e: Event) {
    e.stopPropagation();
    const contactId = getContactId(conversation);
    const isArchived = getIsArchived(conversation);

    if (!contactId) return;

    try {
      if (isArchived) {
        await unarchiveContact(contactId);
        showSuccess('Contact unarchived');
      } else {
        await archiveContact(contactId);
        showSuccess('Contact archived');
      }
      dispatch('refresh'); // Notify parent to reload data
      if (mode === 'default') loadConversations(brandId ?? undefined);
    } catch (err) {
      showError('Failed to update archive status');
    }
  }
</script>

<div class="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden w-full">
  <!-- Header -->
  <div class="p-4 border-b border-gray-100">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold text-gray-800">Messages</h2>

      <!-- Refresh/Retry -->
      <button
        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        on:click={handleRetry}
        title="Refresh conversations"
      >
        <svg
          class="w-5 h-5 {effectiveLoading ? 'animate-spin' : ''}"
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

    <!-- Search -->
    <div class="mb-3 relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search messages..."
        class="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm transition-all outline-none"
      />
      <svg
        class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
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

    <!-- Folders -->
    <div class="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-3">
      {#each ['all', 'unread', 'archived'] as folder}
        <button
          class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all capitalize {activeFolder ===
          folder
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => (activeFolder = folder)}
        >
          {folder}
        </button>
      {/each}
    </div>

    <!-- New Message Button (Only in Default Mode) -->
    {#if mode === 'default'}
      <button
        class="w-full flex items-center justify-center space-x-2 px-4 py-2.5
                    text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600
                    rounded-lg hover:from-green-600 hover:to-emerald-700
                    transition-all shadow-sm hover:shadow-md"
        on:click={() => dispatch('newMessage')}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>New Message</span>
      </button>
    {/if}
  </div>

  <!-- Content Area -->
  <div class="flex-1 overflow-y-auto">
    <!-- Loading State -->
    {#if effectiveLoading && rawConversations.length === 0}
      <div class="flex items-center justify-center h-32">
        <div class="flex flex-col items-center space-y-2">
          <svg class="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-sm text-gray-500">Loading...</span>
        </div>
      </div>

      <!-- Error State -->
    {:else if error}
      <div class="flex items-center justify-center h-32 p-4">
        <div class="text-center">
          <p class="text-sm text-red-500 mb-2">{error}</p>
          <button
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            on:click={handleRetry}>Try Again</button
          >
        </div>
      </div>

      <!-- Empty State -->
    {:else if filteredConversations.length === 0}
      <div class="flex items-center justify-center h-32 p-4">
        <div class="text-center">
          <p class="text-sm text-gray-500">No conversations in {activeFolder}</p>
        </div>
      </div>

      <!-- Conversation List -->
    {:else}
      {#each filteredConversations as conversation (conversation.id || conversation.phoneNumber || conversation.phone_number)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50 cursor-pointer group relative
                    {selectedId === (conversation.phoneNumber || conversation.id)
            ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-500'
            : 'border-l-4 border-l-transparent'}"
          on:click={() => handleSelectConversation(conversation)}
        >
          <div class="flex items-start space-x-3">
            <!-- Avatar -->
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0"
            >
              {(conversation.phoneNumber || conversation.phone_number || '?')
                .replace(/\D/g, '')
                .slice(-2, -1)}
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline">
                <h3 class="text-sm font-semibold text-gray-900 truncate">
                  {getDisplayName(conversation)}
                </h3>
                <span class="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTime(conversation.lastMessageAt || conversation.last_message_at)}
                </span>
              </div>

              <div class="flex items-center justify-between mt-1">
                <p
                  class="text-sm truncate {getUnreadCount(conversation) > 0
                    ? 'font-medium text-gray-900'
                    : 'text-gray-600'}"
                >
                  {#if getDirection(conversation) === 'outbound'}
                    <span class="text-gray-400">You: </span>
                  {/if}
                  {getMessagePreview(conversation)}
                </p>

                <div class="flex items-center space-x-2">
                  {#if getUnreadCount(conversation) > 0}
                    <span
                      class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-blue-500 rounded-full flex-shrink-0"
                    >
                      {getUnreadCount(conversation) > 99 ? '99+' : getUnreadCount(conversation)}
                    </span>
                  {/if}

                  <!-- Archive Button (Visible on hover or if archived) -->
                  <button
                    class="text-gray-300 hover:text-gray-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity {getIsArchived(
                      conversation
                    )
                      ? 'opacity-100 text-yellow-500'
                      : ''}"
                    on:click={(e) => handleArchive(conversation, e)}
                    title={getIsArchived(conversation) ? 'Unarchive' : 'Archive'}
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
