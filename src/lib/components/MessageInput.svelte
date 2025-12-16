<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let messageText = '';

  function handleSend() {
    if (messageText.trim()) {
      dispatch('send', { text: messageText });
      messageText = '';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }
</script>

<div class="p-4 bg-white border-t border-gray-200">
  <div class="flex items-end space-x-2">
    <textarea
      class="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
      rows="1"
      placeholder="Type a message..."
      bind:value={messageText}
      on:keydown={handleKeydown}
    ></textarea>
    <button
      class="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={handleSend}
      disabled={!messageText.trim()}
    >
      Send
    </button>
  </div>
</div>
