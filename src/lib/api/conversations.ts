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
 * Message object from the API.
 */
export interface Message {
    id: string;
    twilio_sid: string;
    from_number: string;
    to_number: string;
    body: string;
    direction: 'inbound' | 'outbound';
    status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undelivered' | 'received';
    brand_id: string | null;
    contact_id: string | null;
    created_at: string;
}

/**
 * Conversation summary from the API.
 */
export interface ConversationResponse {
    /** Phone number this conversation is with (E.164 format) */
    phone_number: string;
    /** UUID of the contact. null if no contact exists */
    contact_id: string | null;
    /** Name of the contact. null if no contact or contact has no name */
    contact_name: string | null;
    /** The most recent message in this conversation */
    last_message: Message;
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
        ? `/messages/conversations?brand_id=${brandId}`
        : '/messages/conversations';
    const res = await api.get<ConversationResponse[]>(endpoint);
    console.log('[Conversations] Loaded:', res);
    return res;
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
