import { writable, derived } from 'svelte/store';

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'brand';
    timestamp: Date;
}

export interface Conversation {
    id: string;
    user: string;
    avatar: string;
    lastMessage: string;
    unreadCount: number;
    timestamp: Date;
    messages: Message[];
}

// Mock Data
const initialConversations: Conversation[] = [
    {
        id: '1',
        user: 'Alice Smith',
        avatar: 'https://i.pravatar.cc/150?u=alice',
        lastMessage: 'Hey, I have a question about my order.',
        unreadCount: 2,
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
        messages: [
            { id: 'm1', text: 'Hi Alice, how can we help you today?', sender: 'brand', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
            { id: 'm2', text: 'Hey, I have a question about my order.', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 5) }
        ]
    },
    {
        id: '2',
        user: 'Bob Jones',
        avatar: 'https://i.pravatar.cc/150?u=bob',
        lastMessage: 'Thanks for the help!',
        unreadCount: 0,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        messages: [
            { id: 'm3', text: 'Is this item in stock?', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25) },
            { id: 'm4', text: 'Yes, it is!', sender: 'brand', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.5) },
            { id: 'm5', text: 'Thanks for the help!', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) }
        ]
    },
    {
        id: '3',
        user: 'Charlie Day',
        avatar: 'https://i.pravatar.cc/150?u=charlie',
        lastMessage: 'When will you open?',
        unreadCount: 1,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        messages: [
            { id: 'm6', text: 'When will you open?', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 30) }
        ]
    }
];

export const conversations = writable<Conversation[]>(initialConversations);
export const selectedConversationId = writable<string | null>(initialConversations[0].id);

export const selectedConversation = derived(
    [conversations, selectedConversationId],
    ([$conversations, $selectedConversationId]) => {
        return $conversations.find(c => c.id === $selectedConversationId) || null;
    }
);

export const brandName = writable('Acme Corp');

export function addMessage(conversationId: string, text: string, sender: 'user' | 'brand') {
    conversations.update(all => {
        return all.map(c => {
            if (c.id === conversationId) {
                const newMessage: Message = {
                    id: Math.random().toString(36).substr(2, 9),
                    text,
                    sender,
                    timestamp: new Date()
                };
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastMessage: text,
                    timestamp: new Date(),
                    unreadCount: sender === 'user' ? c.unreadCount + 1 : c.unreadCount
                };
            }
            return c;
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });
}
