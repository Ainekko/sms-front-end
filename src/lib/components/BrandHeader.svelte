<!--
  BrandHeader Component
  ======================
  Application header with brand selection, action buttons, and connection status.
  
  This component:
  - Brand selector dropdown on the left
  - Action buttons (Bulk Send, Contacts)
  - Real-time WebSocket connection status on the right
  - Error banner for connection issues
  
  Props:
    None
  
  Events:
    openBrandManager - Request to open brand manager modal
    openBulkMessage - Request to open bulk message modal
    openContacts - Request to open contacts panel
  
  Usage:
    <BrandHeader 
      on:openBrandManager={handleOpenBrandManager}
      on:openBulkMessage={handleOpenBulkMessage}
      on:openContacts={handleOpenContacts}
    />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Import stores
  import { connectionStore, ConnectionStatus } from '../stores/connectionStore';

  // Import components
  import BrandSelector from './BrandSelector.svelte';

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  const dispatch = createEventDispatcher<{
    openBrandManager: void;
    openBulkMessage: void;
    openContacts: void;
  }>();

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  // Subscribe to connection store
  $: status = $connectionStore.status;
  $: errorMessage = $connectionStore.errorMessage;
  $: reconnectAttempts = $connectionStore.reconnectAttempts;

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Get the status indicator color class based on connection status.
   */
  function getStatusColorClass(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'bg-green-500';
      case ConnectionStatus.CONNECTING:
        return 'bg-yellow-500';
      case ConnectionStatus.ERROR:
        return 'bg-red-500';
      case ConnectionStatus.DISCONNECTED:
      default:
        return 'bg-gray-400';
    }
  }

  /**
   * Get human-readable status text.
   */
  function getStatusText(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'Online';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.ERROR:
        return reconnectAttempts > 0
          ? `Reconnecting (${reconnectAttempts})...`
          : 'Connection Error';
      case ConnectionStatus.DISCONNECTED:
      default:
        return 'Offline';
    }
  }

  /**
   * Get text color class based on status.
   */
  function getTextColorClass(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'text-green-600';
      case ConnectionStatus.CONNECTING:
        return 'text-yellow-600';
      case ConnectionStatus.ERROR:
        return 'text-red-600';
      case ConnectionStatus.DISCONNECTED:
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Handle brand manager request from selector.
   */
  function handleManageBrands(): void {
    dispatch('openBrandManager');
  }
</script>

<!-- Header Container -->
<div
  class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10"
>
  <!-- Left Side: Brand Selector -->
  <div class="flex items-center space-x-4">
    <!-- Logo -->
    <div
      class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg
                    flex items-center justify-center text-white font-bold shadow-sm"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>

    <!-- Divider -->
    <div class="h-8 w-px bg-gray-200"></div>

    <!-- Brand Selector -->
    <BrandSelector on:manageBrands={handleManageBrands} />
  </div>

  <!-- Center: Action Buttons -->
  <div class="flex items-center space-x-2">
    <!-- Bulk Send Button -->
    <button
      type="button"
      class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white
                   bg-gradient-to-r from-orange-500 to-pink-600 rounded-lg
                   hover:from-orange-600 hover:to-pink-700 transition-all
                   shadow-sm hover:shadow-md"
      on:click={() => dispatch('openBulkMessage')}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <span>Bulk Send</span>
    </button>

    <!-- Contacts Button -->
    <button
      type="button"
      class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700
                   bg-white border border-gray-300 rounded-lg
                   hover:bg-gray-50 transition-colors"
      on:click={() => dispatch('openContacts')}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span>Contacts</span>
    </button>
  </div>

  <!-- Right Side: Connection Status -->
  <div class="flex items-center space-x-2">
    <!-- Status Indicator Dot -->
    <span class="relative flex h-3 w-3">
      <!-- Ping animation (only when connected) -->
      {#if status === ConnectionStatus.CONNECTED}
        <span
          class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 {getStatusColorClass(
            status
          )}"
        ></span>
      {/if}
      <!-- Solid dot -->
      <span class="relative inline-flex rounded-full h-3 w-3 {getStatusColorClass(status)}"></span>
    </span>

    <!-- Status Text -->
    <span class="text-sm font-medium {getTextColorClass(status)}">
      {getStatusText(status)}
    </span>
  </div>
</div>

<!-- Error Banner (shown when there's a connection error) -->
{#if status === ConnectionStatus.ERROR && errorMessage}
  <div class="bg-red-50 border-b border-red-200 px-6 py-2">
    <div class="flex items-center space-x-2">
      <svg
        class="w-4 h-4 text-red-500 flex-shrink-0"
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
      <span class="text-sm text-red-700">{errorMessage}</span>
    </div>
  </div>
{/if}
