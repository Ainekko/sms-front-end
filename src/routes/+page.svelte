<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    goto('/messages');
  });
</script>

<div class="flex items-center justify-center h-screen">
  <p>Redirecting to messages...</p>
</div>
