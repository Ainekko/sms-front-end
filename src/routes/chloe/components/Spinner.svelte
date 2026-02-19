<script lang="ts">
  /**
   * Spinner Component
   * =================
   * CSS spinner with configurable size.
   */
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
</script>

<div
  class="animate-spin rounded-full border-2 border-zinc-200 border-t-brand-600 {sizes[size]}"
  role="status"
>
  <span class="sr-only">Loading...</span>
</div>
