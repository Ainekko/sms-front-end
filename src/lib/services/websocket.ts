/**
 * WebSocket Service
 * ==================
 * Manages WebSocket connection for real-time messaging updates.
 * 
 * This service:
 * - Connects to the backend WebSocket at ws://server/ws/{client_id}
 * - Handles connection lifecycle (connect, disconnect, reconnect)
 * - Processes incoming messages and dispatches to appropriate stores
 * - Provides auto-reconnection with exponential backoff
 * 
 * Message Types Handled:
 * - 'connected' - Server confirms connection
 * - 'new_message' - New message sent or received
 * - 'message_status' - Message delivery status update
 * - 'conversation_update' - Conversation list changed
 * 
 * Usage:
 *   import { webSocketService } from '$lib/services/websocket';
 *   
 *   // Connect on app mount
 *   webSocketService.connect();
 *   
 *   // Disconnect on app unmount
 *   webSocketService.disconnect();
 */

import { config, getOrCreateClientId } from '../config';
import { connectionStore, ConnectionStatus } from '../stores/connectionStore';
import { conversationsStore } from '../stores/conversationsStore';
import { addReceivedMessage, updateStatus } from '../stores/messagesStore';
import { showToast } from '../stores/uiStore';

// =============================================================================
// Types
// =============================================================================

/**
 * Types of messages received from the WebSocket server.
 * These match the WSMessageType enum in the backend.
 */
export enum WSMessageType {
    /** Server confirms connection established */
    CONNECTED = 'connected',

    /** New SMS message sent or received */
    NEW_MESSAGE = 'new_message',

    /** Message delivery status changed */
    MESSAGE_STATUS = 'message_status',

    /** Client disconnected (not typically received) */
    DISCONNECTED = 'disconnected',

    /** Server error occurred */
    ERROR = 'error',

    /** Conversation list updated */
    CONVERSATION_UPDATE = 'conversation_update'
}

/**
 * Shape of messages received from WebSocket.
 */
interface WSMessage {
    /** Type of the message */
    type: WSMessageType | string;

    /** Message data (varies by type) */
    message?: any;

    /** Timestamp from server */
    timestamp?: string;

    /** Twilio SID (for status updates) */
    twilio_sid?: string;

    /** Status value (for status updates) */
    status?: string;

    /** Client ID (for connected message) */
    client_id?: string;

    /** Error info (for error messages) */
    error_code?: string;
    error_message?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Initial delay before attempting to reconnect (1 second) */
const INITIAL_RECONNECT_DELAY = 1000;

/** Maximum delay between reconnect attempts (30 seconds) */
const MAX_RECONNECT_DELAY = 30000;

/** Maximum number of reconnection attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 10;

// =============================================================================
// WebSocket Service Class
// =============================================================================

/**
 * WebSocket service for real-time communication with the backend.
 * 
 * This class manages a single WebSocket connection and handles:
 * - Connection lifecycle (connect, disconnect, reconnect)
 * - Message parsing and dispatch to appropriate stores
 * - Automatic reconnection with exponential backoff
 * - Connection state updates to the connectionStore
 */
class WebSocketService {
    /** The active WebSocket connection, or null if not connected */
    private socket: WebSocket | null = null;

    /** Client ID used for this connection */
    private clientId: string | null = null;

    /** Timer for reconnection attempts */
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    /** Current reconnect delay (increases with each attempt) */
    private reconnectDelay: number = INITIAL_RECONNECT_DELAY;

    /** Number of reconnection attempts made */
    private reconnectAttempts: number = 0;

    /** Whether we should attempt to reconnect on disconnect */
    private shouldReconnect: boolean = true;

    /**
     * Connect to the WebSocket server.
     * 
     * Uses the client ID from session storage (or generates a new one).
     * Updates the connectionStore with the current connection state.
     * 
     * @returns Promise that resolves when connected or rejects on error
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Don't connect if already connected or connecting
            if (this.socket?.readyState === WebSocket.OPEN) {
                console.log('[WebSocket] Already connected');
                resolve();
                return;
            }

            if (this.socket?.readyState === WebSocket.CONNECTING) {
                console.log('[WebSocket] Connection in progress');
                resolve();
                return;
            }

            // Get or create client ID
            this.clientId = getOrCreateClientId();
            const wsUrl = config.getWsUrl(this.clientId);

            console.log(`[WebSocket] Connecting to ${wsUrl}...`);
            connectionStore.setConnecting();

            // Reset reconnect state
            this.shouldReconnect = true;

            try {
                // Create the WebSocket connection
                this.socket = new WebSocket(wsUrl);

                // Connection opened
                this.socket.onopen = () => {
                    console.log('[WebSocket] Connection established');
                    connectionStore.setConnected();

                    // Reset reconnect delay on successful connection
                    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
                    this.reconnectAttempts = 0;

                    resolve();
                };

                // Message received
                this.socket.onmessage = (event: MessageEvent) => {
                    this.handleMessage(event);
                };

                // Connection closed
                this.socket.onclose = (event: CloseEvent) => {
                    console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason}`);
                    connectionStore.setDisconnected();
                    this.socket = null;

                    // Attempt reconnection if not intentionally disconnected
                    if (this.shouldReconnect) {
                        this.scheduleReconnect();
                    }
                };

                // Connection error
                this.socket.onerror = (error: Event) => {
                    console.error('[WebSocket] Connection error:', error);
                    connectionStore.setError('Connection failed');
                    reject(new Error('WebSocket connection failed'));
                };

            } catch (error) {
                console.error('[WebSocket] Failed to create connection:', error);
                connectionStore.setError('Failed to create connection');
                reject(error);
            }
        });
    }

    /**
     * Disconnect from the WebSocket server.
     * 
     * Closes the connection gracefully and prevents auto-reconnection.
     */
    disconnect(): void {
        console.log('[WebSocket] Disconnecting...');

        // Prevent auto-reconnection
        this.shouldReconnect = false;

        // Clear any pending reconnect timer
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Close the socket if open
        if (this.socket) {
            this.socket.close(1000, 'Client disconnected');
            this.socket = null;
        }

        connectionStore.setDisconnected();
        console.log('[WebSocket] Disconnected');
    }

