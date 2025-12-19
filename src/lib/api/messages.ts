/**
 * Messages API Module
 * ====================
 * API functions for message-related operations.
 * 
 * This module provides:
 * - Send SMS messages via POST /api/v1/messages/send
 * - Get messages for a conversation via GET /api/v1/messages/conversations/{phone}
 * 
 * All functions return typed responses and handle errors appropriately.
 * 
 * Usage:
 *   import { messagesApi } from '$lib/api/messages';
 *   
 *   // Send a message
 *   const result = await messagesApi.sendMessage('+1234567890', 'Hello!');
 *   
 *   // Get conversation messages
 *   const messages = await messagesApi.getConversationMessages('+1234567890');
 */

import { config } from '../config';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

/**
 * Request body for sending a message.
 * Matches the FastAPI SendMessageRequest schema.
 */
export interface SendMessageRequest {
    /** Phone number to send to (E.164 format) */
    to_number: string;

    /** Message content to send */
    message: string;
}

/**
 * Response from sending a message.
 * Matches the FastAPI SendMessageResponse schema.
 */
export interface SendMessageResponse {
    /** Whether the message was sent successfully */
    success: boolean;

    /** Twilio message SID for tracking */
    message_sid: string;

    /** Current status of the message */
    status: string;

    /** Phone number the message was sent to */
    to_number: string;

    /** Timestamp when the message was created */
    timestamp: string;
}

/**
 * A single message from the API.
 * Matches the message structure returned by the backend.
 */
export interface MessageResponse {
    /** Unique internal ID */
    id: string;

    /** Twilio message SID */
    twilio_sid: string;

    /** Sender phone number */
    from_number: string;

    /** Recipient phone number */
    to_number: string;

    /** Message content */
    body: string;

    /** Direction: 'inbound' or 'outbound' */
    direction: string;

    /** Delivery status */
    status: string;

    /** Creation timestamp (ISO format) */
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
// API Class
// =============================================================================

/**
 * Messages API client class.
 * 
 * Encapsulates all message-related API calls with proper typing
 * and error handling.
 */
class MessagesApiClient {
    /**
     * Base URL for the messages API.
     * Includes the API version prefix.
     */
    private get baseUrl(): string {
        return `${config.apiUrl}/messages`;
    }

    /**
     * Make a JSON API request with error handling.
     * 
     * @param endpoint - API endpoint (relative to messages URL)
     * @param options - Fetch options
     * @returns Parsed JSON response
     * @throws Error with message from API on failure
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Set default headers
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        console.log(`[MessagesAPI] ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Parse response body
            const data = await response.json();

            // Check for errors
            if (!response.ok) {
                // Extract error message from API response
                const errorMessage = data.detail?.error
                    || data.detail
                    || data.error
                    || `Request failed with status ${response.status}`;

                console.error(`[MessagesAPI] Error:`, data);
                throw new Error(errorMessage);
            }

            console.log(`[MessagesAPI] Response:`, data);
            return data as T;
        } catch (error) {
            // Re-throw fetch errors with better messages
            if (error instanceof TypeError) {
                console.error(`[MessagesAPI] Network error:`, error);
                throw new Error('Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
    }

    /**
     * Send an SMS message to a phone number.
     * 
     * Calls POST /api/v1/messages/send with the message details.
     * The message is sent via Twilio and a message SID is returned.
     * 
     * @param toNumber - Phone number to send to (E.164 format, e.g., +1234567890)
     * @param message - Message content to send (max 1600 characters)
     * @returns Promise resolving to SendMessageResponse
     * @throws Error if sending fails
     * 
     * @example
     *   const result = await messagesApi.sendMessage('+1234567890', 'Hello!');
     *   console.log(`Message SID: ${result.message_sid}`);
     */
    async sendMessage(
        toNumber: string,
        message: string
    ): Promise<SendMessageResponse> {
        const body: SendMessageRequest = {
            to_number: toNumber,
            message: message
        };

        return this.request<SendMessageResponse>('/send', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Get all messages for a conversation with a specific phone number.
     * 
     * Calls GET /api/v1/messages/conversations/{phone_number} with pagination.
     * Messages are returned in chronological order (oldest first).
     * 
     * @param phoneNumber - Phone number to get messages for
     * @param limit - Maximum number of messages to return (default 50)
     * @param offset - Number of messages to skip for pagination (default 0)
     * @returns Promise resolving to array of messages
     * @throws Error if loading fails
     * 
     * @example
     *   const messages = await messagesApi.getConversationMessages('+1234567890');
     *   messages.forEach(msg => console.log(msg.body));
     */
    async getConversationMessages(
        phoneNumber: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<MessageResponse[]> {
        // URL encode the phone number (handles the + sign)
        const encodedPhone = encodeURIComponent(phoneNumber);

        // Build query string for pagination
        const queryParams = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });

        return this.request<MessageResponse[]>(
            `/conversations/${encodedPhone}?${queryParams}`
        );
    }
}

// =============================================================================
// Exported Instance
// =============================================================================

/**
 * Singleton instance of the Messages API client.
 * Import this to make API calls.
 */
export const messagesApi = new MessagesApiClient();
