/**
 * Brands Store
 * =============
 * Manages the state for brands in the application.
 * 
 * A brand represents a business identity with its own Twilio phone number.
 * Users can switch between brands to send messages from different numbers.
 * 
 * This store handles:
 * - Loading brands from the API
 * - Tracking the currently selected brand
 * - CRUD operations for brands
 * - Brand contacts management
 * 
 * Usage:
 *   import { 
 *     brandsStore, 
 *     selectedBrand,
 *     loadBrands,
 *     selectBrand 
 *   } from '$lib/stores/brandsStore';
 *   
 *   // Load brands on mount
 *   await loadBrands();
 *   
 *   // Select a brand
 *   selectBrand('brand-uuid');
 *   
 *   // Access selected brand reactively
 *   $: currentBrand = $selectedBrand;
 */

import { writable, derived, get } from 'svelte/store';
import { brandsApi, type BrandResponse, type BrandCreateRequest, type BrandUpdateRequest, type BrandContactResponse } from '../api/brands';

// =============================================================================
// Types
// =============================================================================

/**
 * Represents a brand in the application.
 * Extends the API response with any client-side properties.
 */
export interface Brand {
    /** Unique brand ID (UUID) */
    id: string;

    /** Brand name */
    name: string;

    /** Twilio phone number in E.164 format */
    phoneNumber: string;

    /** Whether the brand is active */
    isActive: boolean;

    /** Creation timestamp */
    createdAt: Date;

    /** Last update timestamp */
    updatedAt: Date;
}

/**
 * Contact associated with a brand.
 */
export interface BrandContact {
    /** Unique contact ID */
    id: string;

    /** Phone number */
    phoneNumber: string;

    /** Display name (optional) */
    name: string | null;

    /** Creation timestamp */
    createdAt: Date;
}

/**
 * Shape of the brands store state.
 */
export interface BrandsState {
    /** Array of all brands */
    brands: Brand[];

    /** ID of the currently selected brand */
    selectedBrandId: string | null;

    /** Whether brands are being loaded */
    isLoading: boolean;

    /** Error message if loading/operation failed */
    error: string | null;

    /** Contacts for the selected brand */
    contacts: BrandContact[];

    /** Whether contacts are being loaded */
    isLoadingContacts: boolean;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: BrandsState = {
    brands: [],
    selectedBrandId: null,
    isLoading: false,
    error: null,
    contacts: [],
    isLoadingContacts: false
};

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create the brands store with custom methods.
 */
function createBrandsStore() {
    const { subscribe, set, update } = writable<BrandsState>(initialState);

    return {
        subscribe,

        /**
         * Set loading state to true.
         */
        setLoading: () => {
            update(state => ({
                ...state,
                isLoading: true,
                error: null
            }));
        },

        /**
         * Set the brands list after successful API load.
         */
        setBrands: (brands: Brand[]) => {
            update(state => ({
                ...state,
                brands,
                isLoading: false,
                error: null
            }));
        },

        /**
         * Set an error message.
         */
        setError: (error: string) => {
            update(state => ({
                ...state,
                isLoading: false,
                error
            }));
        },

        /**
         * Set the selected brand ID.
         * Also clears contacts when switching brands.
         */
        setSelectedBrandId: (brandId: string | null) => {
            update(state => ({
                ...state,
                selectedBrandId: brandId,
                contacts: [], // Clear contacts when switching brands
                isLoadingContacts: false
            }));
        },

        /**
         * Add a new brand to the list.
         */
        addBrand: (brand: Brand) => {
            update(state => ({
                ...state,
                brands: [brand, ...state.brands]
            }));
        },

        /**
         * Update an existing brand.
         */
        updateBrand: (brandId: string, updates: Partial<Brand>) => {
            update(state => ({
                ...state,
                brands: state.brands.map(b =>
                    b.id === brandId ? { ...b, ...updates } : b
                )
            }));
        },

        /**
         * Remove a brand from the list.
         */
        removeBrand: (brandId: string) => {
            update(state => ({
                ...state,
                brands: state.brands.filter(b => b.id !== brandId),
                // Clear selection if deleted brand was selected
                selectedBrandId: state.selectedBrandId === brandId ? null : state.selectedBrandId
            }));
        },

        /**
         * Set contacts loading state.
         */
        setLoadingContacts: (loading: boolean) => {
            update(state => ({
                ...state,
                isLoadingContacts: loading
            }));
        },

        /**
         * Set contacts for the selected brand.
         */
        setContacts: (contacts: BrandContact[]) => {
            update(state => ({
                ...state,
                contacts,
                isLoadingContacts: false
            }));
        },

        /**
         * Add a contact to the current brand's contact list.
         */
        addContact: (contact: BrandContact) => {
            update(state => ({
                ...state,
                contacts: [contact, ...state.contacts]
            }));
        },

        /**
         * Remove a contact from the current brand's contact list.
         */
        removeContact: (contactId: string) => {
            update(state => ({
                ...state,
                contacts: state.contacts.filter(c => c.id !== contactId)
            }));
        },

        /**
         * Reset the store to initial state.
         */
        reset: () => {
            set(initialState);
        }
    };
}

// =============================================================================
// Exported Store Instances
// =============================================================================

/**
 * The singleton brands store instance.
 */
export const brandsStore = createBrandsStore();

// =============================================================================
// Derived Stores
// =============================================================================

/**
 * Derived store for the currently selected brand.
 */
export const selectedBrand = derived(
    brandsStore,
    $store => {
        if (!$store.selectedBrandId) return null;
        return $store.brands.find(b => b.id === $store.selectedBrandId) || null;
    }
);

/**
 * Derived store for just the brands array.
 */
export const brands = derived(
    brandsStore,
    $store => $store.brands
);

/**
 * Derived store for the selected brand's contacts.
 */
export const brandContacts = derived(
    brandsStore,
    $store => $store.contacts
);

/**
 * Derived store for whether brands or contacts are loading.
 */
export const isLoadingBrands = derived(
    brandsStore,
    $store => $store.isLoading
);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Transform API response to our store format.
 */
function transformBrand(response: BrandResponse): Brand {
    return {
        id: response.id,
        name: response.name,
        phoneNumber: response.phone_number,
        isActive: response.is_active,
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.updated_at)
    };
}

