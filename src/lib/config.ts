/**
 * Application Configuration
 * =========================
 * Central configuration for API endpoints and WebSocket connections.
 * 
 * Environment Variables (for production):
 * - VITE_API_BASE_URL: Base URL for the REST API
 * - VITE_WS_URL: Base URL for WebSocket connections
 */

// =============================================================================
// Configuration Object
// =============================================================================

export const config = {
    /**
     * Base URL for the REST API (without version prefix)
     * Loaded from VITE_API_BASE_URL environment variable
     * Example: 'http://localhost:8000' or 'http://127.0.0.1:5000'
     */
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',

    /**
     * API version prefix used for all REST endpoints
     * This is appended to apiBaseUrl for all API calls
     */
    apiVersion: '/api/v1',

    /**
     * Full API URL with version prefix
     * Use this for making API requests
     */
    get apiUrl(): string {
        return `${this.apiBaseUrl}${this.apiVersion}`;
    },

    /**
     * Base URL for WebSocket connections
     * Loaded from VITE_WS_BASE_URL environment variable
     * Client ID will be appended: ws://host/ws/{clientId}
     */
    wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:5000/ws',

    /**
     * Get the full WebSocket URL with client ID
     * @param clientId - Unique identifier for this WebSocket connection
     * @returns Full WebSocket URL with client ID
     */
    getWsUrl(clientId: string): string {
        return `${this.wsBaseUrl}/${clientId}`;
    }
};

// =============================================================================
// Client ID Generation
// =============================================================================

/**
 * Generate a unique client ID for WebSocket connections.
 * 
 * The client ID is used to identify this browser session on the server.
 * It's stored in sessionStorage so it persists across page reloads
 * but creates a new ID for new browser sessions.
 * 
 * @returns A unique client ID string
 */
export function getOrCreateClientId(): string {
    // Storage key for the client ID
    const STORAGE_KEY = 'sms_client_id';

    // Try to get existing client ID from sessionStorage
    if (typeof window !== 'undefined') {
        const existingId = sessionStorage.getItem(STORAGE_KEY);
        if (existingId) {
            return existingId;
        }

        // Generate a new client ID
        const newId = generateClientId();
        sessionStorage.setItem(STORAGE_KEY, newId);
        return newId;
    }

    // Fallback for SSR (server-side rendering)
    return generateClientId();
}

/**
 * Generate a random client ID string.
 * Format: 'client-{timestamp}-{random}'
 * 
 * @returns A randomly generated client ID
 */
function generateClientId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `client-${timestamp}-${randomPart}`;
}
