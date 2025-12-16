<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ConversationList from '$lib/components/ConversationList.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import BrandHeader from '$lib/components/BrandHeader.svelte';
  import { webSocketService } from '$lib/services/websocket';

  onMount(() => {
    webSocketService.connect('wss://api.example.com/ws');
  });

  onDestroy(() => {
    webSocketService.disconnect();
  });
</script>

<div class="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
  <BrandHeader />

  <div class="flex flex-1 overflow-hidden">
    <aside class="hidden md:block h-full">
      <ConversationList />
    </aside>

    <main class="flex-1 h-full relative">
      <ChatWindow />
    </main>
  </div>
</div>
