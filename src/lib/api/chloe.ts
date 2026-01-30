/**
 * Chloe API Module
 * =================
 * API functions for Retell.ai call data.
 */

import { api } from './base';

// =============================================================================
// Types
// =============================================================================

export interface ChloeCall {
    id: string;
    call_id: string;
    agent_id: string | null;
    call_type: string | null;
    call_status?: string | null;
    from_number?: string | null;
    to_number?: string | null;
    direction?: string | null;
    start_timestamp?: number | null;
    end_timestamp?: number | null;
    duration_ms: number | null;
    transcript: string | null;
    call_summary: string | null;
    user_sentiment: string | null;
    call_successful: boolean | null;
    disconnection_reason: string | null;
    recording_url?: string | null;
    created_at: string;
    updated_at?: string | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * List all recorded calls, newest first.
 */
export async function listCalls(limit = 50, offset = 0): Promise<ChloeCall[]> {
    return api.get<ChloeCall[]>('/chloe/calls', {
        params: { limit, offset }
    });
}

/**
 * Get a specific call by Retell call_id.
 */
export async function getCall(callId: string): Promise<ChloeCall> {
    return api.get<ChloeCall>(`/chloe/calls/${callId}`);
}

export const chloeApi = {
    listCalls,
    getCall
};
