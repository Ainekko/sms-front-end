/**
 * Contacts Store
 * ===============
 * Manages contact operations that are not brand-specific.
 * 
 * For brand-specific contacts, use the brandsStore which manages
 * contacts for the currently selected brand.
 * 
 * This store handles:
 * - Creating new contacts
 * - Adding/removing contacts from brands
 * 
 * Usage:
 *   import { 
 *     createContact,
 *     addContactToBrand,
 *     removeContactFromBrand
 *   } from '$lib/stores/contactsStore';
 *   
 *   // Create a contact and associate with brand
 *   const contact = await createContact({
 *     phone_number: '+1234567890',
 *     name: 'John Doe',
 *     brand_ids: ['brand-uuid']
 *   });
 */

import { writable, derived } from 'svelte/store';
import { contactsApi, type ContactCreateRequest, type ContactResponse } from '../api/contacts';
import { brandsStore, loadBrandContacts } from './brandsStore';
import { get } from 'svelte/store';

// =============================================================================
// Types
// =============================================================================

/**
 * Represents a contact in the application.
 */
export interface Contact {
    /** Unique contact ID (UUID) */
    id: string;

    /** Phone number in E.164 format */
    phoneNumber: string;

    /** Display name (optional) */
    name: string | null;

    /** Creation timestamp */
    createdAt: Date;

    /** Last update timestamp */
    updatedAt: Date;
}

/**
 * Shape of the contacts store state.
 */
export interface ContactsState {
    /** Whether an operation is in progress */
    isLoading: boolean;

    /** Error message if operation failed */
    error: string | null;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: ContactsState = {
    isLoading: false,
    error: null
};

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create the contacts store.
 */
function createContactsStore() {
    const { subscribe, set, update } = writable<ContactsState>(initialState);

    return {
        subscribe,

        /**
         * Set loading state.
         */
        setLoading: (loading: boolean) => {
            update(state => ({
                ...state,
                isLoading: loading,
                error: loading ? null : state.error
            }));
        },

        /**
         * Set error state.
         */
        setError: (error: string | null) => {
            update(state => ({
                ...state,
                isLoading: false,
                error
            }));
        },

        /**
         * Reset the store.
         */
        reset: () => {
            set(initialState);
        }
    };
}

// =============================================================================
// Exported Store Instance
// =============================================================================

/**
 * The singleton contacts store instance.
 */
export const contactsStore = createContactsStore();

// =============================================================================
// Derived Stores
// =============================================================================

/**
 * Derived store for loading state.
 */
export const isContactOperationLoading = derived(
    contactsStore,
    $store => $store.isLoading
);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Transform API response to our store format.
 */
function transformContact(response: ContactResponse): Contact {
    return {
        id: response.id,
        phoneNumber: response.phone_number,
        name: response.name,
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.updated_at)
    };
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Create a new contact.
 * 
 * Optionally associates the contact with brands at creation.
 * After creation, refreshes the contacts list for the selected brand.
 * 
 * @param data - Contact creation data
 * @returns The created contact
 */
export async function createContact(data: ContactCreateRequest): Promise<Contact> {
    contactsStore.setLoading(true);

    try {
        const response = await contactsApi.createContact(data);
        const contact = transformContact(response);

        // Refresh contacts for the selected brand if applicable
        const brandsState = get(brandsStore);
        if (brandsState.selectedBrandId && data.brand_ids?.includes(brandsState.selectedBrandId)) {
            await loadBrandContacts(brandsState.selectedBrandId);
        }

        contactsStore.setLoading(false);
        return contact;
    } catch (error) {
        console.error('[ContactsStore] Failed to create contact:', error);
        contactsStore.setError(
            error instanceof Error ? error.message : 'Failed to create contact'
        );
        throw error;
    }
}

/**
 * Add a contact to a brand.
 * 
 * @param contactId - UUID of the contact
 * @param brandId - UUID of the brand
 */
export async function addContactToBrand(contactId: string, brandId: string): Promise<void> {
    contactsStore.setLoading(true);

    try {
        await contactsApi.addContactToBrand(contactId, brandId);

        // Refresh contacts for the brand if it's currently selected
        const brandsState = get(brandsStore);
        if (brandsState.selectedBrandId === brandId) {
            await loadBrandContacts(brandId);
        }

        contactsStore.setLoading(false);
    } catch (error) {
        console.error('[ContactsStore] Failed to add contact to brand:', error);
        contactsStore.setError(
            error instanceof Error ? error.message : 'Failed to add contact to brand'
        );
        throw error;
    }
}

/**
 * Remove a contact from a brand.
 * 
 * @param contactId - UUID of the contact
 * @param brandId - UUID of the brand
 */
export async function removeContactFromBrand(contactId: string, brandId: string): Promise<void> {
    contactsStore.setLoading(true);

    try {
        await contactsApi.removeContactFromBrand(contactId, brandId);

        // Remove from local state if brand is currently selected
        const brandsState = get(brandsStore);
        if (brandsState.selectedBrandId === brandId) {
            brandsStore.removeContact(contactId);
        }

        contactsStore.setLoading(false);
    } catch (error) {
        console.error('[ContactsStore] Failed to remove contact from brand:', error);
        contactsStore.setError(
            error instanceof Error ? error.message : 'Failed to remove contact from brand'
        );
        throw error;
    }
}

/**
 * Get a contact by ID.
 * 
 * @param contactId - UUID of the contact
 * @returns The contact
 */
export async function getContact(contactId: string): Promise<Contact> {
    try {
        const response = await contactsApi.getContact(contactId);
        return transformContact(response);
    } catch (error) {
        console.error('[ContactsStore] Failed to get contact:', error);
        throw error;
    }
}
