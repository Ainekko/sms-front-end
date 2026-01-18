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
 * - Filtering by DNC status, archived status, and AI priority
 * 
 * Usage:
 *   import { 
 *     conversationsStore, 
 *     selectedConversationId,
 *     loadConversations 
 *   } from '$lib/stores/conversationsStore';
 *   
 *   // Load all conversations (excludes DNC and archived by default)
 *   await loadConversations('brand-id');
 *   
 *   // Load with filters
 *   await loadConversations('brand-id', { includeDnc: true });
 *   
 *   // Select a conversation
 *   selectedConversationId.set('+1234567890');
 */

import { writable, derived } from 'svelte/store';
import { conversationsApi, type ConversationFilterOptions } from '../api/conversations';

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

    /** AI priority level (0-3). null if not analyzed */
    aiPriority?: number | null;

    /** AI do-not-contact flag */
    aiDoNotContact?: boolean;
}

/**
 * Filter state for the conversations list.
 * Matches backend filter options.
 */
export interface ConversationFilters {
    /** Include do-not-contact contacts */
    includeDnc: boolean;
    /** Include archived contacts */
    includeArchived: boolean;
    /** Minimum AI priority filter */
    minPriority?: number;
}

/**
 * Shape of the conversations store state.
 */
export interface ConversationsState {
    /** Array of all conversations */
    conversations: ConversationSummary[];

    /** Whether conversations are being loaded from the API */
    isLoading: boolean;

    /** Whether more conversations are being loaded (for pagination) */
    isLoadingMore: boolean;

    /** Error message if loading failed, null otherwise */
    error: string | null;

    /** Timestamp of last successful load */
    lastLoadedAt: Date | null;

    /** Current active filters */
    activeFilters: ConversationFilters;

    /** Brand ID currently loaded for */
    currentBrandId: string | null;

    /** Current offset for pagination */
    currentOffset: number;

    /** Whether there are more conversations to load */
    hasMore: boolean;
}

/**
 * Default filter settings - exclude DNC and archived for efficiency
 */
const defaultFilters: ConversationFilters = {
    includeDnc: false,
    includeArchived: false,
    minPriority: undefined
};

/** Number of conversations to load per page */
export const PAGE_SIZE = 50;

// =============================================================================
// Initial State
// =============================================================================

/**
 * Default initial state for the conversations store.
 */
