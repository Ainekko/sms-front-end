/**
 * Messages Store
 * ===============
 * Manages messages for the currently selected conversation thread.
 * 
 * This store handles:
 * - Loading messages for a specific phone number
 * - Adding new messages (sent or received)
 * - Updating message delivery status
 * - Pagination for long conversations
 * 
 * Usage:
 *   import { 
 *     messagesStore, 
 *     loadMessages, 
 *     addMessage 
 *   } from '$lib/stores/messagesStore';
 *   
 *   // Load messages for a conversation
 *   await loadMessages('+1234567890');
 *   
 *   // Add a new message
 *   addMessage({
 *     id: 'msg-123',
 *     body: 'Hello!',
 *     direction: 'outbound',
 *     status: 'sent',
 *     createdAt: new Date()
 *   });
 */

import { writable, derived } from 'svelte/store';
import { messagesApi } from '../api/messages';

// =============================================================================
// Types
// =============================================================================

/**
 * Possible statuses for a message.
 * These match the Twilio delivery status values.
 */
export type MessageStatus =
    | 'queued'      // Message is queued to be sent
    | 'sending'     // Message is being sent
    | 'sent'        // Message was sent to carrier
    | 'delivered'   // Message was delivered to recipient
    | 'failed'      // Message failed to send
    | 'undelivered' // Message was not delivered
    | 'received';   // Inbound message received

/**
 * Direction of a message relative to our system.
 */
export type MessageDirection = 'inbound' | 'outbound';

/**
 * Represents a single SMS message in a conversation.
 */
export interface Message {
    /** Unique identifier for the message (usually Twilio SID) */
    id: string;

    /** Twilio message SID for status tracking */
    twilioSid?: string;

    /** The phone number the message is from */
    fromNumber: string;

    /** The phone number the message is to */
    toNumber: string;

    /** The message content/body */
    body: string;

    /** Direction: 'inbound' (received) or 'outbound' (sent) */
    direction: MessageDirection;

    /** Current delivery status of the message */
    status: MessageStatus;

    /** When the message was created/received */
    createdAt: Date;
}

/**
 * Shape of the messages store state.
 */
export interface MessagesState {
    /** Phone number of the currently loaded conversation */
    currentPhoneNumber: string | null;

    /** Array of messages in the current conversation */
    messages: Message[];

    /** Whether messages are being loaded from the API */
    isLoading: boolean;

    /** Whether we're currently sending a message */
    isSending: boolean;

    /** Error message if loading/sending failed */
    error: string | null;

    /** Whether there are more messages to load (pagination) */
    hasMore: boolean;

    /** Current offset for pagination */
    offset: number;

    /** Current brand ID */
    brandId: string | null;
}

// =============================================================================
// Initial State
// =============================================================================

/**
 * Default initial state for the messages store.
 */
const initialState: MessagesState = {
    currentPhoneNumber: null,
    messages: [],
    isLoading: false,
    isSending: false,
    error: null,
    hasMore: false,
    hasMore: false,
    offset: 0,
    brandId: null
};

// =============================================================================
// Constants
// =============================================================================

/** Number of messages to load per page */
const PAGE_SIZE = 50;

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create the messages store with custom methods.
 */
