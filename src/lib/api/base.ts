/**
 * Base API Client
 * ================
 * A reusable HTTP client for making API requests.
 * 
 * This module provides:
 * - A generic ApiClient class with typed methods
 * - Automatic JSON serialization/deserialization
 * - Error handling with descriptive messages
 * - Support for GET, POST, PUT, DELETE methods
 * 
 * Note: For specific API endpoints, use the dedicated API modules:
 * - messagesApi for message operations
 * - conversationsApi for conversation operations
 * 
 * Usage:
 *   import { api } from '$lib/api/base';
 *   
 *   // Make a GET request
 *   const data = await api.get<ResponseType>('/endpoint');
 *   
 *   // Make a POST request
 *   const result = await api.post<ResponseType>('/endpoint', { body: 'data' });
 */

import { config } from '../config';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for API requests.
 * Extends the standard RequestInit with additional options.
 */
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
    /** Query parameters to append to the URL */
    params?: Record<string, string | number | boolean>;
}

/**
 * Standard error response structure from the API.
 */
export interface ApiErrorResponse {
    success: boolean;
    error: string;
    error_code?: string;
    detail?: string;
}

// =============================================================================
// API Client Class
// =============================================================================

/**
 * Generic API client for making HTTP requests.
 * 
 * Provides typed methods for common HTTP verbs with automatic
 * JSON handling and error processing.
 */
class ApiClient {
    /** Base URL for all API requests */
    private baseUrl: string;

    /**
     * Create a new API client instance.
     * 
     * @param baseUrl - Base URL for all requests
     */
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Build a URL with query parameters.
     * 
     * @param endpoint - API endpoint path
     * @param params - Optional query parameters
     * @returns Complete URL string
     */
    private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
        const url = `${this.baseUrl}${endpoint}`;

        if (!params || Object.keys(params).length === 0) {
            return url;
        }

        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            searchParams.append(key, String(value));
        }

        return `${url}?${searchParams.toString()}`;
    }

    /**
     * Make an HTTP request with error handling.
     * 
     * @param endpoint - API endpoint (relative to base URL)
     * @param options - Request options including method and headers
     * @returns Parsed JSON response
     * @throws Error with descriptive message on failure
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit & { params?: Record<string, string | number | boolean> } = {}
    ): Promise<T> {
        const { params, ...fetchOptions } = options;
        const url = this.buildUrl(endpoint, params);

        // Get auth token from localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('sms_auth_token')
            : null;

        // Set default headers for JSON, including auth if available
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...fetchOptions.headers,
        };

        console.log(`[ApiClient] ${fetchOptions.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers
            });

            // Try to parse the response as JSON
            let data: any;
            try {
                data = await response.json();
            } catch {
                // If JSON parsing fails, use status text
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.statusText}`);
                }
                return {} as T;
            }

            // Check for error responses
            if (!response.ok) {
                // Extract error message from various response formats
                const errorMessage =
                    data.detail?.error ||
                    data.detail ||
                    data.error ||
                    data.message ||
                    `Request failed with status ${response.status}`;

                console.error(`[ApiClient] Error response:`, data);
                throw new Error(errorMessage);
            }

            return data as T;
        } catch (error) {
            // Handle network errors
            if (error instanceof TypeError) {
                console.error('[ApiClient] Network error:', error);
                throw new Error('Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
    }

    /**
     * Make a GET request.
     * 
     * @param endpoint - API endpoint
     * @param options - Optional request options
     * @returns Parsed response data
     */
    get<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'GET'
        });
    }

    /**
     * Make a POST request.
     * 
     * @param endpoint - API endpoint
     * @param body - Request body (will be JSON stringified)
     * @param options - Optional request options
     * @returns Parsed response data
     */
    post<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * Make a PUT request.
     * 
     * @param endpoint - API endpoint
     * @param body - Request body (will be JSON stringified)
     * @param options - Optional request options
     * @returns Parsed response data
     */
    put<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    /**
     * Make a DELETE request.
     * 
     * @param endpoint - API endpoint
     * @param options - Optional request options
     * @returns Parsed response data
     */
    delete<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }

    /**
     * Make a PATCH request.
     * 
     * @param endpoint - API endpoint
     * @param body - Request body (will be JSON stringified)
     * @param options - Optional request options
     * @returns Parsed response data
     */
    patch<T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }
}

// =============================================================================
// Exported Instance
// =============================================================================

/**
 * Default API client instance configured with the application's API URL.
 * Use this for general API requests. For specific endpoints, prefer the
 * dedicated API modules (messagesApi, conversationsApi).
 */
export const api = new ApiClient(config.apiUrl);
