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

// Follow-up campaign exclusion filters
export interface ExclusionFilters {
    exclude_dnc: boolean;
    exclude_no_reply: boolean;
    exclude_failed_delivery: boolean;
    target_only_no_reply: boolean;
    exclude_priority_below?: number | null;
    excluded_count: number;
}

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

    // Follow-up campaign fields
    parent_campaign_id?: string | null;
    parent_campaign_name?: string | null;
    child_campaign_ids?: string[];
    exclusion_filters?: ExclusionFilters;
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
    allow_expensive_encoding?: boolean;
}

export interface ExecuteCampaignResponse {
    status: string;
}

export interface UpdateCampaignRequest {
    name?: string;
    message_body?: string;
    scheduled_at?: string | null;
    allow_expensive_encoding?: boolean;
}

// =============================================================================
// Message Validation Types
// =============================================================================

export interface MessageValidationRequest {
    message_body: string;
}

export interface MessageValidationResponse {
    is_valid: boolean;
    requires_override: boolean;
    encoding: 'GSM-7' | 'UCS-2';
    segment_count: number;
    char_count: number;
    warning_message: string | null;
    problematic_chars: string[];
    suggested_replacements: Record<string, string>;
    message_after_normalization: string | null;
}

export interface CampaignInsightsResponse {
    id: string;
    campaign_id: string;
    calculated_at: string;

    // Core delivery metrics
    total_recipients: number;
    total_sent: number;
    total_delivered: number;
    total_failed: number;

    // Engagement metrics
    total_replies: number;
    unique_responders: number;
    reply_rate: number; // 0.0 - 1.0
    avg_response_time_mins: number | null;

    // AI fields
    ai_summary: string | null;
    ai_sentiment_score: number | null;
    ai_insights_json: string | null;

    // Extended AI fields (from AI router)
    top_objections?: string[];
    top_interests?: string[];
    recommendations?: string[];
    priority_breakdown?: Record<string, number>;
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
 * Update a pending campaign.
 * Only campaigns with status 'pending' can be updated.
 */
export async function updateCampaign(id: string, data: UpdateCampaignRequest): Promise<CampaignResponse> {
    return api.patch<CampaignResponse>(`/campaigns/${id}`, data);
}

/**
 * Cancel a pending campaign.
 * Only campaigns with status 'pending' can be cancelled.
 */
export async function cancelCampaign(id: string): Promise<CampaignResponse> {
    return api.post<CampaignResponse>(`/campaigns/${id}/cancel`, {});
}

/**
 * Delete a pending or cancelled campaign.
 * Only campaigns with status 'pending' or 'cancelled' can be deleted.
 * Completed or processing campaigns are retained for audit purposes.
 */
export async function deleteCampaign(id: string): Promise<void> {
    return api.delete(`/campaigns/${id}`);
}

/**
 * Get conversations for a campaign.
 */
export async function getCampaignConversations(id: string): Promise<any[]> {
    return api.get<any[]>(`/campaigns/${id}/conversations`);
}

/**
 * Get insights/metrics for a campaign.
 */
export async function getCampaignInsights(id: string): Promise<CampaignInsightsResponse> {
    return api.get<CampaignInsightsResponse>(`/campaigns/${id}/insights`);
}

// =============================================================================
// Follow-up Campaign Types & Functions
// =============================================================================

export interface CreateFollowUpCampaignRequest {
    parent_campaign_id: string;
    name?: string;
    message_body: string;
    scheduled_at?: string | null;
    exclude_dnc: boolean;
    exclude_no_reply: boolean;
    exclude_failed_delivery: boolean;
    target_only_no_reply: boolean;
    exclude_priority_below?: number | null;
    allow_expensive_encoding?: boolean;
}

export interface FollowUpPreviewResponse {
    parent_campaign_id: string;
    parent_campaign_name: string;
    original_recipients: number;
    dnc_count: number;
    no_reply_count: number;
    failed_delivery_count: number;
    priority_breakdown: Record<string, number>;
    priority_excluded_count: number;
    remaining_after_exclusions: number;
}

/**
 * Get a preview of follow-up campaign audience with exclusions.
 */
export async function getFollowUpPreview(
    parentCampaignId: string,
    excludeDnc: boolean = true,
    excludeNoReply: boolean = false,
    excludeFailedDelivery: boolean = true,
    targetOnlyNoReply: boolean = false,
    excludePriorityBelow?: number
): Promise<FollowUpPreviewResponse> {
    const params: Record<string, any> = {
        exclude_dnc: excludeDnc,
        exclude_no_reply: excludeNoReply,
        exclude_failed_delivery: excludeFailedDelivery,
        target_only_no_reply: targetOnlyNoReply
    };
    if (excludePriorityBelow !== undefined) {
        params.exclude_priority_below = excludePriorityBelow;
    }
    return api.get<FollowUpPreviewResponse>(
        `/campaigns/${parentCampaignId}/follow-up/preview`,
        { params }
    );
}

/**
 * Create a follow-up campaign with exclusions.
 */
export async function createFollowUpCampaign(data: CreateFollowUpCampaignRequest): Promise<CampaignResponse> {
    return api.post<CampaignResponse>(`/campaigns/${data.parent_campaign_id}/follow-up`, data);
}

/**
 * Validate a message for SMS encoding.
 * Returns encoding info, segment count, and warnings for expensive characters.
 */
export async function validateMessage(messageBody: string): Promise<MessageValidationResponse> {
    return api.post<MessageValidationResponse>('/campaigns/validate-message', { message_body: messageBody });
}

/**
 * Campaigns API object.
 */
export const campaignsApi = {
    getCampaigns,
    getCampaign,
    createCampaign,
    executeCampaign,
    updateCampaign,
    cancelCampaign,
    deleteCampaign,
    getCampaignConversations,
    getCampaignInsights,
    getFollowUpPreview,
    createFollowUpCampaign,
    validateMessage
};