    /**
     * Send a message to the server via WebSocket.
     * 
     * Note: Currently the backend doesn't process client messages,
     * but this is here for future use (typing indicators, etc.).
     * 
     * @param data - Data to send (will be JSON stringified)
     * @returns boolean indicating if message was sent
     */
    send(data: any): boolean {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] Cannot send: not connected');
            return false;
        }

        try {
            this.socket.send(JSON.stringify(data));
            console.log('[WebSocket] Sent:', data);
            return true;
        } catch (error) {
            console.error('[WebSocket] Failed to send:', error);
            return false;
        }
    }

    /**
     * Check if currently connected.
     * 
     * @returns boolean indicating connection status
     */
    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    /**
     * Get the current client ID.
     * 
     * @returns The client ID or null if not connected
     */
    getClientId(): string | null {
        return this.clientId;
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    /**
     * Handle incoming WebSocket messages.
     * 
     * Parses the JSON message and dispatches to the appropriate handler
     * based on the message type.
     * 
     * @param event - The WebSocket message event
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const data: WSMessage = JSON.parse(event.data);
            console.log('[WebSocket] Received:', data);

            switch (data.type) {
                case WSMessageType.CONNECTED:
                    this.handleConnected(data);
                    break;

                case WSMessageType.NEW_MESSAGE:
                    this.handleNewMessage(data);
                    break;

                case WSMessageType.MESSAGE_STATUS:
                    this.handleMessageStatus(data);
                    break;

                case WSMessageType.CONVERSATION_UPDATE:
                    this.handleConversationUpdate(data);
                    break;

                case WSMessageType.ERROR:
                    this.handleError(data);
                    break;

                default:
                    console.warn('[WebSocket] Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
        }
    }

    /**
     * Handle 'connected' message from server.
     * This confirms the connection was established successfully.
     */
    private handleConnected(data: WSMessage): void {
        console.log('[WebSocket] Server confirmed connection:', data.message);
        // Connection is already marked as connected in onopen
    }

    /**
     * Handle 'new_message' message from server.
     * 
     * This is received when:
     * - We send an outbound message
     * - We receive an inbound message
     * 
     * Updates both the messages and conversations stores.
     */
    private handleNewMessage(data: WSMessage): void {
        if (!data.message) {
            console.warn('[WebSocket] new_message without message data');
            return;
        }

        const msg = data.message;
        console.log('[WebSocket] New message:', msg);

        // Add message to the messages store (if viewing this conversation)
        addReceivedMessage(msg);

        // Update the conversations store with the new message
        const phoneNumber = msg.direction === 'inbound'
            ? msg.from_number
            : msg.to_number;

        conversationsStore.upsertConversation(
            phoneNumber,
            msg.body,
            msg.direction
        );

        // Show notification for inbound messages
        if (msg.direction === 'inbound') {
            showToast(`New message from ${phoneNumber}`, 'info');
        }
    }

    /**
     * Handle 'message_status' message from server.
     * 
     * This is received when a message's delivery status changes
     * (e.g., queued -> sent -> delivered).
     */
    private handleMessageStatus(data: WSMessage): void {
        if (!data.twilio_sid || !data.status) {
            console.warn('[WebSocket] message_status missing required fields');
            return;
        }

        console.log(`[WebSocket] Status update: ${data.twilio_sid} -> ${data.status}`);

        // Update the message status in the store
        updateStatus(data.twilio_sid, data.status);

        // Show error notification for failed messages
        if (data.status === 'failed' || data.status === 'undelivered') {
            const errorMsg = data.error_message || 'Message delivery failed';
            showToast(errorMsg, 'error');
        }
    }

    /**
     * Handle 'conversation_update' message from server.
     * Currently a placeholder - could trigger a refresh of conversations.
     */
    private handleConversationUpdate(data: WSMessage): void {
        console.log('[WebSocket] Conversation update:', data);
        // TODO: Could trigger a refresh of conversations list
    }

    /**
     * Handle 'error' message from server.
     */
    private handleError(data: WSMessage): void {
        console.error('[WebSocket] Server error:', data);
        showToast(data.error_message || 'Server error occurred', 'error');
    }

    /**
     * Schedule a reconnection attempt with exponential backoff.
     */
    private scheduleReconnect(): void {
        // Check if we've exceeded max attempts
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[WebSocket] Max reconnection attempts reached');
            connectionStore.setError('Unable to connect after multiple attempts');
            showToast('Connection lost. Please refresh the page.', 'error');
            return;
        }

        this.reconnectAttempts++;
        console.log(
            `[WebSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} ` +
            `in ${this.reconnectDelay}ms`
        );

        // Clear any existing timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        // Schedule reconnection
        this.reconnectTimeout = setTimeout(() => {
            console.log('[WebSocket] Attempting to reconnect...');
            this.connect().catch(error => {
                console.error('[WebSocket] Reconnection failed:', error);
            });
        }, this.reconnectDelay);

        // Increase delay for next attempt (exponential backoff)
        this.reconnectDelay = Math.min(
            this.reconnectDelay * 2,
            MAX_RECONNECT_DELAY
        );
    }
}

// =============================================================================
// Exported Instance
// =============================================================================

/**
 * Singleton instance of the WebSocket service.
 * Import this to manage the WebSocket connection.
 */
export const webSocketService = new WebSocketService();
