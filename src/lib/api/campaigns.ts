/**
 * Campaigns API Module
 * =====================
 * API functions for campaign management.
 */

import { api } from './base';

// =============================================================================
// Types
// =============================================================================

export type CampaignStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
export type TargetType = 'brand' | 'group' | 'contacts';

export interface CampaignResponse {
    id: string;
    name: string;
    message_body: string;
    status: CampaignStatus;
    scheduled_at: string | null;
    created_at: string;
    total_recipients: number;
    total_sent: number;
    total_delivered?: number;
    total_failed: number;
    target_type: TargetType;
    target_brand_id?: string;
    target_group_id?: string;
    target_contact_id?: string;

    // Expanded Fields for UI Display
    from_brand_name?: string;
    target_group_name?: string;
    target_brand_name?: string;
    target_contact_name?: string;
}

export interface CreateCampaignRequest {
    name?: string;
    message_body: string;
    from_brand_id: string;
    target_type: TargetType;
    scheduled_at?: string | null;
    target_brand_id?: string;
    target_group_id?: string;
    target_contact_id?: string;
}

export interface ExecuteCampaignResponse {
    status: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * List all campaigns.
 */
export async function getCampaigns(skip: number = 0, limit: number = 100): Promise<CampaignResponse[]> {
    return api.get<CampaignResponse[]>('/campaigns', {
        params: { skip, limit }
    });
}

/**
 * Get a specific campaign by ID.
 */
export async function getCampaign(id: string): Promise<CampaignResponse> {
    return api.get<CampaignResponse>(`/campaigns/${id}`);
}

/**
 * Create a new campaign.
 */
export async function createCampaign(data: CreateCampaignRequest): Promise<CampaignResponse> {
    return api.post<CampaignResponse>('/campaigns', data);
}

/**
 * Execute a pending campaign immediately.
 */
export async function executeCampaign(id: string): Promise<ExecuteCampaignResponse> {
    return api.post<ExecuteCampaignResponse>(`/campaigns/${id}/execute`, {});
}

/**
 * Get conversations for a campaign.
 */
export async function getCampaignConversations(id: string): Promise<any[]> {
    return api.get<any[]>(`/campaigns/${id}/conversations`);
}

/**
 * Campaigns API object.
 */
export const campaignsApi = {
    getCampaigns,
    getCampaign,
    createCampaign,
    executeCampaign,
    getCampaignConversations
};
