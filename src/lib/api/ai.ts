/**
 * AI API Module
 * ==============
 * API functions for AI-powered insights on contacts, conversations, and campaigns.
 * 
 * Features:
 * - Contact AI insights (priority, sentiment, recommendations)
 * - Campaign AI insights (summary, objections, interests)
 * - AI-filtered contact lists (DNC, hot leads, priority)
 * 
 * Usage:
 *   import { aiApi, getDNCList, getHotLeads } from '$lib/api/ai';
 *   const dncList = await getDNCList(brandId);
 */

import { api } from './base';

// =============================================================================
// Types - Contact AI
// =============================================================================

/**
 * Full AI insights for a contact.
 */
export interface ContactAIInsightsResponse {
    contact_id: string;
    contact_name: string | null;
    phone_number: string;
    ai_priority: number | null;
    ai_do_not_contact: boolean;
    ai_last_analyzed: string | null;
    insights: {
        sentiment?: string;
        summary?: string;
        interest_indicators?: string[];
        recommended_action?: string;
        [key: string]: any;
    } | null;
}

/**
 * Contact with AI fields for list display.
 */
export interface ContactWithAI {
    id: string;
    phone_number: string;
    name: string | null;
    last_name: string | null;
    email: string | null;
    ai_priority: number | null;
    ai_do_not_contact: boolean;
    ai_last_analyzed: string | null;
    sentiment: string | null;
    summary: string | null;
}

/**
 * Summary of contacts by AI priority.
 */
export interface ContactListSummary {
    total_contacts: number;
    analyzed_contacts: number;
    priority_3_count: number;
    priority_2_count: number;
    priority_1_count: number;
    priority_0_count: number;
    do_not_contact_count: number;
}

/**
 * Filters for AI contact queries.
 */
export interface ContactAIFilters {
    brand_id?: string;
    priority?: number;
    include_dnc?: boolean;
    analyzed_only?: boolean;
    limit?: number;
    offset?: number;
}

// =============================================================================
// Types - Campaign AI
// =============================================================================

/**
 * Full AI insights for a campaign.
 */
export interface CampaignAIInsightsResponse {
    campaign_id: string;
    campaign_name: string | null;
    ai_summary: string | null;
    ai_sentiment_score: number | null;
    top_objections: string[];
    top_interests: string[];
    recommendations: string[];
    priority_breakdown: Record<string, number>;
    calculated_at: string | null;
}

/**
 * Campaign summary with AI preview.
 */
export interface CampaignAISummary {
    campaign_id: string;
    campaign_name: string;
    status: string;
    created_at: string | null;
    has_ai_analysis: boolean;
    ai_sentiment_score: number | null;
    ai_summary_preview: string | null;
}

// =============================================================================
// Types - DNC & Hot Leads
// =============================================================================

/**
 * Do-not-contact contact entry.
 */
export interface DNCContact {
    id: string;
    phone_number: string;
    name: string | null;
    reason: string | null;
    ai_last_analyzed: string | null;
}

/**
 * Hot lead (priority 3) contact entry.
 */
export interface HotLead {
    id: string;
    phone_number: string;
    name: string | null;
    email: string | null;
    interests: string[];
    recommendation: string | null;
    ai_last_analyzed: string | null;
}

/**
 * Contact by priority level.
 */
export interface PriorityContact {
    id: string;
    phone_number: string;
    name: string | null;
    email: string | null;
    ai_priority: number;
    ai_do_not_contact: boolean;
}

// =============================================================================
// Contact AI Endpoints
// =============================================================================

/**
 * Get AI insights for a specific contact.
 * 
 * @param contactId - Contact UUID
 */
export async function getContactAIInsights(contactId: string): Promise<ContactAIInsightsResponse> {
    return api.get<ContactAIInsightsResponse>(`/ai/contacts/${contactId}`);
}

/**
 * Get contacts with AI filtering.
 * 
 * @param filters - Optional filters (priority, include_dnc, analyzed_only)
 */
