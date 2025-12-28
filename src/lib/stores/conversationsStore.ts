/**
 * Conversations Store
 * ====================
 * Manages the list of all SMS conversations.
 * 
 * A conversation is a thread of messages with a specific phone number.
 * This store handles:
 * - Loading conversations from the API
 * - Storing the list of conversations
 * - Tracking which conversation is selected
 * - Updating conversations when new messages arrive
 * 
 * Usage:
 *   import { 
 *     conversationsStore, 
 *     selectedConversationId,
 *     loadConversations 
 *   } from '$lib/stores/conversationsStore';
 *   
 *   // Load all conversations
 *   await loadConversations();
 *   
 *   // Select a conversation
 *   selectedConversationId.set('+1234567890');
 */

import { writable, derived } from 'svelte/store';
import { conversationsApi } from '../api/conversations';

// =============================================================================
// Types
// =============================================================================

/**
 * Represents a summary of a conversation with a phone number.
 * This is what we get from the API's /conversations endpoint.
 */
export interface ConversationSummary {
    /** The phone number this conversation is with (E.164 format) */
    phoneNumber: string;

    /** UUID of the contact, null if not a saved contact */
    contactId: string | null;

    /** Name of the contact, null if no contact or contact has no name */
    contactName: string | null;

    /** Preview of the last message in the conversation */
    lastMessage: string;

    /** Direction of the last message: 'inbound' or 'outbound' */
    lastMessageDirection: 'inbound' | 'outbound';

    /** Timestamp of the last message */
    lastMessageAt: Date;

    /** Total number of messages in this conversation */
    messageCount: number;

    /** Number of unread messages (for future use) */
    unreadCount: number;
}

/**
 * Shape of the conversations store state.
 */
export interface ConversationsState {
    /** Array of all conversations */
    conversations: ConversationSummary[];

    /** Whether conversations are being loaded from the API */
    isLoading: boolean;

    /** Error message if loading failed, null otherwise */
    error: string | null;

    /** Timestamp of last successful load */
    lastLoadedAt: Date | null;
}

// =============================================================================
// Initial State
// =============================================================================

/**
 * Default initial state for the conversations store.
 */
const initialState: ConversationsState = {
    conversations: [],
    isLoading: false,
    error: null,
    lastLoadedAt: null
};

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create the conversations store with custom methods.
 */
function createConversationsStore() {
    const { subscribe, set, update } = writable<ConversationsState>(initialState);

    return {
        subscribe,

        /**
         * Set loading state to true.
         * Called before making API requests.
         */
        setLoading: () => {
            update(state => ({
                ...state,
                isLoading: true,
                error: null
            }));
        },

        /**
         * Set the conversations list after successful API load.
         * 
         * @param conversations - Array of conversation summaries from API
         */
        setConversations: (conversations: ConversationSummary[]) => {
            update(state => ({
                ...state,
                conversations,
                isLoading: false,
                error: null,
                lastLoadedAt: new Date()
            }));
        },

        /**
         * Set an error message when loading fails.
         * 
         * @param error - Human-readable error message
         */
        setError: (error: string) => {
            update(state => ({
                ...state,
                isLoading: false,
                error
            }));
        },

        /**
         * Add a new conversation or update existing one.
         * Called when a new message is received via WebSocket.
         * 
         * @param phoneNumber - Phone number of the conversation
         * @param lastMessage - Content of the new message
         * @param direction - Direction of the message
         */
        upsertConversation: (
            phoneNumber: string,
            lastMessage: string,
            direction: 'inbound' | 'outbound'
        ) => {
            update(state => {
                const existingIndex = state.conversations.findIndex(
                    c => c.phoneNumber === phoneNumber
                );

                const now = new Date();

                if (existingIndex >= 0) {
                    // Update existing conversation
                    const updated = [...state.conversations];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        lastMessage,
                        lastMessageDirection: direction,
                        lastMessageAt: now,
                        messageCount: updated[existingIndex].messageCount + 1,
                        // Increment unread count only for inbound messages
                        unreadCount: direction === 'inbound'
                            ? updated[existingIndex].unreadCount + 1
                            : updated[existingIndex].unreadCount
                    };

                    // Sort by last message time (most recent first)
                    updated.sort((a, b) =>
                        b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
                    );

                    return { ...state, conversations: updated };
                } else {
                    // Add new conversation at the top
                    const newConversation: ConversationSummary = {
                        phoneNumber,
                        contactId: null,
                        contactName: null,
                        lastMessage,
                        lastMessageDirection: direction,
                        lastMessageAt: now,
                        messageCount: 1,
                        unreadCount: direction === 'inbound' ? 1 : 0
                    };

                    return {
                        ...state,
                        conversations: [newConversation, ...state.conversations]
                    };
                }
            });
        },

        /**
         * Mark a conversation as read (reset unread count).
         * Called when user selects a conversation.
         * 
         * @param phoneNumber - Phone number of the conversation
         */
        markAsRead: (phoneNumber: string) => {
            update(state => ({
                ...state,
                conversations: state.conversations.map(c =>
                    c.phoneNumber === phoneNumber
                        ? { ...c, unreadCount: 0 }
                        : c
                )
            }));
        },

        /**
         * Reset the store to its initial state.
         */
        reset: () => {
            set(initialState);
        }
    };
}

