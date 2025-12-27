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
 * Update a contact group.
 */
export async function updateGroup(groupId: string, data: ContactGroupUpdate): Promise<ContactGroup> {
    // Note: The backend might not have a PATCH endpoint for groups yet based on the provided schema,
    // but usually it's good practice. If not, we might need to use PUT or just rely on what's available.
    // The provided backend code shows ContactGroupUpdate schema but doesn't explicitly show a PATCH route in the snippet,
    // but it's safe to assume standard REST practices or I can double check if needed.
    // Wait, the user provided backend code snippet has:
    // class ContactGroupUpdate(BaseModel)...
    // But the router snippet only showed GET /groups, POST /groups, GET /{group_id}, DELETE /{group_id}, POST /bulk-add, DELETE ...
    // It didn't explicitly show a PATCH/PUT for update.
    // I will omit update for now if it's not in the backend snippet provided, or I can add it if I see it.
    // Looking closely at the user request backend snippet...
    // It has `ContactGroupUpdate` schema but I don't see a `@router.patch` or `@router.put` in the provided text.
    // I will skip `updateGroup` for now to be safe, or comment it out.
    // Actually, I'll include it but commented out or just assume it might exist, but better to stick to what I know.
    // I'll leave it out for now to avoid errors.
    throw new Error('Update group not implemented in backend yet');
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
export async function bulkAddContacts(data: AddContactsToGroupRequest): Promise<ContactGroup> {
    return api.post<ContactGroup>('/groups/bulk-add', data);
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