export async function getContactsWithAI(filters: ContactAIFilters = {}): Promise<ContactWithAI[]> {
    const params: Record<string, string | number | boolean> = {};
    
    if (filters.brand_id) params.brand_id = filters.brand_id;
    if (filters.priority !== undefined) params.priority = filters.priority;
    if (filters.include_dnc !== undefined) params.include_dnc = filters.include_dnc;
    if (filters.analyzed_only !== undefined) params.analyzed_only = filters.analyzed_only;
    if (filters.limit !== undefined) params.limit = filters.limit;
    if (filters.offset !== undefined) params.offset = filters.offset;
    
    return api.get<ContactWithAI[]>('/ai/contacts', { params });
}

/**
 * Get AI analysis summary for contacts.
 * 
 * @param brandId - Optional brand ID filter
 */
export async function getContactsAISummary(brandId?: string): Promise<ContactListSummary> {
    const params = brandId ? { brand_id: brandId } : {};
    return api.get<ContactListSummary>('/ai/contacts/summary', { params });
}

// =============================================================================
// Campaign AI Endpoints
// =============================================================================

/**
 * Get AI insights for a specific campaign.
 * 
 * @param campaignId - Campaign UUID
 */
export async function getCampaignAIInsights(campaignId: string): Promise<CampaignAIInsightsResponse> {
    return api.get<CampaignAIInsightsResponse>(`/ai/campaigns/${campaignId}`);
}

/**
 * Get AI insights summary for all campaigns.
 * 
 * @param analyzedOnly - Only show campaigns with AI analysis
 */
export async function getAllCampaignsAIInsights(analyzedOnly = true): Promise<CampaignAISummary[]> {
    return api.get<CampaignAISummary[]>('/ai/campaigns', { params: { analyzed_only: analyzedOnly } });
}

// =============================================================================
// Priority Lists Endpoints
// =============================================================================

/**
 * Get contacts by priority level.
 * 
 * Priority levels:
 * - 3: Very interested (hot leads)
 * - 2: Somewhat interested
 * - 1: No reply
 * - 0: Don't contact
 * 
 * @param priority - Priority level (0-3)
 * @param brandId - Optional brand ID filter
 * @param limit - Max contacts to return (default 100)
 */
export async function getContactsByPriority(
    priority: number, 
    brandId?: string,
    limit = 100
): Promise<PriorityContact[]> {
    const params: Record<string, string | number> = { limit };
    if (brandId) params.brand_id = brandId;
    
    return api.get<PriorityContact[]>(`/ai/priority/${priority}`, { params });
}

/**
 * Get do-not-contact list.
 * Contacts flagged by AI as should not be contacted.
 * 
 * @param brandId - Optional brand ID filter
 */
export async function getDNCList(brandId?: string): Promise<DNCContact[]> {
    const params = brandId ? { brand_id: brandId } : {};
    return api.get<DNCContact[]>('/ai/dnc-list', { params });
}

/**
 * Get hot leads (priority 3 contacts).
 * These are your most interested contacts - most likely to convert.
 * 
 * @param brandId - Optional brand ID filter
 * @param limit - Max leads to return (default 50)
 */
export async function getHotLeads(brandId?: string, limit = 50): Promise<HotLead[]> {
    const params: Record<string, string | number> = { limit };
    if (brandId) params.brand_id = brandId;
    
    return api.get<HotLead[]>('/ai/hot-leads', { params });
}

// =============================================================================
// Exported API Object
// =============================================================================

/**
 * AI API object for convenient access.
 */
export const aiApi = {
    // Contact AI
    getContactAIInsights,
    getContactsWithAI,
    getContactsAISummary,
    
    // Campaign AI
    getCampaignAIInsights,
    getAllCampaignsAIInsights,
    
    // Priority lists
    getContactsByPriority,
    getDNCList,
    getHotLeads,
};
