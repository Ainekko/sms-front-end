<!--
  Messages Page
  ==============
  Main page for the SMS messaging application.
  
  This page:
  - Initializes the WebSocket connection on mount
  - Loads initial conversations from the API
  - Renders the conversation list and chat window
  - Cleans up WebSocket connection on unmount
  
  Route: /messages
  
  Layout:
  - BrandHeader at top
  - ConversationList sidebar on left (hidden on mobile)
  - ChatWindow main area on right
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Import components
  import ConversationList from '$lib/components/ConversationList.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import BrandHeader from '$lib/components/BrandHeader.svelte';

  // Import services and stores
  import { webSocketService } from '$lib/services/websocket';
  import { loadConversations } from '$lib/stores/conversationsStore';
  import { connectionStore } from '$lib/stores/connectionStore';

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Initialize the application on component mount.
   * - Connect to WebSocket for real-time updates
   * - Load initial conversations from API
   */
  onMount(async () => {
    console.log('[MessagesPage] Mounting...');

    // Connect to WebSocket for real-time updates
    try {
      await webSocketService.connect();
      console.log('[MessagesPage] WebSocket connected');
    } catch (error) {
      console.error('[MessagesPage] Failed to connect WebSocket:', error);
      // The WebSocket service will handle reconnection attempts
    }

    // Load initial conversations
    // Note: ConversationList component also loads on mount, but this ensures
    // data is loaded even if the component is not yet rendered
    try {
      await loadConversations();
      console.log('[MessagesPage] Conversations loaded');
    } catch (error) {
      console.error('[MessagesPage] Failed to load conversations:', error);
    }
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
  <BrandHeader />

  <!-- Main Content Area -->
  <div class="flex flex-1 overflow-hidden">
    <!-- 
          Sidebar: Conversation List
          Hidden on mobile (md:block), always visible on desktop
          TODO: Add mobile drawer functionality
        -->
    <aside class="hidden md:block h-full">
      <ConversationList />
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
