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
  import { isAuthenticated, isAdmin, currentUser, authStore } from '../stores';

  // Import components
  import BrandSelector from './BrandSelector.svelte';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Selected brand ID from URL */
  export let selectedBrandId: string | null = null;

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  const dispatch = createEventDispatcher<{
    openBrandManager: void;
    openBulkMessage: void;
    openContacts: void;
    openHotLeads: void;
    openDNCList: void;
    logout: void;
    navigateAdmin: void;
    navigateGroups: void;
    navigateCampaigns: void;
  }>();

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  // Subscribe to connection store
  $: status = $connectionStore.status;
  $: errorMessage = $connectionStore.errorMessage;
  $: reconnectAttempts = $connectionStore.reconnectAttempts;

  // User menu state
  let showUserMenu = false;

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
    <BrandSelector {selectedBrandId} on:manageBrands={handleManageBrands} />
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

    <!-- Groups Button -->
    <button
      type="button"
      class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700
                   bg-white border border-gray-300 rounded-lg
                   hover:bg-gray-50 transition-colors"
      on:click={() => dispatch('navigateGroups')}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      <span>Groups</span>
    </button>

    <!-- Campaigns Button -->
    <button
      type="button"
      class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700
                   bg-white border border-gray-300 rounded-lg
                   hover:bg-gray-50 transition-colors"
      on:click={() => dispatch('navigateCampaigns')}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
        />
      </svg>
      <span>Campaigns</span>
    </button>

    <!-- Divider -->
    <div class="h-6 w-px bg-gray-200"></div>

    <!-- Hot Leads Button (AI) -->
    <button
      type="button"
      class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-zinc-700
                   bg-zinc-100 border border-zinc-200 rounded-lg
                   hover:bg-zinc-200 hover:border-zinc-300 transition-all"
      on:click={() => dispatch('openHotLeads')}
    >
      <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
          clip-rule="evenodd"
        />
      </svg>
      <span>Leads</span>
    </button>

    <!-- DNC Button (AI) -->
    <button
      type="button"
      class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-zinc-600
                   bg-white border border-zinc-200 rounded-lg
                   hover:bg-zinc-50 hover:border-zinc-300 transition-all"
      on:click={() => dispatch('openDNCList')}
    >
      <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
      <span>DNC</span>
    </button>
  </div>

  <!-- Right Side: Connection Status + User Menu -->
  <div class="flex items-center space-x-4">
    <!-- Status Indicator Dot -->
    <div class="flex items-center space-x-2">
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
        <span class="relative inline-flex rounded-full h-3 w-3 {getStatusColorClass(status)}"
        ></span>
      </span>

      <!-- Status Text -->
      <span class="text-sm font-medium {getTextColorClass(status)}">
        {getStatusText(status)}
      </span>
    </div>

    <!-- Divider -->
    <div class="h-8 w-px bg-gray-200"></div>

    <!-- User Menu -->
    {#if $isAuthenticated && $currentUser}
      <div class="relative">
        <button
          type="button"
          class="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700
                       hover:bg-gray-100 rounded-lg transition-colors"
          on:click={() => (showUserMenu = !showUserMenu)}
        >
          <div
            class="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full
                        flex items-center justify-center text-white text-xs font-semibold"
          >
            {$currentUser.email[0].toUpperCase()}
          </div>
          <span class="max-w-[120px] truncate">{$currentUser.email}</span>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        {#if showUserMenu}
          <!-- Backdrop to close menu -->
          <button class="fixed inset-0 z-10" on:click={() => (showUserMenu = false)}></button>

          <div
            class="absolute right-0 mt-2 w-48 bg-white border border-gray-200
                        rounded-lg shadow-lg z-20 py-1"
          >
            <!-- User Info -->
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900 truncate">{$currentUser.email}</p>
              <p class="text-xs text-gray-500 capitalize">{$currentUser.role}</p>
            </div>

            <!-- Admin Link (only for admins) -->
            {#if $isAdmin}
              <button
                type="button"
                class="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100
                             flex items-center space-x-2"
                on:click={() => {
                  showUserMenu = false;
                  dispatch('navigateAdmin');
                }}
              >
                <svg
                  class="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Admin Dashboard</span>
              </button>
            {/if}

            <!-- Logout -->
            <button
              type="button"
              class="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50
                           flex items-center space-x-2"
              on:click={() => {
                showUserMenu = false;
                dispatch('logout');
              }}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        {/if}
      </div>
    {/if}
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
