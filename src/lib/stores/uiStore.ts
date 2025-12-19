/**
 * UI Store
 * =========
 * Manages global UI state that doesn't belong to specific domain stores.
 * 
 * This store handles:
 * - Global loading states
 * - Toast notifications
 * - Error messages
 * - Mobile sidebar visibility
 * 
 * Usage:
 *   import { uiStore, showToast, showError } from '$lib/stores/uiStore';
 *   
 *   // Show a success toast
 *   showToast('Message sent!', 'success');
 *   
 *   // Show an error
 *   showError('Failed to connect');
 */

import { writable, derived } from 'svelte/store';

// =============================================================================
// Types
// =============================================================================

/**
 * Types of toast notifications.
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Represents a toast notification.
 */
export interface Toast {
    /** Unique identifier for the toast */
    id: string;

    /** Message to display */
    message: string;

    /** Type determines the styling/icon */
    type: ToastType;

    /** Duration in milliseconds (0 = manual dismiss only) */
    duration: number;
}

/**
 * Shape of the UI store state.
 */
export interface UIState {
    /** Whether the mobile sidebar is open */
    isSidebarOpen: boolean;

    /** Whether the app is in a global loading state */
    isGlobalLoading: boolean;

    /** Global loading message to display */
    loadingMessage: string | null;

    /** Array of active toast notifications */
    toasts: Toast[];

    /** Global error message (shown in a banner) */
    globalError: string | null;
}

// =============================================================================
// Initial State
// =============================================================================

/**
 * Default initial state for the UI store.
 */
const initialState: UIState = {
    isSidebarOpen: false,
    isGlobalLoading: false,
    loadingMessage: null,
    toasts: [],
    globalError: null
};

// =============================================================================
// Constants
// =============================================================================

/** Default duration for toast notifications (5 seconds) */
const DEFAULT_TOAST_DURATION = 5000;

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create the UI store with custom methods.
 */
function createUIStore() {
    const { subscribe, set, update } = writable<UIState>(initialState);

    return {
        subscribe,

        /**
         * Toggle the mobile sidebar open/closed.
         */
        toggleSidebar: () => {
            update(state => ({
                ...state,
                isSidebarOpen: !state.isSidebarOpen
            }));
        },

        /**
         * Set the sidebar open state directly.
         * 
         * @param isOpen - Whether sidebar should be open
         */
        setSidebarOpen: (isOpen: boolean) => {
            update(state => ({
                ...state,
                isSidebarOpen: isOpen
            }));
        },

        /**
         * Set global loading state with optional message.
         * 
         * @param isLoading - Whether app is loading
         * @param message - Optional loading message to display
         */
        setGlobalLoading: (isLoading: boolean, message: string | null = null) => {
            update(state => ({
                ...state,
                isGlobalLoading: isLoading,
                loadingMessage: isLoading ? message : null
            }));
        },

        /**
         * Add a toast notification.
         * 
         * @param message - Message to display
         * @param type - Type of toast (info, success, warning, error)
         * @param duration - Duration in ms (0 = no auto-dismiss)
         * @returns The toast ID (for manual removal)
         */
        addToast: (
            message: string,
            type: ToastType = 'info',
            duration: number = DEFAULT_TOAST_DURATION
        ): string => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const toast: Toast = {
                id,
                message,
                type,
                duration
            };

            update(state => ({
                ...state,
                toasts: [...state.toasts, toast]
            }));

            // Auto-remove after duration (if duration > 0)
            if (duration > 0) {
                setTimeout(() => {
                    update(state => ({
                        ...state,
                        toasts: state.toasts.filter(t => t.id !== id)
                    }));
                }, duration);
            }

            return id;
        },

        /**
         * Remove a specific toast by ID.
         * 
         * @param id - Toast ID to remove
         */
        removeToast: (id: string) => {
            update(state => ({
                ...state,
                toasts: state.toasts.filter(t => t.id !== id)
            }));
        },

        /**
         * Clear all toasts.
         */
        clearToasts: () => {
            update(state => ({
                ...state,
                toasts: []
            }));
        },

        /**
         * Set a global error message (shown in a banner).
         * 
         * @param error - Error message to display (null to clear)
         */
        setGlobalError: (error: string | null) => {
            update(state => ({
                ...state,
                globalError: error
            }));
        },

        /**
         * Clear the global error.
         */
        clearGlobalError: () => {
            update(state => ({
                ...state,
                globalError: null
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
// Exported Store Instance
// =============================================================================

/**
 * The singleton UI store instance.
 */
export const uiStore = createUIStore();

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Show a toast notification.
 * Shorthand for uiStore.addToast.
 * 
 * @param message - Message to display
 * @param type - Type of toast (default: 'info')
 * @param duration - Duration in ms (default: 5000)
 * @returns Toast ID
 */
export function showToast(
    message: string,
    type: ToastType = 'info',
    duration: number = DEFAULT_TOAST_DURATION
): string {
    return uiStore.addToast(message, type, duration);
}

/**
 * Show a success toast.
 * 
 * @param message - Success message
 */
export function showSuccess(message: string): void {
    uiStore.addToast(message, 'success');
}

/**
 * Show an error toast.
 * 
 * @param message - Error message
 */
export function showError(message: string): void {
    uiStore.addToast(message, 'error');
}

/**
 * Show a warning toast.
 * 
 * @param message - Warning message
 */
export function showWarning(message: string): void {
    uiStore.addToast(message, 'warning');
}

// =============================================================================
// Derived Stores
// =============================================================================

/**
 * Derived store for checking if there are any toasts.
 */
export const hasToasts = derived(
    uiStore,
    $ui => $ui.toasts.length > 0
);

/**
 * Derived store for the current toasts.
 */
export const toasts = derived(
    uiStore,
    $ui => $ui.toasts
);

/**
 * Derived store for global error.
 */
export const globalError = derived(
    uiStore,
    $ui => $ui.globalError
);
