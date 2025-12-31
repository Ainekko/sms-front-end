/**
 * Groups API Module
 * =================
 * API functions for managing contact groups.
 */

import { api } from './base';

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
}

export interface ContactGroupCreate {
    name: string;
    description?: string;
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

export const groupsApi = {
    listGroups,
    createGroup,
    getGroup,
    deleteGroup,
    bulkAddContacts,
    removeContactFromGroup,
    getGroupContacts
};
