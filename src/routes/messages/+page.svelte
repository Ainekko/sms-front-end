<!--
  Messages Page
  ==============
  Main page for the SMS messaging application.
  
  This page:
  - Initializes the WebSocket connection on mount
  - Loads initial conversations and brands from the API
  - Renders the conversation list and chat window
  - Manages modal states (brand manager, bulk message, contacts, new conversation)
  - Cleans up WebSocket connection on unmount
  
  Route: /messages
  
  Layout:
  - BrandHeader at top (with brand selector and action buttons)
  - ConversationList sidebar on left (hidden on mobile)
  - ChatWindow main area on right
  - Modals and panels overlay
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Import components
  import ConversationList from '$lib/components/ConversationList.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import BrandHeader from '$lib/components/BrandHeader.svelte';
  import BrandManager from '$lib/components/BrandManager.svelte';
  import BulkMessageModal from '$lib/components/BulkMessageModal.svelte';
  import ContactsPanel from '$lib/components/ContactsPanel.svelte';
  import NewConversationModal from '$lib/components/NewConversationModal.svelte';

  // Import services and stores
  import { webSocketService } from '$lib/services/websocket';
  import { loadConversations, selectConversation } from '$lib/stores/conversationsStore';
  import { brandsStore, loadBrands, selectedBrand, type Brand } from '$lib/stores/brandsStore';
  import { connectionStore } from '$lib/stores/connectionStore';
  import { authStore, isAuthenticated, isAuthInitialized, isAdmin, currentUser } from '$lib/stores';

  // ==========================================================================
  // Auth Guard
  // ==========================================================================

  // Redirect to login if not authenticated
  $: if ($isAuthInitialized && !$isAuthenticated) {
    goto('/login');
  }

  // ==========================================================================
  // URL-Based State
  // ==========================================================================

  /** Get brand ID from URL query param */
  $: brandId = $page.url.searchParams.get('brand');

  // Sync URL brand ID to store
  $: if (brandId) {
    brandsStore.setSelectedBrandId(brandId);
  }

  // If store has selected brand but URL doesn't, update URL
  $: if ($selectedBrand && !brandId) {
    const url = new URL($page.url);
    url.searchParams.set('brand', $selectedBrand.id);
    goto(url.toString(), { replaceState: true, keepFocus: true });
  }

  // ==========================================================================
  // Modal/Panel State
  // ==========================================================================

  // Modal/Panel State
  // ==========================================================================

  /** Whether brand manager modal is open */
  let showBrandManager = false;

  /** Brand to edit in manager (null for create) */
  let editBrand: Brand | null = null;

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

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Open brand manager in create mode.
   */
  function handleOpenBrandManager(): void {
    editBrand = null;
    showBrandManager = true;
  }

  /**
   * Handle brand manager close.
   */
  function handleCloseBrandManager(): void {
    showBrandManager = false;
    editBrand = null;
  }

  /**
   * Handle brand saved - just close the modal.
   */
  function handleBrandSaved(): void {
    handleCloseBrandManager();
  }

  /**
   * Handle new message sent - select the conversation.
   */
  function handleMessageSent(event: CustomEvent<{ phoneNumber: string }>): void {
    selectConversation(event.detail.phoneNumber);
    showNewConversation = false;
    // Reset pre-filled data
    newConversationPhone = '';
    newConversationName = null;
  }

  /**
   * Handle send message request from contacts panel.
   */
  function handleContactSendMessage(
    event: CustomEvent<{ phoneNumber: string; contactName: string | null }>
  ): void {
    newConversationPhone = event.detail.phoneNumber;
    newConversationName = event.detail.contactName;
    showNewConversation = true;
  }

  /**
   * Handle logout from user menu.
   */
  function handleLogout(): void {
    authStore.logout();
    goto('/login');
  }

  /**
   * Navigate to admin dashboard.
   */
  function handleNavigateAdmin(): void {
    goto('/admin');
  }

  /**
   * Navigate to groups page.
   */
  function handleNavigateGroups(): void {
    goto('/groups');
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Initialize the application on component mount.
   * - Connect to WebSocket for real-time updates
   * - Load initial brands and conversations from API
   */
  onMount(async () => {
    console.log('[MessagesPage] Mounting...');

    // Load brands first (needed for sending messages)
    try {
      await loadBrands();
      console.log('[MessagesPage] Brands loaded');
    } catch (error) {
      console.error('[MessagesPage] Failed to load brands:', error);
    }

    // Connect to WebSocket for real-time updates
    try {
      await webSocketService.connect();
      console.log('[MessagesPage] WebSocket connected');
    } catch (error) {
      console.error('[MessagesPage] Failed to connect WebSocket:', error);
      // The WebSocket service will handle reconnection attempts
    }

    // Conversations are loaded reactively by ConversationList based on brandId from URL
  });

  /**
   * Cleanup on component destroy.
   * - Disconnect WebSocket to prevent memory leaks
   */
  onDestroy(() => {
    console.log('[MessagesPage] Unmounting, disconnecting WebSocket...');
    webSocketService.disconnect();
  });
</script>

<!-- 
  Page Layout
  ===========
  Full-height flex container with:
  - Fixed header at top
  - Flex row for sidebar + main content
-->
<div class="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
  <!-- Application Header -->
  <BrandHeader
    selectedBrandId={brandId}
    on:openBrandManager={handleOpenBrandManager}
    on:openBulkMessage={() => (showBulkMessage = true)}
    on:openContacts={() => (showContacts = true)}
    on:logout={handleLogout}
    on:navigateAdmin={handleNavigateAdmin}
    on:navigateGroups={handleNavigateGroups}
  />

  <!-- Main Content Area -->
  <div class="flex flex-1 overflow-hidden">
    <!-- 
            Sidebar: Conversation List
            Hidden on mobile (md:block), always visible on desktop
        -->
    <aside class="hidden md:block h-full">
      <ConversationList
        {brandId}
        on:newMessage={() => {
          newConversationPhone = '';
          newConversationName = null;
          showNewConversation = true;
        }}
      />
    </aside>

    <!-- 
            Main Area: Chat Window
            Takes remaining width, full height
        -->
    <main class="flex-1 h-full relative">
      <ChatWindow />
    </main>
  </div>
</div>

<!-- Modals and Panels -->

<!-- Brand Manager Modal -->
<BrandManager
  isOpen={showBrandManager}
  {editBrand}
  on:close={handleCloseBrandManager}
  on:saved={handleBrandSaved}
/>

<!-- Bulk Message Modal -->
<BulkMessageModal isOpen={showBulkMessage} on:close={() => (showBulkMessage = false)} />

<!-- Contacts Panel -->
<ContactsPanel
  isOpen={showContacts}
  on:close={() => (showContacts = false)}
  on:sendMessage={handleContactSendMessage}
/>

<!-- New Conversation Modal -->
<NewConversationModal
  isOpen={showNewConversation}
  initialPhone={newConversationPhone}
  initialContactName={newConversationName}
  on:close={() => (showNewConversation = false)}
  on:sent={handleMessageSent}
/>

<style>
  /* 
     * Global styles for the page
     * Ensures proper font rendering
     */
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>
