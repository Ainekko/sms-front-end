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
    brand_ids?: string[];
}

export interface ContactResponse {
    id: string;
    phone_number: string;
    name: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContactBrandResponse {
    message: string;
}

// =============================================================================
// API Functions
// =============================================================================

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
 * Contacts API object for convenient access.
 */
export const contactsApi = {
    createContact,
    getContact,
    addContactToBrand,
    removeContactFromBrand,
};