const initialState: ConversationsState = {
    conversations: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    lastLoadedAt: null,
    activeFilters: { ...defaultFilters },
    currentBrandId: null,
    currentOffset: 0,
    hasMore: true
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
         * Set the conversations list after successful API load (replaces existing).
         * Resets pagination state for fresh load.
         * 
         * @param conversations - Array of conversation summaries from API
         * @param brandId - Brand ID these conversations are for
         * @param receivedCount - Number of items received (for hasMore check)
         */
        setConversations: (conversations: ConversationSummary[], brandId?: string, receivedCount?: number) => {
            update(state => ({
                ...state,
                conversations,
                isLoading: false,
                isLoadingMore: false,
                error: null,
                lastLoadedAt: new Date(),
                currentBrandId: brandId || state.currentBrandId,
                currentOffset: conversations.length,
                hasMore: receivedCount === undefined ? true : receivedCount >= PAGE_SIZE
            }));
        },

        /**
         * Set loading more state (for pagination).
         */
        setLoadingMore: (loading: boolean) => {
            update(state => ({
                ...state,
                isLoadingMore: loading
            }));
        },

        /**
         * Append more conversations (for infinite scroll).
         * 
         * @param newConversations - Additional conversations to append
         * @param receivedCount - Number of items received (for hasMore check)
         */
        appendConversations: (newConversations: ConversationSummary[], receivedCount: number) => {
            update(state => {
                // Deduplicate based on phoneNumber
                const existingPhones = new Set(state.conversations.map(c => c.phoneNumber));
                const uniqueNew = newConversations.filter(c => !existingPhones.has(c.phoneNumber));

                return {
                    ...state,
                    conversations: [...state.conversations, ...uniqueNew],
                    isLoadingMore: false,
                    currentOffset: state.currentOffset + uniqueNew.length,
                    hasMore: receivedCount >= PAGE_SIZE
                };
            });
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
                isLoadingMore: false,
                error
            }));
        },

        /**
         * Update the active filters.
         * 
         * @param filters - Partial filter updates to apply
         */
        setFilters: (filters: Partial<ConversationFilters>) => {
            update(state => ({
                ...state,
                activeFilters: {
                    ...state.activeFilters,
                    ...filters
                }
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

/**
 * Derived store for the current active filters.
 */
export const activeFilters = derived(
    conversationsStore,
    $store => $store.activeFilters
);

// =============================================================================
// Actions
// =============================================================================

/**
 * Load conversations from the API with optional filters.
 * Updates the store with the loaded data or error message.
 * 
 * By default, excludes DNC and archived contacts to save bandwidth.
 * Use the filters parameter to override.
 * 
 * @param brandId - Brand ID to filter conversations (required for filtering)
 * @param filters - Optional filter overrides
 * @returns Promise that resolves when loading is complete
 */
export async function loadConversations(
    brandId?: string,
    filters?: Partial<ConversationFilters>
): Promise<void> {
    conversationsStore.setLoading();

    // Merge provided filters with current active filters
    if (filters) {
        conversationsStore.setFilters(filters);
    }

    try {
        let data;

        if (brandId) {
            // Use the brand-specific endpoint with filters
            // Get current filters from store after any updates
            let currentFilters: ConversationFilters = { ...defaultFilters };
            conversationsStore.subscribe(s => { currentFilters = s.activeFilters; })();

            const apiFilters: ConversationFilterOptions = {
                includeDnc: currentFilters.includeDnc,
                includeArchived: currentFilters.includeArchived,
                minPriority: currentFilters.minPriority
            };

            console.log('[ConversationsStore] Loading with filters:', apiFilters);
            data = await conversationsApi.getConversationsByBrand(brandId, apiFilters);
        } else {
            // Fallback to unfiltered endpoint (less optimized)
            data = await conversationsApi.getAllConversations();
        }

        // Transform API response to our store format
        const conversations: ConversationSummary[] = data.map(item => ({
            phoneNumber: item.phone_number,
            contactId: item.contact_id,
            contactName: item.contact_name,
            lastMessage: item.last_message?.body || '',
            lastMessageDirection: item.last_message?.direction || 'outbound',
            lastMessageAt: new Date(item.last_message?.created_at || Date.now()),
            messageCount: item.message_count || 0,
            unreadCount: 0, // TODO: Track unread on backend
            aiPriority: item.ai_priority,
            aiDoNotContact: item.ai_do_not_contact
        }));

        if (conversations.length > 0) {
            console.log('[ConversationsStore] Mapped first item:', conversations[0]);
        }
        console.log(`[ConversationsStore] Loaded ${conversations.length} conversations (hasMore: ${data.length >= PAGE_SIZE})`);

        conversationsStore.setConversations(conversations, brandId, data.length);
    } catch (error) {
        console.error('[ConversationsStore] Failed to load conversations:', error);
        conversationsStore.setError(
            error instanceof Error ? error.message : 'Failed to load conversations'
        );
    }
}

/**
 * Load more conversations (for infinite scroll).
 * Appends to existing list instead of replacing.
 * 
 * @param brandId - Brand ID to load for
 * @returns Promise that resolves when loading is complete
 */
export async function loadMoreConversations(brandId: string): Promise<void> {
    // Get current state using Svelte's get helper pattern
    let stateSnapshot: ConversationsState = {
        conversations: [],
        isLoading: false,
        isLoadingMore: false,
        error: null,
        lastLoadedAt: null,
        activeFilters: { ...defaultFilters },
        currentBrandId: null,
        currentOffset: 0,
        hasMore: true
    };

    const unsubscribe = conversationsStore.subscribe((s: ConversationsState) => {
        stateSnapshot = s;
    });
    unsubscribe(); // Immediately unsubscribe after getting value

    // Don't load if already loading or no more data
    if (stateSnapshot.isLoadingMore || stateSnapshot.isLoading || !stateSnapshot.hasMore) {
        console.log('[ConversationsStore] Skipping loadMore:', {
            isLoadingMore: stateSnapshot.isLoadingMore,
            isLoading: stateSnapshot.isLoading,
            hasMore: stateSnapshot.hasMore
        });
        return;
    }

    conversationsStore.setLoadingMore(true);

    try {
        const apiFilters: ConversationFilterOptions = {
            includeDnc: stateSnapshot.activeFilters.includeDnc,
            includeArchived: stateSnapshot.activeFilters.includeArchived,
            minPriority: stateSnapshot.activeFilters.minPriority,
            limit: PAGE_SIZE,
            offset: stateSnapshot.currentOffset
        };

        console.log('[ConversationsStore] Loading more with offset:', stateSnapshot.currentOffset);
        const data = await conversationsApi.getConversationsByBrand(brandId, apiFilters);

        // Transform and append
        const newConversations: ConversationSummary[] = data.map(item => ({
            phoneNumber: item.phone_number,
            contactId: item.contact_id,
            contactName: item.contact_name,
            lastMessage: item.last_message?.body || '',
            lastMessageDirection: item.last_message?.direction || 'outbound',
            lastMessageAt: new Date(item.last_message?.created_at || Date.now()),
            messageCount: item.message_count || 0,
            unreadCount: 0,
            aiPriority: item.ai_priority,
            aiDoNotContact: item.ai_do_not_contact
        }));

        console.log(`[ConversationsStore] Loaded ${newConversations.length} more conversations`);
        conversationsStore.appendConversations(newConversations, data.length);
    } catch (error) {
        console.error('[ConversationsStore] Failed to load more conversations:', error);
        conversationsStore.setLoadingMore(false);
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

/**
 * Update filters and reload conversations.
 * Convenience function for filter UI controls.
 * 
 * @param brandId - Brand ID to reload for
 * @param filters - Filter updates to apply
 */
export async function updateFiltersAndReload(
    brandId: string,
    filters: Partial<ConversationFilters>
): Promise<void> {
    await loadConversations(brandId, filters);
}

/**
 * Derived store for pagination hasMore state.
 */
export const hasMoreConversations = derived(
    conversationsStore,
    $store => $store.hasMore
);

/**
 * Derived store for isLoadingMore state.
 */
export const isLoadingMore = derived(
    conversationsStore,
    $store => $store.isLoadingMore
);