function createMessagesStore() {
    const { subscribe, set, update } = writable<MessagesState>(initialState);

    return {
        subscribe,

        /**
         * Set loading state for initial load.
         * 
         * @param phoneNumber - Phone number being loaded
         * @param brandId - Optional brand ID
         */
        setLoading: (phoneNumber: string, brandId?: string) => {
            update(state => ({
                ...state,
                currentPhoneNumber: phoneNumber,
                brandId: brandId || null,
                isLoading: true,
                error: null,
                messages: [], // Clear previous messages
                offset: 0
            }));
        },

        /**
         * Set the messages after successful API load.
         * 
         * @param messages - Array of messages from API
         * @param hasMore - Whether there are more messages to load
         */
        setMessages: (messages: Message[], hasMore: boolean) => {
            update(state => ({
                ...state,
                messages,
                isLoading: false,
                error: null,
                hasMore,
                offset: messages.length
            }));
        },

        /**
         * Append more messages (for pagination).
         * 
         * @param messages - Additional messages to append
         * @param hasMore - Whether there are still more messages
         */
        appendMessages: (messages: Message[], hasMore: boolean) => {
            update(state => ({
                ...state,
                messages: [...state.messages, ...messages],
                isLoading: false,
                hasMore,
                offset: state.offset + messages.length
            }));
        },

        /**
         * Add a single new message to the conversation.
         * Called when sending a message or receiving via WebSocket.
         * 
         * @param message - The new message to add
         */
        addMessage: (message: Message) => {
            update(state => {
                // Don't add if message already exists
                if (state.messages.some(m => m.id === message.id)) {
                    return state;
                }

                // Don't add if it's for a different conversation
                const messagePhone = message.direction === 'inbound'
                    ? message.fromNumber
                    : message.toNumber;

                if (state.currentPhoneNumber && messagePhone !== state.currentPhoneNumber) {
                    return state;
                }

                return {
                    ...state,
                    messages: [...state.messages, message]
                };
            });
        },

        /**
         * Update the status of an existing message.
         * Called when receiving status webhook via WebSocket.
         * 
         * @param twilioSid - Twilio SID of the message to update
         * @param status - New status value
         */
        updateMessageStatus: (twilioSid: string, status: MessageStatus) => {
            update(state => ({
                ...state,
                messages: state.messages.map(msg =>
                    msg.twilioSid === twilioSid || msg.id === twilioSid
                        ? { ...msg, status }
                        : msg
                )
            }));
        },

        /**
         * Set sending state when submitting a new message.
         */
        setSending: (isSending: boolean) => {
            update(state => ({
                ...state,
                isSending,
                error: isSending ? null : state.error
            }));
        },

        /**
         * Set an error message.
         * 
         * @param error - Human-readable error message
         */
        setError: (error: string) => {
            update(state => ({
                ...state,
                isLoading: false,
                isSending: false,
                error
            }));
        },

        /**
         * Clear all messages (when switching conversations).
         */
        clear: () => {
            set(initialState);
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
// Exported Store Instance
// =============================================================================

/**
 * The singleton messages store instance.
 */
export const messagesStore = createMessagesStore();

// =============================================================================
// Derived Stores
// =============================================================================

/**
 * Derived store for just the messages array.
 */
export const messages = derived(
    messagesStore,
    $store => $store.messages
);

/**
 * Derived store for loading state.
 */
export const isLoadingMessages = derived(
    messagesStore,
    $store => $store.isLoading
);

/**
 * Derived store for sending state.
 */
export const isSendingMessage = derived(
    messagesStore,
    $store => $store.isSending
);

// =============================================================================
// Actions
// =============================================================================

/**
 * Load messages for a specific phone number.
 * 
 * @param phoneNumber - Phone number to load messages for
 * @param brandId - Optional brand ID
 * @returns Promise that resolves when loading is complete
 */
export async function loadMessages(phoneNumber: string, brandId?: string): Promise<void> {
    messagesStore.setLoading(phoneNumber, brandId);

    try {
        // Fetch messages from the API
        const data = await messagesApi.getConversationMessages(phoneNumber, brandId, PAGE_SIZE, 0);

        // Transform API response to our store format
        const messages: Message[] = data.map(item => ({
            id: item.id,
            twilioSid: item.twilio_sid,
            fromNumber: item.from_number,
            toNumber: item.to_number,
            body: item.body,
            direction: item.direction as MessageDirection,
            status: item.status as MessageStatus,
            createdAt: new Date(item.created_at)
        }));

        // Check if there might be more messages
        const hasMore = messages.length === PAGE_SIZE;

        messagesStore.setMessages(messages, hasMore);
    } catch (error) {
        console.error('[MessagesStore] Failed to load messages:', error);
        messagesStore.setError(
            error instanceof Error ? error.message : 'Failed to load messages'
        );
    }
}

/**
 * Load more messages for the current conversation (pagination).
 * 
 * @returns Promise that resolves when loading is complete
 */
export async function loadMoreMessages(): Promise<void> {
    // Get current state to check offset and phone number
    let currentState: MessagesState;
    messagesStore.subscribe(s => currentState = s)();

    if (!currentState!.currentPhoneNumber || currentState!.isLoading) {
        return;
    }

    messagesStore.setLoading(currentState!.currentPhoneNumber);

    try {
        const data = await messagesApi.getConversationMessages(
            currentState!.currentPhoneNumber,
            currentState!.brandId || undefined,
            PAGE_SIZE,
            currentState!.offset
        );

        const messages: Message[] = data.map(item => ({
            id: item.id,
            twilioSid: item.twilio_sid,
            fromNumber: item.from_number,
            toNumber: item.to_number,
            body: item.body,
            direction: item.direction as MessageDirection,
            status: item.status as MessageStatus,
            createdAt: new Date(item.created_at)
        }));

        const hasMore = messages.length === PAGE_SIZE;

        messagesStore.appendMessages(messages, hasMore);
    } catch (error) {
        console.error('[MessagesStore] Failed to load more messages:', error);
        messagesStore.setError(
            error instanceof Error ? error.message : 'Failed to load more messages'
        );
    }
}

/**
 * Send a new message to a phone number.
 * 
 * @param toNumber - Phone number to send to (E.164 format)
 * @param messageBody - Content of the message
 * @param brandId - Optional brand ID
 * @returns Promise that resolves with the sent message or throws on error
 */
export async function sendMessage(toNumber: string, messageBody: string, brandId?: string): Promise<Message> {
    messagesStore.setSending(true);

    try {
        // Send via API
        const response = await messagesApi.sendMessage(toNumber, messageBody, brandId);

        // Create message object from response
        const newMessage: Message = {
            id: response.message_sid,
            twilioSid: response.message_sid,
            fromNumber: '', // Will be our Twilio number
            toNumber: response.to_number,
            body: messageBody,
            direction: 'outbound',
            status: response.status as MessageStatus,
            createdAt: new Date(response.timestamp)
        };

        // Add to store
        messagesStore.addMessage(newMessage);
        messagesStore.setSending(false);

        return newMessage;
    } catch (error) {
        console.error('[MessagesStore] Failed to send message:', error);
        messagesStore.setError(
            error instanceof Error ? error.message : 'Failed to send message'
        );
        messagesStore.setSending(false);
        throw error;
    }
}

/**
 * Add a message received via WebSocket.
 * Updates both messages and conversations stores.
 * 
 * @param messageData - Raw message data from WebSocket
 */
export function addReceivedMessage(messageData: any): void {
    const message: Message = {
        id: messageData.id,
        twilioSid: messageData.twilio_sid,
        fromNumber: messageData.from_number,
        toNumber: messageData.to_number,
        body: messageData.body,
        direction: messageData.direction as MessageDirection,
        status: messageData.status as MessageStatus,
        createdAt: new Date(messageData.created_at)
    };

    messagesStore.addMessage(message);
}

/**
 * Update message status from WebSocket event.
 * 
 * @param twilioSid - Twilio SID of the message
 * @param status - New status value
 */
export function updateStatus(twilioSid: string, status: string): void {
    messagesStore.updateMessageStatus(twilioSid, status as MessageStatus);
}
