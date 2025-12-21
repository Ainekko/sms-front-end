/**
 * Brands API Module
 * ==================
 * API functions for brand management operations.
 * 
 * This module provides:
 * - List all brands via GET /api/v1/brands
 * - Get a single brand via GET /api/v1/brands/{id}
 * - Create a brand via POST /api/v1/brands
 * - Update a brand via PUT /api/v1/brands/{id}
 * - Delete a brand via DELETE /api/v1/brands/{id}
 * - Get brand contacts via GET /api/v1/brands/{id}/contacts
 * 
 * Usage:
 *   import { brandsApi } from '$lib/api/brands';
 *   
 *   // List all brands
 *   const brands = await brandsApi.listBrands();
 *   
 *   // Create a brand
 *   const newBrand = await brandsApi.createBrand({ name: 'Acme', phone_number: '+1234567890' });
 */

import { config } from '../config';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

/**
 * Request body for creating a brand.
 * Matches the FastAPI BrandCreateRequest schema.
 */
export interface BrandCreateRequest {
    /** Unique brand name */
    name: string;

    /** Twilio phone number in E.164 format */
    phone_number: string;

    /** Whether the brand is active (default: true) */
    is_active?: boolean;
}

/**
 * Request body for updating a brand.
 * All fields are optional - only provided fields will be updated.
 */
export interface BrandUpdateRequest {
    /** New brand name */
    name?: string;

    /** New phone number */
    phone_number?: string;

    /** Active status */
    is_active?: boolean;
}

/**
 * Response from the brands API.
 * Matches the FastAPI BrandResponse schema.
 */
export interface BrandResponse {
    /** Unique brand ID (UUID) */
    id: string;

    /** Brand name */
    name: string;

    /** Twilio phone number in E.164 format */
    phone_number: string;

    /** Whether the brand is active */
    is_active: boolean;

    /** Creation timestamp (ISO format) */
    created_at: string;

    /** Last update timestamp (ISO format) */
    updated_at: string;
}

/**
 * Contact associated with a brand.
 * Matches the FastAPI ContactResponse schema.
 */
export interface BrandContactResponse {
    /** Unique contact ID (UUID) */
    id: string;

    /** Contact phone number in E.164 format */
    phone_number: string;

    /** Optional display name */
    name: string | null;

    /** Creation timestamp (ISO format) */
    created_at: string;
}

// =============================================================================
// API Class
// =============================================================================

/**
 * Brands API client class.
 * 
 * Encapsulates all brand-related API calls with proper typing
 * and error handling.
 */
class BrandsApiClient {
    /**
     * Base URL for the brands API.
     * Includes the API version prefix.
     */
    private get baseUrl(): string {
        return `${config.apiUrl}/brands`;
    }

    /**
     * Make a JSON API request with error handling.
     * 
     * @param endpoint - API endpoint (relative to brands URL)
     * @param options - Fetch options
     * @returns Parsed JSON response
     * @throws Error with message from API on failure
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Set default headers
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        console.log(`[BrandsAPI] ${options.method || 'GET'} ${url}`);

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

                console.error(`[BrandsAPI] Error:`, data);
                throw new Error(errorMessage);
            }

            console.log(`[BrandsAPI] Response:`, data);
            return data as T;
        } catch (error) {
            if (error instanceof TypeError) {
                console.error(`[BrandsAPI] Network error:`, error);
                throw new Error('Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
    }

    /**
     * List all brands.
     * 
     * @param activeOnly - If true, only return active brands (default: true)
     * @returns Promise resolving to array of brands
     * 
     * @example
     *   const brands = await brandsApi.listBrands();
     *   brands.forEach(brand => console.log(brand.name));
     */
    async listBrands(activeOnly: boolean = true): Promise<BrandResponse[]> {
        const params = new URLSearchParams({ active_only: activeOnly.toString() });
        return this.request<BrandResponse[]>(`?${params}`);
    }

    /**
     * Get a single brand by ID.
     * 
     * @param brandId - UUID of the brand
     * @returns Promise resolving to the brand
     * 
     * @example
     *   const brand = await brandsApi.getBrand('uuid-here');
     */
    async getBrand(brandId: string): Promise<BrandResponse> {
        return this.request<BrandResponse>(`/${brandId}`);
    }

    /**
     * Create a new brand.
     * 
     * @param data - Brand creation data
     * @returns Promise resolving to the created brand
     * 
     * @example
     *   const brand = await brandsApi.createBrand({
     *     name: 'Acme Corp',
     *     phone_number: '+1234567890'
     *   });
     */
    async createBrand(data: BrandCreateRequest): Promise<BrandResponse> {
        return this.request<BrandResponse>('', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update an existing brand.
     * 
     * @param brandId - UUID of the brand to update
     * @param data - Fields to update
     * @returns Promise resolving to the updated brand
     * 
     * @example
     *   const updated = await brandsApi.updateBrand('uuid', { name: 'New Name' });
     */
    async updateBrand(brandId: string, data: BrandUpdateRequest): Promise<BrandResponse> {
        return this.request<BrandResponse>(`/${brandId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete a brand.
     * 
     * @param brandId - UUID of the brand to delete
     * @returns Promise that resolves when deleted
     * 
     * @example
     *   await brandsApi.deleteBrand('uuid-here');
     */
    async deleteBrand(brandId: string): Promise<void> {
        await this.request<void>(`/${brandId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get all contacts for a brand.
     * 
     * @param brandId - UUID of the brand
     * @returns Promise resolving to array of contacts
     * 
     * @example
     *   const contacts = await brandsApi.getBrandContacts('uuid');
     */
    async getBrandContacts(brandId: string): Promise<BrandContactResponse[]> {
        return this.request<BrandContactResponse[]>(`/${brandId}/contacts`);
    }
}

// =============================================================================
// Exported Instance
// =============================================================================

/**
 * Singleton instance of the Brands API client.
 * Import this to make API calls.
 */
export const brandsApi = new BrandsApiClient();
