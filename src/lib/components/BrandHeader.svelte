<!--
  BrandHeader Component
  ======================
  Displays the application header with brand name and connection status.
  
  This component:
  - Shows the brand/company name
  - Displays real-time WebSocket connection status
  - Changes indicator color based on connection state
  - Shows reconnection attempts when applicable
  
  Props: None
  
  Events: None
  
  Usage:
    <BrandHeader />
-->

<script lang="ts">
  // Import stores
  import {
    connectionStore,
    ConnectionStatus,
    isConnected,
    isConnecting
  } from '../stores/connectionStore';

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  // Subscribe to connection store
  $: status = $connectionStore.status;
  $: errorMessage = $connectionStore.errorMessage;
  $: reconnectAttempts = $connectionStore.reconnectAttempts;

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /** Brand name displayed in the header */
  const brandName = 'SMS Messaging';

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Get the status indicator color class based on connection status.
   *
   * @param status - Current connection status
   * @returns Tailwind CSS classes for the status indicator
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
   * Get the ping animation class (only for connected state).
   *
   * @param status - Current connection status
   * @returns Animation class or empty string
   */
  function getPingClass(status: ConnectionStatus): string {
    return status === ConnectionStatus.CONNECTED ? 'animate-ping' : '';
  }

  /**
   * Get human-readable status text.
   *
   * @param status - Current connection status
   * @returns Status text to display
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
   *
   * @param status - Current connection status
   * @returns Tailwind text color class
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
</script>

<!-- Header Container -->
<div
  class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10"
>
  <!-- Left Side: Brand Identity -->
  <div class="flex items-center space-x-3">
    <!-- Brand Icon -->
    <div
      class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg
            flex items-center justify-center text-white font-bold shadow-sm"
    >
      <!-- Message icon -->
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>

    <!-- Brand Name -->
    <h1 class="text-lg font-bold text-gray-800">{brandName}</h1>
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
