/**
 * Brands API Module
 * ==================
 * API functions for brand management using the central base client.
 * 
 * Usage:
 *   import { brandsApi } from '$lib/api/brands';
 *   const brands = await brandsApi.listBrands();
 */

import { api } from './base';

// =============================================================================
// Types - API Request/Response Shapes
// =============================================================================

export interface BrandCreateRequest {
    name: string;
    phone_number: string;
    is_active?: boolean;
}

export interface BrandUpdateRequest {
    name?: string;
    phone_number?: string;
    is_active?: boolean;
}

export interface BrandResponse {
    id: string;
    name: string;
    phone_number: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BrandContactResponse {
    id: string;
    phone_number: string;
    name: string | null;
    created_at: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * List all brands.
 * @param activeOnly - If true, only return active brands (default: true)
 */
export async function listBrands(activeOnly: boolean = true): Promise<BrandResponse[]> {
    return api.get<BrandResponse[]>('/brands', { params: { active_only: activeOnly } });
}

/**
 * Get a single brand by ID.
 */
export async function getBrand(brandId: string): Promise<BrandResponse> {
    return api.get<BrandResponse>(`/brands/${brandId}`);
}

/**
 * Create a new brand.
 */
export async function createBrand(data: BrandCreateRequest): Promise<BrandResponse> {
    return api.post<BrandResponse>('/brands', data);
}

/**
 * Update an existing brand.
 */
export async function updateBrand(brandId: string, data: BrandUpdateRequest): Promise<BrandResponse> {
    return api.put<BrandResponse>(`/brands/${brandId}`, data);
}

/**
 * Delete a brand.
 */
export async function deleteBrand(brandId: string): Promise<void> {
    return api.delete(`/brands/${brandId}`);
}

/**
 * Get all contacts for a brand.
 */
export async function getBrandContacts(brandId: string): Promise<BrandContactResponse[]> {
    return api.get<BrandContactResponse[]>(`/brands/${brandId}/contacts`);
}

/**
 * Brands API object for convenient access.
 */
export const brandsApi = {
    listBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    getBrandContacts,
};
