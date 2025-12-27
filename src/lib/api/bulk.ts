/**
 * Bulk Messaging API Module
 * ==========================
 * API functions for bulk SMS messaging using the central base client.
 * 
 * Usage:
 *   import { bulkApi } from '$lib/api/bulk';
 *   const preview = await bulkApi.previewBulkSend(['brand-uuid'], 'Hello!');
 */

import { api } from './base';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

export interface BulkSendRequest {
    brand_ids: string[];
    message: string;
}

export interface GroupSendRequest {
    group_id: string;
    from_brand_id: string;
    message: string;
}

export interface BulkPreviewBrand {
    brand_id: string;
    brand_name: string;
    from_number: string;
    contact_count: number;
}

export interface BulkPreviewRecipient {
    to_number: string;
    brand_name: string;
    from_number: string;
}

export interface BulkPreviewResponse {
    total_recipients: number;
    brands: BulkPreviewBrand[];
    recipients: BulkPreviewRecipient[];
}

export interface BulkSendResult {
    to_number: string;
    brand_name: string;
    status: 'sent' | 'failed';
    message_sid?: string;
    error?: string;
}

export interface BulkSendResponse {
    success: boolean;
    total_sent: number;
    total_failed: number;
    results: BulkSendResult[];
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Preview who will receive a bulk message.
 */
export async function previewBulkSend(brandIds: string[], message: string): Promise<BulkPreviewResponse> {
    return api.post<BulkPreviewResponse>('/bulk/preview', { brand_ids: brandIds, message });
}

/**
 * Send a bulk message to all contacts of selected brands.
 */
export async function sendBulkMessage(brandIds: string[], message: string): Promise<BulkSendResponse> {
    return api.post<BulkSendResponse>('/bulk/send', { brand_ids: brandIds, message });
}

/**
 * Preview recipients for sending to a contact group.
 */
export async function previewGroupSend(data: GroupSendRequest): Promise<BulkPreviewResponse> {
    return api.post<BulkPreviewResponse>('/bulk/preview-group', data);
}

/**
 * Send message to all contacts in a group.
 */
export async function sendToGroup(data: GroupSendRequest): Promise<BulkSendResponse> {
    return api.post<BulkSendResponse>('/bulk/send-to-group', data);
}

/**
 * Bulk API object for convenient access.
 */
export const bulkApi = {
    previewBulkSend,
    sendBulkMessage,
    previewGroupSend,
    sendToGroup,
};
