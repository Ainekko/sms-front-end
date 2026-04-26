/**
 * Authentication Store
 * ====================
 * Svelte store for managing authentication state.
 * 
 * Features:
 *   - User session management
 *   - Token persistence in localStorage
 *   - Login/logout actions
 *   - Auto-initialization from stored token
 */

import { writable, derived, get } from 'svelte/store';
import type { User, AuthState } from '../types/auth.types';
import {
    authApi,
    getStoredToken,
    setStoredToken,
    clearStoredToken
} from '../api/auth';

// =============================================================================
// Initial State
// =============================================================================

const initialState: AuthState = {
    user: null,
    token: null,
    isLoading: false,
    isInitialized: false,
    error: null,
};

// =============================================================================
// Store Creation
// =============================================================================

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,

        /**
         * Initialize the auth store from stored token.
         * Call this on app startup to restore the session.
         */
        async initialize(): Promise<void> {
            const token = getStoredToken();

            if (!token) {
                update(state => ({
                    ...state,
                    isInitialized: true,
                }));
                return;
            }

            update(state => ({
                ...state,
                token,
                isLoading: true,
            }));

            try {
                // Validate token by fetching user
                const user = await authApi.getMe();

                update(state => ({
                    ...state,
                    user,
                    isLoading: false,
                    isInitialized: true,
                    error: null,
                }));

                console.log('[AuthStore] Session restored for:', user.email);
            } catch (error) {
                // Token is invalid, clear it
                clearStoredToken();

                update(state => ({
                    ...state,
                    user: null,
                    token: null,
                    isLoading: false,
                    isInitialized: true,
                    error: null, // Don't show error for expired session
                }));

                console.log('[AuthStore] Session expired, cleared token');
            }
        },

        /**
         * Login with email and password.
         */
        async login(email: string, password: string): Promise<boolean> {
            update(state => ({
                ...state,
                isLoading: true,
                error: null,
            }));

            try {
                // Get token
                const tokenResponse = await authApi.login(email, password);
                const token = tokenResponse.access_token;

                // Store token
                setStoredToken(token);

                // Fetch user info
                const user = await authApi.getMe();

                update(state => ({
                    ...state,
                    user,
                    token,
                    isLoading: false,
                    isInitialized: true,
                    error: null,
                }));

                console.log('[AuthStore] Logged in as:', user.email);
                return true;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Login failed';

                update(state => ({
                    ...state,
                    isLoading: false,
                    error: message,
                }));

                console.error('[AuthStore] Login failed:', message);
                return false;
            }
        },

        /**
         * Signup with email and password (public self-registration).
         * Automatically logs in on success.
         */
        async signup(email: string, password: string): Promise<boolean> {
            update(state => ({
                ...state,
                isLoading: true,
                error: null,
            }));

            try {
                const response = await authApi.signup(email, password);
                const token = response.access_token;

                // Store token
                setStoredToken(token);

                update(state => ({
                    ...state,
                    user: response.user,
                    token,
                    isLoading: false,
                    isInitialized: true,
                    error: null,
                }));

                console.log('[AuthStore] Signed up as:', response.user.email);
                return true;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Signup failed';

                update(state => ({
                    ...state,
                    isLoading: false,
                    error: message,
                }));

                console.error('[AuthStore] Signup failed:', message);
                return false;
            }
        },

        /**
         * Logout the current user.
         */
        logout(): void {
            clearStoredToken();

            set({
                ...initialState,
                isInitialized: true,
            });

            console.log('[AuthStore] Logged out');
        },

        /**
         * Clear any error message.
         */
        clearError(): void {
            update(state => ({
                ...state,
                error: null,
            }));
        },

        /**
         * Refresh user data from the server.
         */
        async refreshUser(): Promise<void> {
            try {
                const user = await authApi.getMe();
                update(state => ({
                    ...state,
                    user,
                }));
            } catch (error) {
                // If refresh fails, logout
                this.logout();
            }
        },
    };
}

// =============================================================================
// Exported Store and Derived Values
// =============================================================================

/**
 * Main auth store instance.
 */
export const authStore = createAuthStore();

/**
 * Derived store: is the user authenticated?
 */
export const isAuthenticated = derived(
    authStore,
    $auth => $auth.user !== null && $auth.token !== null
);

/**
 * Derived store: is the user an admin?
 */
export const isAdmin = derived(
    authStore,
    $auth => $auth.user?.role === 'admin'
);

/**
 * Derived store: current user object.
 */
export const currentUser = derived(
    authStore,
    $auth => $auth.user
);

/**
 * Derived store: is auth loading?
 */
export const isAuthLoading = derived(
    authStore,
    $auth => $auth.isLoading
);

/**
 * Derived store: is auth initialized?
 */
export const isAuthInitialized = derived(
    authStore,
    $auth => $auth.isInitialized
);

/**
 * Derived store: current auth error.
 */
export const authError = derived(
    authStore,
    $auth => $auth.error
);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if user is authenticated (synchronous).
 */
export function checkAuth(): boolean {
    const state = get(authStore);
    return state.user !== null && state.token !== null;
}

/**
 * Check if user is admin (synchronous).
 */
export function checkAdmin(): boolean {
    const state = get(authStore);
    return state.user?.role === 'admin';
}
