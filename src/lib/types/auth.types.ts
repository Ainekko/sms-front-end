/**
 * Authentication Types
 * ====================
 * TypeScript types for user authentication.
 * Matches the backend API schemas.
 */

// =============================================================================
// User Role Enum
// =============================================================================

export type UserRole = 'admin' | 'user';

// =============================================================================
// User Types
// =============================================================================

/**
 * User information returned from the API.
 */
export interface User {
    id: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

// =============================================================================
// Request Types
// =============================================================================

/**
 * Login request (sent as form data for OAuth2).
 */
export interface LoginRequest {
    username: string;  // email (OAuth2 uses 'username' field)
    password: string;
}

/**
 * Create user request (admin only).
 */
export interface CreateUserRequest {
    email: string;
    password: string;
    role?: UserRole;
}

// =============================================================================
// Response Types
// =============================================================================

/**
 * Token response from login.
 */
export interface TokenResponse {
    access_token: string;
    token_type: string;
}

/**
 * User response from API.
 */
export interface UserResponse {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

// =============================================================================
// Auth Store State
// =============================================================================

/**
 * State shape for the auth store.
 */
export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
}
