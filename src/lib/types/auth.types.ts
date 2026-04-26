/**
 * Authentication Types
 * ====================
 * TypeScript types for user authentication.
 * Matches the backend API schemas.
 */

// =============================================================================
// Enums
// =============================================================================

export type UserRole = 'admin' | 'user';
export type PlanTier = 'free' | 'pro';

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
    plan: PlanTier;
    is_active: boolean;
    has_twilio: boolean;
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

/**
 * Signup request (public self-registration).
 */
export interface SignupRequest {
    email: string;
    password: string;
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
 * Signup response — includes user + token for immediate login.
 */
export interface SignupResponse {
    user: User;
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
    plan: string;
    is_active: boolean;
    has_twilio: boolean;
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
