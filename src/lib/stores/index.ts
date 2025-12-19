/**
 * Stores Index
 * =============
 * Central export point for all Svelte stores.
 * 
 * This file re-exports all stores from their individual modules
 * for convenient importing in components.
 * 
 * Usage:
 *   // Instead of:
 *   import { connectionStore } from '$lib/stores/connectionStore';
 *   import { conversationsStore } from '$lib/stores/conversationsStore';
 *   
 *   // You can use:
 *   import { connectionStore, conversationsStore } from '$lib/stores';
 */

// =============================================================================
// Connection Store
// =============================================================================
// Manages WebSocket connection state

export {
    connectionStore,
    isConnected,
    isConnecting,
    hasConnectionError,
    ConnectionStatus,
    type ConnectionState
} from './connectionStore';

// =============================================================================
// Conversations Store
// =============================================================================
// Manages the list of all SMS conversations

export {
    conversationsStore,
    selectedConversationId,
    selectedConversation,
    conversations,
    totalUnreadCount,
    loadConversations,
    selectConversation,
    type ConversationSummary,
    type ConversationsState
} from './conversationsStore';

// =============================================================================
// Messages Store
// =============================================================================
// Manages messages for the currently selected conversation

export {
    messagesStore,
    messages,
    isLoadingMessages,
    isSendingMessage,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    addReceivedMessage,
    updateStatus,
    type Message,
    type MessageStatus,
    type MessageDirection,
    type MessagesState
} from './messagesStore';

// =============================================================================
// UI Store
// =============================================================================
// Manages global UI state (toasts, loading, errors)

export {
    uiStore,
    showToast,
    showSuccess,
    showError,
    showWarning,
    hasToasts,
    toasts,
    globalError,
    type Toast,
    type ToastType,
    type UIState
} from './uiStore';
