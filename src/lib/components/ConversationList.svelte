<script lang="ts">
    import { conversations, selectedConversationId } from '../stores/messages';
    import { formatDistanceToNow } from 'date-fns'; // You might need to install date-fns or use a simple formatter

    function selectConversation(id: string) {
        selectedConversationId.set(id);
    }

    function formatTime(date: Date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="flex flex-col h-full bg-white border-r border-gray-200 overflow-y-auto w-80">
    <div class="p-4 border-b border-gray-100">
        <h2 class="text-xl font-bold text-gray-800">Messages</h2>
    </div>
    <div class="flex-1">
        {#each $conversations as conversation (conversation.id)}
            <button
                class="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50
                {$selectedConversationId === conversation.id ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}"
                on:click={() => selectConversation(conversation.id)}
            >
                <div class="flex items-start space-x-3">
                    <img src={conversation.avatar} alt={conversation.user} class="w-10 h-10 rounded-full object-cover bg-gray-200" />
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-baseline">
                            <h3 class="text-sm font-semibold text-gray-900 truncate">{conversation.user}</h3>
                            <span class="text-xs text-gray-500">{formatTime(conversation.timestamp)}</span>
                        </div>
                        <p class="text-sm text-gray-600 truncate mt-1 {conversation.unreadCount > 0 ? 'font-medium text-gray-900' : ''}">
                            {conversation.lastMessage}
                        </p>
                    </div>
                </div>
            </button>
        {/each}
    </div>
</div>
