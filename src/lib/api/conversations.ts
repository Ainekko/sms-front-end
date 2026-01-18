/**
 * Conversations API Module
 * =========================
 * API functions for conversation-related operations using the central base client.
 * 
 * This module provides:
 * - Get all conversations via GET /api/v1/messages/conversations
 * - Filter options for DNC, archived, and priority
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
    /** AI priority level (0-3). null if not analyzed */
    ai_priority?: number | null;
    /** AI do-not-contact flag */
    ai_do_not_contact?: boolean;
}

/**
 * Filter options for conversations list.
 * These map to backend query parameters for efficient filtering.
 */
export interface ConversationFilterOptions {
    /** Include do-not-contact contacts (default: false to save bandwidth) */
    includeDnc?: boolean;
    /** Include archived contacts (default: false) */
    includeArchived?: boolean;
    /** Minimum AI priority to include (0-3) */
    minPriority?: number;
    /** Maximum number of conversations to return (for pagination) */
    limit?: number;
    /** Number of conversations to skip (for pagination) */
    offset?: number;
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
 * Get conversations for a specific brand with optional filters.
 * 
 * @param brandId - Brand ID to get conversations for
 * @param options - Filter options (DNC, archived, priority)
 * @returns Promise resolving to array of conversation summaries
 */
export async function getConversationsByBrand(
    brandId: string,
    options: ConversationFilterOptions = {}
): Promise<ConversationResponse[]> {
    // Build query params from filter options
    const params = new URLSearchParams();

    // Default to excluding DNC unless explicitly requested
    params.append('include_dnc', String(options.includeDnc ?? false));

    // Default to excluding archived
    params.append('include_archived', String(options.includeArchived ?? false));

    // Add min priority if specified
    if (options.minPriority !== undefined) {
        params.append('min_priority', String(options.minPriority));
    }

    // Add pagination params (default: 50 per page)
    params.append('limit', String(options.limit ?? 50));
    if (options.offset !== undefined && options.offset > 0) {
        params.append('offset', String(options.offset));
    }

    const queryString = params.toString();
    const endpoint = `/messages/conversations/brand/${brandId}?${queryString}`;

    console.log('[Conversations] Fetching with filters:', endpoint);
    return api.get<ConversationResponse[]>(endpoint);
}

/**
 * Conversations API object for convenient access.
 */
export const conversationsApi = {
    getAllConversations,
    getConversationsByBrand,
};

