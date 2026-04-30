<script lang="ts">
  /**
   * Messages Page (Brand-Scoped)
   * =============================
   * Main messaging page under /b/[brandId]/messages.
   * Initializes WebSocket, loads conversations, renders chat UI.
   * Brand context comes from the parent layout via URL params.
   */
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Components
  import ConversationList from '$lib/components/ConversationList.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import BulkMessageModal from '$lib/components/BulkMessageModal.svelte';
  import ContactsPanel from '$lib/components/ContactsPanel.svelte';
  import NewConversationModal from '$lib/components/NewConversationModal.svelte';

  // AI Components
  import DNCListPanel from '$lib/components/ai/DNCListPanel.svelte';
  import HotLeadsPanel from '$lib/components/ai/HotLeadsPanel.svelte';

  // Services and stores
  import { webSocketService } from '$lib/services/websocket';
  import { loadConversations, selectConversation } from '$lib/stores/conversationsStore';
  import { brandsStore, loadBrands, selectedBrand, type Brand } from '$lib/stores/brandsStore';
  import { connectionStore } from '$lib/stores/connectionStore';

  // ==========================================================================
  // Brand ID from URL params (set by parent layout)
  // ==========================================================================
  $: brandId = $page.params.brandId;

  // ==========================================================================
  // Modal/Panel State
  // ==========================================================================

  /** Whether bulk message modal is open */
  let showBulkMessage = false;

  /** Whether contacts panel is open */
  let showContacts = false;

  /** Whether new conversation modal is open */
  let showNewConversation = false;

  /** Pre-filled phone number for new conversation */
  let newConversationPhone = '';

  /** Pre-filled contact name for new conversation */
  let newConversationName: string | null = null;

  /** Active conversation folder filter */
  let conversationFilter: 'all' | 'unread' | 'hot' | 'dnc' | 'archived' = 'all';

  /** Whether DNC panel is open */
  let showDNCPanel = false;

  /** Whether Hot Leads panel is open */
  let showHotLeadsPanel = false;

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  function handleMessageSent(event: CustomEvent<{ phoneNumber: string }>): void {
    selectConversation(event.detail.phoneNumber);
    showNewConversation = false;
    newConversationPhone = '';
    newConversationName = null;
  }

  function handleContactSendMessage(
    event: CustomEvent<{ phoneNumber: string; contactName: string | null }>
  ): void {
    newConversationPhone = event.detail.phoneNumber;
    newConversationName = event.detail.contactName;
    showNewConversation = true;
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  onMount(async () => {
    console.log('[MessagesPage] Mounting...');

    // Ensure brands are loaded (layout may have already done this)
    if ($brandsStore.brands.length === 0) {
      try {
        await loadBrands();
        console.log('[MessagesPage] Brands loaded');
      } catch (error) {
        console.error('[MessagesPage] Failed to load brands:', error);
      }
    }

    // Connect to WebSocket for real-time updates
    try {
      await webSocketService.connect();
      console.log('[MessagesPage] WebSocket connected');
    } catch (error) {
      console.error('[MessagesPage] Failed to connect WebSocket:', error);
    }
  });

  onDestroy(() => {
    console.log('[MessagesPage] Unmounting, disconnecting WebSocket...');
    webSocketService.disconnect();
  });
</script>

<!-- Page Layout -->
<div class="messages-shell">
  <!-- Action Bar -->
  <div class="action-bar">
    <div class="action-bar-left">
      <h2 class="action-bar-title">Messages</h2>
    </div>
    <div class="action-bar-actions">
      <!-- Bulk Send -->
      <button class="action-btn action-btn-primary" on:click={() => (showBulkMessage = true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Bulk Send
      </button>

      <!-- Contacts -->
      <button class="action-btn" on:click={() => (showContacts = true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Contacts
      </button>

      <div class="action-divider"></div>

      <!-- Hot Leads -->
      <button class="action-btn action-btn-warm" on:click={() => { conversationFilter = 'hot'; showHotLeadsPanel = true; }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
        </svg>
        Leads
      </button>

      <!-- DNC -->
      <button class="action-btn" on:click={() => { conversationFilter = 'dnc'; showDNCPanel = true; }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        DNC
      </button>
    </div>
  </div>

  <!-- Chat Area -->
  <div class="chat-area">
    <aside class="conversation-sidebar">
      <ConversationList
        {brandId}
        bind:activeFolder={conversationFilter}
        on:newMessage={() => {
          newConversationPhone = '';
          newConversationName = null;
          showNewConversation = true;
        }}
      />
    </aside>
    <main class="chat-main">
      <ChatWindow />
    </main>
  </div>
</div>

<!-- Modals & Panels -->

<BulkMessageModal isOpen={showBulkMessage} on:close={() => (showBulkMessage = false)} />

<ContactsPanel
  isOpen={showContacts}
  on:close={() => (showContacts = false)}
  on:sendMessage={handleContactSendMessage}
/>

<NewConversationModal
  isOpen={showNewConversation}
  initialPhone={newConversationPhone}
  initialContactName={newConversationName}
  on:close={() => (showNewConversation = false)}
  on:sent={handleMessageSent}
/>

<DNCListPanel
  isOpen={showDNCPanel}
  on:close={() => (showDNCPanel = false)}
  on:viewContact={() => { showDNCPanel = false; conversationFilter = 'dnc'; }}
/>

<HotLeadsPanel
  isOpen={showHotLeadsPanel}
  on:close={() => (showHotLeadsPanel = false)}
  on:viewContact={() => { showHotLeadsPanel = false; conversationFilter = 'hot'; }}
  on:sendMessage={(e) => {
    selectConversation(e.detail.phoneNumber);
    showHotLeadsPanel = false;
    if (conversationFilter !== 'hot' && conversationFilter !== 'all') {
      conversationFilter = 'all';
    }
  }}
/>

<style>
  .messages-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: #09090b;
  }

  /* Action Bar */
  .action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    background: #111113;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .action-bar-title {
    font-size: 16px;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0;
  }
  .action-bar-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #a1a1aa;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .action-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.15);
    color: #e4e4e7;
  }

  .action-btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: transparent;
    color: white;
  }
  .action-btn-primary:hover {
    opacity: 0.9;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    border-color: transparent;
  }

  .action-btn-warm {
    color: #fbbf24;
    border-color: rgba(251,191,36,0.2);
    background: rgba(251,191,36,0.08);
  }
  .action-btn-warm:hover {
    background: rgba(251,191,36,0.15);
  }

  .action-divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.08);
    margin: 0 4px;
  }

  /* Chat Area */
  .chat-area {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .conversation-sidebar {
    width: 320px;
    flex-shrink: 0;
    height: 100%;
    display: flex;
  }

  .chat-main {
    flex: 1;
    height: 100%;
    position: relative;
  }

  @media (max-width: 768px) {
    .conversation-sidebar {
      display: none;
    }
  }

  :global(body) {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>
