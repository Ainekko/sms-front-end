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
    /** Preview of the last message in the conversation (can be null) */
    last_message: string | null;
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
 * Get all conversations (optionally filtered by brand).
 * 
 * @param brandId - Optional brand ID to filter by
 * @returns Promise resolving to array of conversation summaries
 */
export async function getAllConversations(brandId?: string): Promise<ConversationResponse[]> {
    const endpoint = brandId
        ? `/messages/conversations/brand/${brandId}`
        : '/messages/conversations';
    return api.get<ConversationResponse[]>(endpoint);
}

/**
 * Get conversations for a specific brand.
 * 
 * @param brandId - Brand ID to get conversations for
 * @returns Promise resolving to array of conversation summaries
 */
export async function getConversationsByBrand(brandId: string): Promise<ConversationResponse[]> {
    return api.get<ConversationResponse[]>(`/messages/conversations/brand/${brandId}`);
}

/**
 * Conversations API object for convenient access.
 */
export const conversationsApi = {
    getAllConversations,
    getConversationsByBrand,
};
