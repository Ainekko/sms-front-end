/**
 * Connection Store
 * =================
 * Manages the WebSocket connection state for real-time updates.
 * 
 * This store tracks:
 * - Connection status (disconnected, connecting, connected, error)
 * - Error messages when connection fails
 * - Reconnection attempts count
 * 
 * Usage:
 *   import { connectionStore, ConnectionStatus } from '$lib/stores/connectionStore';
 *   
 *   // Subscribe to connection state
 *   $: isConnected = $connectionStore.status === ConnectionStatus.CONNECTED;
 *   
 *   // Update connection status
 *   connectionStore.setConnecting();
 *   connectionStore.setConnected();
 *   connectionStore.setError('Connection failed');
 */

import { writable, derived } from 'svelte/store';

// =============================================================================
// Types & Enums
// =============================================================================

/**
 * Possible states of the WebSocket connection.
 * Used to determine what UI feedback to show the user.
 */
export enum ConnectionStatus {
    /** Not connected to the server */
    DISCONNECTED = 'disconnected',

    /** Currently attempting to connect */
    CONNECTING = 'connecting',

    /** Successfully connected and ready */
    CONNECTED = 'connected',

    /** Connection failed or was lost */
    ERROR = 'error'
}

/**
 * Shape of the connection store state.
 */
export interface ConnectionState {
    /** Current connection status */
    status: ConnectionStatus;

    /** Error message if status is ERROR, null otherwise */
    errorMessage: string | null;

    /** Number of reconnection attempts made */
    reconnectAttempts: number;

    /** Timestamp of last successful connection */
    lastConnectedAt: Date | null;
}

// =============================================================================
// Initial State
// =============================================================================

/**
 * Default initial state for the connection store.
 * Starts in disconnected state with no errors.
 */
const initialState: ConnectionState = {
    status: ConnectionStatus.DISCONNECTED,
    errorMessage: null,
    reconnectAttempts: 0,
    lastConnectedAt: null
};

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create the connection store with custom methods.
 * 
 * This wraps Svelte's writable store with convenience methods
 * for updating connection state in a type-safe way.
 */
function createConnectionStore() {
    // Create the base writable store
    const { subscribe, set, update } = writable<ConnectionState>(initialState);

    return {
        // Expose the subscribe method for reactive access
        subscribe,

        /**
         * Set status to CONNECTING when initiating a connection.
         * Resets any previous error message.
         */
        setConnecting: () => {
            update(state => ({
                ...state,
                status: ConnectionStatus.CONNECTING,
                errorMessage: null
            }));
        },

        /**
         * Set status to CONNECTED when connection is established.
         * Records the connection timestamp and resets reconnect counter.
         */
        setConnected: () => {
            update(state => ({
                ...state,
                status: ConnectionStatus.CONNECTED,
                errorMessage: null,
                reconnectAttempts: 0,
                lastConnectedAt: new Date()
            }));
        },

        /**
         * Set status to DISCONNECTED when connection is closed gracefully.
         */
        setDisconnected: () => {
            update(state => ({
                ...state,
                status: ConnectionStatus.DISCONNECTED,
                errorMessage: null
            }));
        },

        /**
         * Set status to ERROR when connection fails.
         * Increments the reconnection attempt counter.
         * 
         * @param message - Human-readable error message to display
         */
        setError: (message: string) => {
            update(state => ({
                ...state,
                status: ConnectionStatus.ERROR,
                errorMessage: message,
                reconnectAttempts: state.reconnectAttempts + 1
            }));
        },

        /**
         * Reset the store to its initial state.
         * Useful when logging out or resetting the app.
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
 * The singleton connection store instance.
 * Import this in components to access connection state.
 */
export const connectionStore = createConnectionStore();

// =============================================================================
// Derived Stores
// =============================================================================

/**
 * Derived store that indicates if we're currently connected.
 * Use this for simple boolean checks in components.
 * 
 * Usage:
 *   import { isConnected } from '$lib/stores/connectionStore';
 *   {#if $isConnected}
 *     <span>Online</span>
 *   {/if}
 */
export const isConnected = derived(
    connectionStore,
    $connection => $connection.status === ConnectionStatus.CONNECTED
);

/**
 * Derived store that indicates if we're attempting to connect.
 */
export const isConnecting = derived(
    connectionStore,
    $connection => $connection.status === ConnectionStatus.CONNECTING
);

/**
 * Derived store that indicates if there's a connection error.
 */
export const hasConnectionError = derived(
    connectionStore,
    $connection => $connection.status === ConnectionStatus.ERROR
);