/**
 * Transform contact API response to store format.
 */
function transformContact(response: BrandContactResponse): BrandContact {
    return {
        id: response.id,
        phoneNumber: response.phone_number,
        name: response.name,
        createdAt: new Date(response.created_at)
    };
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Load all brands from the API.
 */
export async function loadBrands(): Promise<void> {
    brandsStore.setLoading();

    try {
        const data = await brandsApi.listBrands();
        const brands = data.map(transformBrand);
        brandsStore.setBrands(brands);

        // Auto-select first brand if none selected
        const state = get(brandsStore);
        if (!state.selectedBrandId && brands.length > 0) {
            brandsStore.setSelectedBrandId(brands[0].id);
        }
    } catch (error) {
        console.error('[BrandsStore] Failed to load brands:', error);
        brandsStore.setError(
            error instanceof Error ? error.message : 'Failed to load brands'
        );
    }
}

/**
 * Select a brand by ID.
 */
export function selectBrand(brandId: string | null): void {
    brandsStore.setSelectedBrandId(brandId);

    // Load contacts for the selected brand
    if (brandId) {
        loadBrandContacts(brandId);
    }
}

/**
 * Create a new brand.
 */
export async function createBrand(data: BrandCreateRequest): Promise<Brand | null> {
    try {
        const response = await brandsApi.createBrand(data);
        const brand = transformBrand(response);
        brandsStore.addBrand(brand);
        return brand;
    } catch (error) {
        console.error('[BrandsStore] Failed to create brand:', error);
        throw error;
    }
}

/**
 * Update an existing brand.
 */
export async function updateBrand(brandId: string, data: BrandUpdateRequest): Promise<Brand | null> {
    try {
        const response = await brandsApi.updateBrand(brandId, data);
        const brand = transformBrand(response);
        brandsStore.updateBrand(brandId, brand);
        return brand;
    } catch (error) {
        console.error('[BrandsStore] Failed to update brand:', error);
        throw error;
    }
}

/**
 * Delete a brand.
 */
export async function deleteBrand(brandId: string): Promise<void> {
    try {
        await brandsApi.deleteBrand(brandId);
        brandsStore.removeBrand(brandId);
    } catch (error) {
        console.error('[BrandsStore] Failed to delete brand:', error);
        throw error;
    }
}

/**
 * Load contacts for a brand.
 */
export async function loadBrandContacts(brandId: string): Promise<void> {
    brandsStore.setLoadingContacts(true);

    try {
        const data = await brandsApi.getBrandContacts(brandId);
        const contacts = data.map(transformContact);
        brandsStore.setContacts(contacts);
    } catch (error) {
        console.error('[BrandsStore] Failed to load contacts:', error);
        brandsStore.setContacts([]);
    }
}
