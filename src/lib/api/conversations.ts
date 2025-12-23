/**
 * Conversations API Module
 * =========================
 * API functions for conversation-related operations using the central base client.
 * 
 * This module provides:
 * - Get all conversations via GET /api/v1/messages/conversations
 * 
 * Usage:
 *   import { conversationsApi } from '$lib/api/conversations';
 *   const conversations = await conversationsApi.getAllConversations();
 */

import { api } from './base';

// =============================================================================
// Types - API Response Shapes
// =============================================================================

/**
 * Conversation summary from the API.
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
// API Functions
// =============================================================================

/**
 * Get all conversations.
 * 
 * Conversations are sorted by most recent message first.
 * 
 * @returns Promise resolving to array of conversation summaries
 */
export async function getAllConversations(): Promise<ConversationResponse[]> {
    return api.get<ConversationResponse[]>('/messages/conversations');
}

/**
 * Conversations API object for convenient access.
 */
export const conversationsApi = {
    getAllConversations,
};
