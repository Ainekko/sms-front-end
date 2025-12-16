import { addMessage } from '../stores/messages';
import { get } from 'svelte/store';
import { selectedConversationId } from '../stores/messages';

class WebSocketService {
    private socket: WebSocket | null = null;
    private isConnected: boolean = false;
    private mockInterval: any = null;

    connect(url: string) {
        console.log(`Connecting to WebSocket at ${url}...`);
        // Simulate connection delay
        setTimeout(() => {
            this.isConnected = true;
            console.log('WebSocket connected (simulated)');
            this.startMockIncomingMessages();
        }, 1000);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        this.isConnected = false;
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
        }
        console.log('WebSocket disconnected');
    }

    sendMessage(message: string) {
        console.log(`Sending message: ${message}`);
        // In a real app, this would be this.socket.send(JSON.stringify({ message }));
    }

    private startMockIncomingMessages() {
        // Simulate an incoming message every 30 seconds
        this.mockInterval = setInterval(() => {
            const currentId = get(selectedConversationId);
            if (currentId) {
                const mockResponses = [
                    "That's interesting, tell me more.",
                    "I see. Let me check that for you.",
                    "Could you please clarify?",
                    "Thanks for the info!",
                    "One moment please."
                ];
                const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                addMessage(currentId, randomResponse, 'user');
                console.log('Simulated incoming message received');
            }
        }, 15000);
    }
}

export const webSocketService = new WebSocketService();
