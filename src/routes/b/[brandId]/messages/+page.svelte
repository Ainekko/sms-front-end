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
  import NewConversationModal from '$lib/components/NewConversationModal.svelte';

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

  /** Whether new conversation modal is open */
  let showNewConversation = false;

  /** Pre-filled phone number for new conversation */
  let newConversationPhone = '';

  /** Pre-filled contact name for new conversation */
  let newConversationName: string | null = null;

  /** Active conversation folder filter */
  let conversationFilter: 'all' | 'unread' | 'hot' | 'dnc' | 'archived' = 'all';

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  function handleMessageSent(event: CustomEvent<{ phoneNumber: string }>): void {
    selectConversation(event.detail.phoneNumber);
    showNewConversation = false;
    newConversationPhone = '';
    newConversationName = null;
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

<NewConversationModal
  isOpen={showNewConversation}
  initialPhone={newConversationPhone}
  initialContactName={newConversationName}
  on:close={() => (showNewConversation = false)}
  on:sent={handleMessageSent}
/>

<style>
  .messages-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: #09090b;
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
