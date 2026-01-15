/**
 * Groups API Module
 * =================
 * API functions for managing contact groups.
 */

import { api } from './base';
import { config } from '../config';

// =============================================================================
// Types
// =============================================================================

export interface ContactGroup {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    contact_count: number;
    /** Whether validation is enabled for this group */
    enable_validation?: boolean;
    /** Current validation status */
    validation_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
    /** Validation progress 0-100 */
    validation_progress?: number;
    /** Number of contacts that passed validation */
    valid_count?: number;
    /** Number of contacts that failed validation */
    invalid_count?: number;
    /** Number of contacts not yet validated */
    pending_count?: number;
}

export interface ContactGroupCreate {
    name: string;
    description?: string;
    /** Enable phone validation for contacts in this group */
    enable_validation?: boolean;
}

export interface ContactGroupUpdate {
    name?: string;
    description?: string;
}

export interface AddContactsToGroupRequest {
    group_id?: string;
    group_name?: string;
    contact_ids: string[];
}

/** Response from validation status endpoint */
export interface ValidationStatusResponse {
    group_id: string;
    validation_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
    progress: number;
    started_at: string | null;
    completed_at: string | null;
    total_contacts: number;
    valid_count: number;
    invalid_count: number;
    pending_count: number;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * List all contact groups.
 */
export async function listGroups(): Promise<ContactGroup[]> {
    return api.get<ContactGroup[]>('/groups');
}

/**
 * Create a new contact group.
 */
export async function createGroup(data: ContactGroupCreate): Promise<ContactGroup> {
    return api.post<ContactGroup>('/groups', data);
}

/**
 * Get a specific contact group by ID.
 */
export async function getGroup(groupId: string): Promise<ContactGroup> {
    return api.get<ContactGroup>(`/groups/${groupId}`);
}

/**
 * Delete a contact group.
 */
export async function deleteGroup(groupId: string): Promise<void> {
    return api.delete(`/groups/${groupId}`);
}

/**
 * Bulk add contacts to a group.
 */
export async function bulkAddContacts(data: AddContactsToGroupRequest): Promise<void> {
    return api.post('/groups/bulk-add-contacts', data);
}

/**
 * Remove a contact from a group.
 */
export async function removeContactFromGroup(groupId: string, contactId: string): Promise<void> {
    return api.delete(`/groups/${groupId}/contacts/${contactId}`);
}

/**
 * Get contacts for a specific group.
 */
export async function getGroupContacts(groupId: string): Promise<any[]> {
    // We assume the endpoint is /groups/{id}/contacts or similar.
    // Since we don't have the exact schema, we'll return any[] for now and refine it.
    // Actually, let's assume it returns a list of contacts similar to BrandContact.
    return api.get<any[]>(`/groups/${groupId}/contacts`);
}

/**
 * Start phone validation for all contacts in a group.
 * This runs as a background job.
 * @param groupId - The group to validate
 * @param skipStage3 - Skip the advanced reachability check (stage 3)
 * @param force - Force revalidation of all contacts (resets existing results)
 */
export async function startGroupValidation(
    groupId: string,
    skipStage3 = false,
    force = false
): Promise<{ message: string; status: string; group_id: string }> {
    return api.post(`/groups/${groupId}/validate?skip_stage3=${skipStage3}&force=${force}`, {});
}

/**
 * Get validation status and progress for a group.
 */
export async function getValidationStatus(groupId: string): Promise<ValidationStatusResponse> {
    return api.get<ValidationStatusResponse>(`/groups/${groupId}/validation-status`);
}

/**
 * Export group contacts as CSV with authentication.
 * Fetches the CSV data with proper auth headers and triggers a download.
 * @param groupId - The group to export
 * @param filter - Filter contacts by validation status
 */
export async function exportGroupContacts(
    groupId: string,
    filter: 'all' | 'valid' | 'invalid' | 'pending' = 'all'
): Promise<void> {
    const url = `${config.apiUrl}/groups/${groupId}/export?filter=${filter}`;

    // Get auth token from localStorage
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('sms_auth_token')
        : null;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `group_${groupId}_${filter}.csv`;
    if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (match) {
            filename = match[1];
        }
    }

    // Convert to blob and trigger download
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
}

export const groupsApi = {
    listGroups,
    createGroup,
    getGroup,
    deleteGroup,
    bulkAddContacts,
    removeContactFromGroup,
    getGroupContacts,
    startGroupValidation,
    getValidationStatus,
    exportGroupContacts
};
