/**
 * Elio API Module
 * ================
 * API functions for MHR Elio Reddit leads data.
 */

import { api } from './base';

// =============================================================================
// Types
// =============================================================================

export interface ElioLead {
    id: string;
    link: string;
    date: string;
    date_iso: string;
    request_type: string | null;
    location: string | null;
    reply_method: string | null;
    subreddit: string | null;
    title: string | null;
    content_preview: string | null;
    author: string | null;
    score: number;
    num_comments: number;
    urgency_score: number;
    is_real_request: boolean;
    status: string;
    batch_id: string | null;
    created_at: string;
}

export interface ElioLeadListResponse {
    leads: ElioLead[];
    total: number;
    limit: number;
    offset: number;
}

export interface ListLeadsParams {
    limit?: number;
    offset?: number;
    subreddit?: string;
    status?: string;
    min_urgency?: number;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * List all leads with optional filtering and pagination.
 */
export async function listLeads(params: ListLeadsParams = {}): Promise<ElioLeadListResponse> {
    const queryParams: Record<string, string | number | boolean> = {};
    
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.offset !== undefined) queryParams.offset = params.offset;
    if (params.subreddit) queryParams.subreddit = params.subreddit;
    if (params.status) queryParams.status = params.status;
    if (params.min_urgency !== undefined) queryParams.min_urgency = params.min_urgency;
    
    return api.get<ElioLeadListResponse>('/elio/leads', { params: queryParams });
}

/**
 * Get a specific lead by ID.
 */
export async function getLead(leadId: string): Promise<ElioLead> {
    return api.get<ElioLead>(`/elio/leads/${leadId}`);
}

/**
 * Update a lead's status.
 * Valid statuses: new, contacted, converted, rejected
 */
export async function updateLeadStatus(leadId: string, status: string): Promise<ElioLead> {
    return api.patch<ElioLead>(`/elio/leads/${leadId}`, { status });
}

export const elioApi = {
    listLeads,
    getLead,
    updateLeadStatus
};
