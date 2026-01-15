/**
 * Contacts API Module
 * ====================
 * API functions for contact management using the central base client.
 * 
 * Usage:
 *   import { contactsApi } from '$lib/api/contacts';
 *   const contact = await contactsApi.createContact({ phone_number: '+1234567890' });
 */

import { api } from './base';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

export interface ContactCreateRequest {
    phone_number: string;
    name?: string;
    last_name?: string;
    email?: string;
    brand_ids?: string[];
}

export interface ContactResponse {
    id: string;
    phone_number: string;
    name: string | null;
    last_name: string | null;
    email: string | null;
    created_at: string;
    updated_at: string;
    is_archived?: boolean;
}

export interface ContactBrandResponse {
    message: string;
}

// =============================================================================
// Bulk Import Types
// =============================================================================

export interface BulkContactImportRequest {
    csv_content: string;
    brand_ids?: string[];
    skip_duplicates?: boolean;
    group_id?: string;
    group_name?: string;
    /** Enable phone validation for imported contacts */
    validate_phones?: boolean;
    /** Skip Stage 3 (paid) reachability check - saves ~$0.005/number */
    skip_advanced_validation?: boolean;
}

export interface BulkContactImportError {
    row: number;
    error: string;
}

export interface BulkContactImportResponse {
    success: boolean;
    created_count: number;
    skipped_count: number;
    error_count: number;
    errors: BulkContactImportError[];
    contacts: ContactResponse[];
    group_id?: string;
    group_name?: string;
    /** Whether validation was queued for background processing */
    validation_queued?: boolean;
    /** Message about validation status, e.g., "Validation queued for 500 contacts" */
    validation_message?: string | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get all contacts for a specific brand.
 * 
 * @param brandId - Brand ID to fetch contacts for
 */
export async function getAllContacts(brandId: string): Promise<ContactResponse[]> {
    return api.get<ContactResponse[]>(`/brands/${brandId}/contacts`);
}

/**
 * Get a contact by phone number.
 * 
 * @param phoneNumber - Phone number to look up
 */
export async function getContactByPhone(phoneNumber: string): Promise<ContactResponse> {
    const encoded = encodeURIComponent(phoneNumber);
    return api.get<ContactResponse>(`/contacts/phone/${encoded}`);
}

/**
 * Create a new contact.
 */
export async function createContact(data: ContactCreateRequest): Promise<ContactResponse> {
    return api.post<ContactResponse>('/contacts', data);
}

/**
 * Get a single contact by ID.
 */
export async function getContact(contactId: string): Promise<ContactResponse> {
    return api.get<ContactResponse>(`/contacts/${contactId}`);
}

/**
 * Add a contact to a brand.
 */
export async function addContactToBrand(contactId: string, brandId: string): Promise<ContactBrandResponse> {
    return api.post<ContactBrandResponse>(`/contacts/${contactId}/brands/${brandId}`, {});
}

/**
 * Remove a contact from a brand.
 */
export async function removeContactFromBrand(contactId: string, brandId: string): Promise<void> {
    return api.delete(`/contacts/${contactId}/brands/${brandId}`);
}

/**
 * Bulk import contacts from CSV content.
 * 
 * @param data - Import request with CSV content and options
 * @returns Import response with counts and created contacts
 */
export async function bulkImportContacts(data: BulkContactImportRequest): Promise<BulkContactImportResponse> {
    return api.post<BulkContactImportResponse>('/contacts/bulk', data);
}

/**
 * Archive a contact.
 */
export async function archiveContact(contactId: string): Promise<void> {
    return api.post(`/contacts/${contactId}/archive`, {});
}

/**
 * Unarchive a contact.
 */
export async function unarchiveContact(contactId: string): Promise<void> {
    return api.post(`/contacts/${contactId}/unarchive`, {});
}

/**
 * Get all archived contacts.
 */
export async function getArchivedContacts(): Promise<ContactResponse[]> {
    return api.get<ContactResponse[]>('/contacts/archived');
}

/**
 * Bulk archive contacts.
 */
export async function bulkArchiveContacts(contactIds: string[]): Promise<{ message: string; count: number }> {
    return api.post<{ message: string; count: number }>('/contacts/bulk-archive', { contact_ids: contactIds });
}

/**
 * Contacts API object for convenient access.
 */
export const contactsApi = {
    getAllContacts,
    getContactByPhone,
    createContact,
    getContact,
    addContactToBrand,
    removeContactFromBrand,
    bulkImportContacts,
    archiveContact,
    unarchiveContact,
    getArchivedContacts,
    bulkArchiveContacts
};
