import { writable } from 'svelte/store';
import { config } from '../config';

function createWebSocketStore() {
    const { subscribe, set, update } = writable({
        connected: false,
        messages: [],
        error: null
    });

    let socket: WebSocket | null = null;

    return {
        subscribe,
        connect: () => {
            if (socket) return;

            socket = new WebSocket(config.wsUrl);

            socket.onopen = () => {
                update(state => ({ ...state, connected: true, error: null }));
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    update(state => ({ ...state, messages: [...state.messages, data] }));
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            socket.onclose = () => {
                update(state => ({ ...state, connected: false }));
                socket = null;
                // Reconnect logic could go here
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                update(state => ({ ...state, error }));
            };
        },
        disconnect: () => {
            if (socket) {
                socket.close();
                socket = null;
                update(state => ({ ...state, connected: false }));
            }
        },
        sendMessage: (message: any) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            } else {
                console.warn('WebSocket is not connected');
            }
        }
    };
}

export const wsStore = createWebSocketStore();
