/**
 * Messages API Module
 * ====================
 * API functions for message operations using the central base client.
 * 
 * This module provides:
 * - Send SMS messages via POST /api/v1/messages/send
 * - Get messages for a conversation via GET /api/v1/messages/conversations/{phone}
 * 
 * Usage:
 *   import { messagesApi } from '$lib/api/messages';
 *   const result = await messagesApi.sendMessage('+1234567890', 'Hello!');
 */

import { api } from './base';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

/**
 * Request body for sending a message.
 */
export interface SendMessageRequest {
    /** Phone number to send to (E.164 format) */
    to_number: string;
    /** Message content to send */
    message: string;
    /** Optional brand ID to send from */
    brand_id?: string;
}

/**
 * Response from sending a message.
 */
export interface SendMessageResponse {
    success: boolean;
    message_sid: string;
    status: string;
    to_number: string;
    timestamp: string;
}

/**
 * A single message from the API.
 */
export interface MessageResponse {
    id: string;
    twilio_sid: string;
    from_number: string;
    to_number: string;
    body: string;
    direction: string;
    status: string;
    created_at: string;
}

/**
 * Error response from the API.
 */
export interface ApiError {
    success: boolean;
    error: string;
    error_code?: string;
    detail?: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Send an SMS message to a phone number.
 * 
 * @param toNumber - Phone number to send to (E.164 format)
 * @param message - Message content to send
 * @param brandId - Optional brand ID to send from
 */
export async function sendMessage(
    toNumber: string,
    message: string,
    brandId?: string
): Promise<SendMessageResponse> {
    const body: SendMessageRequest = {
        to_number: toNumber,
        message: message,
        ...(brandId && { brand_id: brandId })
    };
    return api.post<SendMessageResponse>('/messages/send', body);
}

/**
 * Get all messages for a conversation with a specific phone number.
 * 
 * @param phoneNumber - Phone number to get messages for
 * @param limit - Maximum number of messages to return (default 50)
 * @param offset - Number of messages to skip for pagination (default 0)
 */
export async function getConversationMessages(
    phoneNumber: string,
    limit: number = 50,
    offset: number = 0
): Promise<MessageResponse[]> {
    const encodedPhone = encodeURIComponent(phoneNumber);
    return api.get<MessageResponse[]>(`/messages/conversations/${encodedPhone}`, {
        params: { limit, offset }
    });
}

/**
 * Messages API object for convenient access.
 */
export const messagesApi = {
    sendMessage,
    getConversationMessages,
};
