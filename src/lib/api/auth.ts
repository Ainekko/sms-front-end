/**
 * Authentication API Module
 * =========================
 * API functions for authentication using the central base client.
 * 
 * Note: Login uses form-urlencoded format (OAuth2 requirement),
 * so it has a custom implementation. Other endpoints use the base client.
 * 
 * Usage:
 *   import { authApi } from '$lib/api/auth';
 *   const token = await authApi.login('email@example.com', 'password');
 */

import { api } from './base';
import { config } from '../config';
import type {
    CreateUserRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    User
} from '../types/auth.types';

// =============================================================================
// Token Storage (centralized)
// =============================================================================

const TOKEN_KEY = 'sms_auth_token';

export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Login with email and password.
 * Note: Uses form-urlencoded format for OAuth2 compatibility.
 */
export async function login(email: string, password: string): Promise<TokenResponse> {
    const url = `${config.apiUrl}/auth/login`;

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    console.log('[AuthAPI] Logging in:', email);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || data.error || 'Login failed');
    }

    console.log('[AuthAPI] Login successful');
    return data as TokenResponse;
}

/**
 * Public signup — creates account and returns token for immediate login.
 */
export async function signup(email: string, password: string): Promise<SignupResponse> {
    const url = `${config.apiUrl}/auth/signup`;

    console.log('[AuthAPI] Signing up:', email);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || data.error || 'Signup failed');
    }

    console.log('[AuthAPI] Signup successful');
    return data as SignupResponse;
}

/**
 * Get the current authenticated user.
 */
export async function getMe(): Promise<User> {
    return api.get<User>('/auth/me');
}

/**
 * Create a new user (admin only).
 */
export async function createUser(request: CreateUserRequest): Promise<User> {
    return api.post<User>('/auth/register', request);
}



/**
 * Auth API object for convenient access.
 */
export const authApi = {
    login,
    signup,
    getMe,
    createUser,

    getStoredToken,
    setStoredToken,
    clearStoredToken,
};