// =============================================================================
// Exported Store Instances
// =============================================================================

/**
 * The singleton conversations store instance.
 */
export const conversationsStore = createConversationsStore();

/**
 * Store for the currently selected conversation's phone number.
 * This is separate from the main store for simpler updates.
 */
export const selectedConversationId = writable<string | null>(null);

// =============================================================================
// Derived Stores
// =============================================================================

/**
 * Derived store that returns the currently selected conversation.
 * Returns null if no conversation is selected.
 */
export const selectedConversation = derived(
    [conversationsStore, selectedConversationId],
    ([$store, $selectedId]) => {
        if (!$selectedId) return null;
        return $store.conversations.find(c => c.phoneNumber === $selectedId) || null;
    }
);

/**
 * Derived store for just the conversations array.
 * Useful when you only need the list without loading state.
 */
export const conversations = derived(
    conversationsStore,
    $store => $store.conversations
);

/**
 * Derived store for total unread count across all conversations.
 */
export const totalUnreadCount = derived(
    conversationsStore,
    $store => $store.conversations.reduce((sum, c) => sum + c.unreadCount, 0)
);

// =============================================================================
// Actions
// =============================================================================

/**
 * Load all conversations from the API.
 * Updates the store with the loaded data or error message.
 * 
 * @param brandId - Optional brand ID to filter conversations
 * @returns Promise that resolves when loading is complete
 */
export async function loadConversations(brandId?: string): Promise<void> {
    conversationsStore.setLoading();

    try {
        // Fetch conversations from the API (optionally filtered by brand)
        const data = await conversationsApi.getAllConversations(brandId);

        // Transform API response to our store format
        const conversations: ConversationSummary[] = data.map(item => ({
            phoneNumber: item.phone_number,
            contactId: item.contact_id,
            contactName: item.contact_name,
            lastMessage: item.last_message?.body || '',
            lastMessageDirection: item.last_message?.direction || 'outbound',
            lastMessageAt: new Date(item.last_message?.created_at || Date.now()),
            messageCount: item.message_count || 0,
            unreadCount: 0 // TODO: Track unread on backend
        }));

        conversationsStore.setConversations(conversations);
    } catch (error) {
        console.error('[ConversationsStore] Failed to load conversations:', error);
        conversationsStore.setError(
            error instanceof Error ? error.message : 'Failed to load conversations'
        );
    }
}

/**
 * Select a conversation by phone number.
 * Marks the conversation as read.
 * 
 * @param phoneNumber - Phone number to select
 */
export function selectConversation(phoneNumber: string): void {
    selectedConversationId.set(phoneNumber);
    conversationsStore.markAsRead(phoneNumber);
}
