/**
 * Contacts API Module
 * ====================
 * API functions for contact management operations.
 * 
 * This module provides:
 * - Create a contact via POST /api/v1/contacts
 * - Get a contact via GET /api/v1/contacts/{id}
 * - Add contact to brand via POST /api/v1/contacts/{id}/brands/{brandId}
 * - Remove contact from brand via DELETE /api/v1/contacts/{id}/brands/{brandId}
 * 
 * Usage:
 *   import { contactsApi } from '$lib/api/contacts';
 *   
 *   // Create a contact
 *   const contact = await contactsApi.createContact({
 *     phone_number: '+1234567890',
 *     name: 'John Doe',
 *     brand_ids: ['brand-uuid']
 *   });
 */

import { config } from '../config';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

/**
 * Request body for creating a contact.
 * Matches the FastAPI ContactCreateRequest schema.
 */
export interface ContactCreateRequest {
    /** Phone number in E.164 format */
    phone_number: string;

    /** Optional display name */
    name?: string;

    /** Optional list of brand IDs to associate with */
    brand_ids?: string[];
}

/**
 * Response from the contacts API.
 * Matches the FastAPI ContactResponse schema.
 */
export interface ContactResponse {
    /** Unique contact ID (UUID) */
    id: string;

    /** Contact phone number in E.164 format */
    phone_number: string;

    /** Optional display name */
    name: string | null;

    /** Creation timestamp (ISO format) */
    created_at: string;

    /** Last update timestamp (ISO format) */
    updated_at: string;
}

/**
 * Response for contact-brand association operations.
 */
export interface ContactBrandResponse {
    /** Success message */
    message: string;
}

// =============================================================================
// API Class
// =============================================================================

/**
 * Contacts API client class.
 * 
 * Encapsulates all contact-related API calls with proper typing
 * and error handling.
 */
class ContactsApiClient {
    /**
     * Base URL for the contacts API.
     * Includes the API version prefix.
     */
    private get baseUrl(): string {
        return `${config.apiUrl}/contacts`;
    }

    /**
     * Make a JSON API request with error handling.
     * 
     * @param endpoint - API endpoint (relative to contacts URL)
     * @param options - Fetch options
     * @returns Parsed JSON response
     * @throws Error with message from API on failure
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Get auth token from localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('sms_auth_token')
            : null;

        // Set default headers with auth
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        console.log(`[ContactsAPI] ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle 204 No Content (for DELETE)
            if (response.status === 204) {
                return {} as T;
            }

            // Parse response body
            const data = await response.json();

            // Check for errors
            if (!response.ok) {
                const errorMessage = data.detail?.error
                    || data.detail
                    || data.error
                    || `Request failed with status ${response.status}`;

                console.error(`[ContactsAPI] Error:`, data);
                throw new Error(errorMessage);
            }

            console.log(`[ContactsAPI] Response:`, data);
            return data as T;
        } catch (error) {
            if (error instanceof TypeError) {
                console.error(`[ContactsAPI] Network error:`, error);
                throw new Error('Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
    }

    /**
     * Create a new contact.
     * 
     * Optionally associates the contact with one or more brands at creation.
     * 
     * @param data - Contact creation data
     * @returns Promise resolving to the created contact
     * 
     * @example
     *   const contact = await contactsApi.createContact({
     *     phone_number: '+1234567890',
     *     name: 'John Doe',
     *     brand_ids: ['brand-uuid']
     *   });
     */
    async createContact(data: ContactCreateRequest): Promise<ContactResponse> {
        return this.request<ContactResponse>('', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Get a single contact by ID.
     * 
     * @param contactId - UUID of the contact
     * @returns Promise resolving to the contact
     * 
     * @example
     *   const contact = await contactsApi.getContact('uuid-here');
     */
    async getContact(contactId: string): Promise<ContactResponse> {
        return this.request<ContactResponse>(`/${contactId}`);
    }

    /**
     * Add a contact to a brand.
     * 
     * Creates an association between the contact and brand.
     * If the association already exists, returns a message indicating so.
     * 
     * @param contactId - UUID of the contact
     * @param brandId - UUID of the brand
     * @returns Promise resolving to success message
     * 
     * @example
     *   await contactsApi.addContactToBrand('contact-uuid', 'brand-uuid');
     */
    async addContactToBrand(contactId: string, brandId: string): Promise<ContactBrandResponse> {
        return this.request<ContactBrandResponse>(`/${contactId}/brands/${brandId}`, {
            method: 'POST'
        });
    }

    /**
     * Remove a contact from a brand.
     * 
     * Removes the association between the contact and brand.
     * The contact itself is not deleted.
     * 
     * @param contactId - UUID of the contact
     * @param brandId - UUID of the brand
     * @returns Promise that resolves when removed
     * 
     * @example
     *   await contactsApi.removeContactFromBrand('contact-uuid', 'brand-uuid');
     */
    async removeContactFromBrand(contactId: string, brandId: string): Promise<void> {
        await this.request<void>(`/${contactId}/brands/${brandId}`, {
            method: 'DELETE'
        });
    }
}

// =============================================================================
// Exported Instance
// =============================================================================

/**
 * Singleton instance of the Contacts API client.
 * Import this to make API calls.
 */
export const contactsApi = new ContactsApiClient();
