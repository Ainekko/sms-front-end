/**
 * Authentication API Client
 * =========================
 * API client for authentication endpoints.
 * 
 * Endpoints:
 *   - POST /auth/login - Login and receive JWT token
 *   - GET /auth/me - Get current user info
 *   - POST /auth/register - Create a new user (admin only)
 *   - PUT /auth/promote/{user_id} - Promote user to admin
 *   - GET /auth/users - List all users (admin only)
 */

import { config } from '../config';
import type {
    LoginRequest,
    CreateUserRequest,
    TokenResponse,
    UserResponse,
    User
} from '../types/auth.types';

// =============================================================================
// Token Management
// =============================================================================

const TOKEN_KEY = 'sms_auth_token';

/**
 * Get the stored auth token.
 */
export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the auth token.
 */
export function setStoredToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear the stored auth token.
 */
export function clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
}

// =============================================================================
// Auth Headers
// =============================================================================

/**
 * Get headers with Authorization token if available.
 */
function getAuthHeaders(): HeadersInit {
    const token = getStoredToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Login with email and password.
 * Returns a JWT token on success.
 * 
 * Note: OAuth2 expects form-urlencoded data, not JSON.
 */
export async function login(email: string, password: string): Promise<TokenResponse> {
    const url = `${config.apiUrl}/auth/login`;

    // OAuth2 requires form-urlencoded format
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    console.log('[AuthAPI] Logging in:', email);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.detail || data.error || 'Login failed';
        console.error('[AuthAPI] Login error:', errorMessage);
        throw new Error(errorMessage);
    }

    console.log('[AuthAPI] Login successful');
    return data as TokenResponse;
}

/**
 * Get the current authenticated user.
 */
export async function getMe(): Promise<User> {
    const url = `${config.apiUrl}/auth/me`;

    console.log('[AuthAPI] Fetching current user');

    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        if (response.status === 401) {
            clearStoredToken();
            throw new Error('Session expired. Please login again.');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to get user info');
    }

    const data = await response.json();
    console.log('[AuthAPI] Current user:', data.email);
    return data as User;
}

/**
 * Create a new user (admin only).
 */
export async function createUser(request: CreateUserRequest): Promise<UserResponse> {
    const url = `${config.apiUrl}/auth/register`;

    console.log('[AuthAPI] Creating user:', request.email);

    const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.detail || data.error || 'Failed to create user';
        console.error('[AuthAPI] Create user error:', errorMessage);
        throw new Error(errorMessage);
    }

    console.log('[AuthAPI] User created:', data.email);
    return data as UserResponse;
}

/**
 * Promote a user to admin (admin only).
 */
export async function promoteUser(userId: string): Promise<UserResponse> {
    const url = `${config.apiUrl}/auth/promote/${userId}`;

    console.log('[AuthAPI] Promoting user:', userId);

    const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.detail || data.error || 'Failed to promote user';
        console.error('[AuthAPI] Promote error:', errorMessage);
        throw new Error(errorMessage);
    }

    console.log('[AuthAPI] User promoted:', data.email);
    return data as UserResponse;
}

/**
 * Get all users (admin only).
 * Note: This endpoint may need to be added to the backend.
 */
export async function getUsers(): Promise<User[]> {
    const url = `${config.apiUrl}/auth/users`;

    console.log('[AuthAPI] Fetching all users');

    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to fetch users');
    }

    const data = await response.json();
    console.log('[AuthAPI] Fetched users:', data.length);
    return data as User[];
}

/**
 * Auth API object for convenient access.
 */
export const authApi = {
    login,
    getMe,
    createUser,
    promoteUser,
    getUsers,
    getStoredToken,
    setStoredToken,
    clearStoredToken,
};
