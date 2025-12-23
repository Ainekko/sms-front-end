/**
 * Conversations API Module
 * =========================
 * API functions for conversation-related operations.
 * 
 * This module provides:
 * - Get all conversations via GET /api/v1/messages/conversations
 * 
 * A conversation is a thread of messages with a specific phone number.
 * This API returns summaries of all conversations for the inbox view.
 * 
 * Usage:
 *   import { conversationsApi } from '$lib/api/conversations';
 *   
 *   // Get all conversations
 *   const conversations = await conversationsApi.getAllConversations();
 *   conversations.forEach(conv => {
 *     console.log(`${conv.phone_number}: ${conv.last_message}`);
 *   });
 */

import { config } from '../config';

// =============================================================================
// Types - API Response Shapes
// =============================================================================

/**
 * Conversation summary from the API.
 * Matches the structure returned by GET /api/v1/messages/conversations.
 */
export interface ConversationResponse {
    /** Phone number this conversation is with (E.164 format) */
    phone_number: string;

    /** Preview of the last message in the conversation */
    last_message: string;

    /** Direction of the last message: 'inbound' or 'outbound' */
    last_direction: string;

    /** Timestamp of the last message (ISO format) */
    last_message_at: string;

    /** Total number of messages in this conversation */
    message_count: number;
}

// =============================================================================
// API Class
// =============================================================================

/**
 * Conversations API client class.
 * 
 * Encapsulates all conversation-related API calls with proper typing
 * and error handling.
 */
class ConversationsApiClient {
    /**
     * Base URL for the messages API.
     * Conversations endpoints are under /messages/conversations.
     */
    private get baseUrl(): string {
        return `${config.apiUrl}/messages`;
    }

    /**
     * Make a JSON API request with error handling.
     * 
     * @param endpoint - API endpoint (relative to base URL)
     * @param options - Fetch options
     * @returns Parsed JSON response
     * @throws Error with message from API on failure
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Get auth token from localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('sms_auth_token')
            : null;

        // Set default headers with auth
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        console.log(`[ConversationsAPI] ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Parse response body
            const data = await response.json();

            // Check for errors
            if (!response.ok) {
                const errorMessage = data.detail?.error
                    || data.detail
                    || data.error
                    || `Request failed with status ${response.status}`;

                console.error(`[ConversationsAPI] Error:`, data);
                throw new Error(errorMessage);
            }

            console.log(`[ConversationsAPI] Response:`, data);
            return data as T;
        } catch (error) {
            // Re-throw fetch errors with better messages
            if (error instanceof TypeError) {
                console.error(`[ConversationsAPI] Network error:`, error);
                throw new Error('Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
    }

    /**
     * Get all conversations.
     * 
     * Calls GET /api/v1/messages/conversations to retrieve a summary of
     * all conversations. Each conversation includes the phone number,
     * last message preview, and message count.
     * 
     * Conversations are sorted by most recent message first.
     * 
     * @returns Promise resolving to array of conversation summaries
     * @throws Error if loading fails
     * 
     * @example
     *   const conversations = await conversationsApi.getAllConversations();
     *   conversations.forEach(conv => {
     *     console.log(`${conv.phone_number}: ${conv.message_count} messages`);
     *   });
     */
    async getAllConversations(): Promise<ConversationResponse[]> {
        return this.request<ConversationResponse[]>('/conversations');
    }
}

// =============================================================================
// Exported Instance
// =============================================================================

/**
 * Singleton instance of the Conversations API client.
 * Import this to make API calls.
 */
export const conversationsApi = new ConversationsApiClient();
