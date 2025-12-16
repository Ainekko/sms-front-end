<script lang="ts">
  import { selectedConversation, addMessage } from '../stores/messages';
  import { webSocketService } from '../services/websocket';
  import MessageInput from './MessageInput.svelte';
  import { afterUpdate } from 'svelte';

  let chatContainer: HTMLElement;

  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  afterUpdate(() => {
    scrollToBottom();
  });

  function handleSendMessage(event: CustomEvent) {
    if ($selectedConversation) {
      const text = event.detail.text;
      addMessage($selectedConversation.id, text, 'brand');
      webSocketService.sendMessage(text);
    }
  }
</script>

<div class="flex flex-col h-full bg-gray-50">
  {#if $selectedConversation}
    <div class="flex-1 overflow-y-auto p-6 space-y-4" bind:this={chatContainer}>
      <div class="flex justify-center mb-4">
        <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          This conversation is with {$selectedConversation.user}
        </span>
      </div>

      {#each $selectedConversation.messages as message (message.id)}
        <div class="flex {message.sender === 'brand' ? 'justify-end' : 'justify-start'}">
          <div
            class="max-w-[70%] {message.sender === 'brand'
              ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl'
              : 'bg-white text-gray-800 border border-gray-200 rounded-r-2xl rounded-tl-2xl'} px-4 py-3 shadow-sm"
          >
            <p class="text-sm">{message.text}</p>
            <p class="text-[10px] mt-1 opacity-70 text-right">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      {/each}
    </div>
    <MessageInput on:send={handleSendMessage} />
  {:else}
    <div class="flex-1 flex items-center justify-center text-gray-400">
      <p>Select a conversation to start messaging</p>
    </div>
  {/if}
</div>
