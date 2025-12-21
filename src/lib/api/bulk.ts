/**
 * Bulk Messaging API Module
 * ==========================
 * API functions for bulk SMS messaging operations.
 * 
 * This module provides:
 * - Preview bulk send via POST /api/v1/bulk/preview
 * - Send bulk message via POST /api/v1/bulk/send
 * 
 * Usage:
 *   import { bulkApi } from '$lib/api/bulk';
 *   
 *   // Preview who will receive the message
 *   const preview = await bulkApi.previewBulkSend(['brand-uuid'], 'Hello!');
 *   
 *   // Send the message
 *   const result = await bulkApi.sendBulkMessage(['brand-uuid'], 'Hello!');
 */

import { config } from '../config';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

/**
 * Request body for bulk send operations.
 * Matches the FastAPI BulkSendRequest schema.
 */
export interface BulkSendRequest {
    /** List of brand IDs to send to (their contacts will receive) */
    brand_ids: string[];

    /** Message text to send (max 1600 chars) */
    message: string;
}

/**
 * Brand summary in preview response.
 */
export interface BulkPreviewBrand {
    /** Brand ID */
    brand_id: string;

    /** Brand name */
    brand_name: string;

    /** Phone number used for sending */
    from_number: string;

    /** Number of contacts in this brand */
    contact_count: number;
}

/**
 * Recipient in preview response.
 */
export interface BulkPreviewRecipient {
    /** Recipient phone number */
    to_number: string;

    /** Brand name sending from */
    brand_name: string;

    /** From phone number */
    from_number: string;
}

/**
 * Response from bulk preview endpoint.
 * Shows who would receive the message without sending.
 */
export interface BulkPreviewResponse {
    /** Total number of recipients */
    total_recipients: number;

    /** Breakdown by brand */
    brands: BulkPreviewBrand[];

    /** List of all recipients */
    recipients: BulkPreviewRecipient[];
}

/**
 * Individual send result in bulk send response.
 */
export interface BulkSendResult {
    /** Recipient phone number */
    to_number: string;

    /** Brand name */
    brand_name: string;

    /** Status: 'sent' or 'failed' */
    status: 'sent' | 'failed';

    /** Twilio message SID (if sent) */
    message_sid?: string;

    /** Error message (if failed) */
    error?: string;
}

/**
 * Response from bulk send endpoint.
 */
export interface BulkSendResponse {
    /** Whether all messages sent successfully */
    success: boolean;

    /** Number of messages sent */
    total_sent: number;

    /** Number of messages failed */
    total_failed: number;

    /** Individual results for each recipient */
    results: BulkSendResult[];
}

// =============================================================================
// API Class
// =============================================================================

/**
 * Bulk Messaging API client class.
 * 
 * Encapsulates bulk messaging API calls with proper typing
 * and error handling.
 */
class BulkApiClient {
    /**
     * Base URL for the bulk API.
     * Includes the API version prefix.
     */
    private get baseUrl(): string {
        return `${config.apiUrl}/bulk`;
    }

    /**
     * Make a JSON API request with error handling.
     * 
     * @param endpoint - API endpoint (relative to bulk URL)
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

        console.log(`[BulkAPI] ${options.method || 'GET'} ${url}`);

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

                console.error(`[BulkAPI] Error:`, data);
                throw new Error(errorMessage);
            }

            console.log(`[BulkAPI] Response:`, data);
            return data as T;
        } catch (error) {
            if (error instanceof TypeError) {
                console.error(`[BulkAPI] Network error:`, error);
                throw new Error('Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
    }

    /**
     * Preview who will receive a bulk message.
     * 
     * Does not actually send any messages - just returns the list
     * of recipients for verification before sending.
     * 
     * @param brandIds - Array of brand IDs to target
     * @param message - Message text (for validation)
     * @returns Promise resolving to preview data
     * 
     * @example
     *   const preview = await bulkApi.previewBulkSend(
     *     ['brand-1', 'brand-2'],
     *     'Holiday sale! 20% off'
     *   );
     *   console.log(`Will send to ${preview.total_recipients} contacts`);
     */
    async previewBulkSend(brandIds: string[], message: string): Promise<BulkPreviewResponse> {
        const body: BulkSendRequest = {
            brand_ids: brandIds,
            message
        };

        return this.request<BulkPreviewResponse>('/preview', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Send a bulk message to all contacts of selected brands.
     * 
     * This will actually send SMS messages via Twilio to each contact.
     * Each brand's contacts receive the message from that brand's phone number.
     * 
     * @param brandIds - Array of brand IDs to target
     * @param message - Message text to send
     * @returns Promise resolving to send results
     * 
     * @example
     *   const result = await bulkApi.sendBulkMessage(
     *     ['brand-1'],
     *     'Hello from our team!'
     *   );
     *   console.log(`Sent: ${result.total_sent}, Failed: ${result.total_failed}`);
     */
    async sendBulkMessage(brandIds: string[], message: string): Promise<BulkSendResponse> {
        const body: BulkSendRequest = {
            brand_ids: brandIds,
            message
        };

        return this.request<BulkSendResponse>('/send', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}

// =============================================================================
// Exported Instance
// =============================================================================

/**
 * Singleton instance of the Bulk Messaging API client.
 * Import this to make API calls.
 */
export const bulkApi = new BulkApiClient();
