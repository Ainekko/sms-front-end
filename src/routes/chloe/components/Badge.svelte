<script lang="ts">
  /**
   * Badge Component
   * ================
   * Status pill with color variants and optional animated dot.
   */
  export let variant: 'success' | 'warning' | 'error' | 'neutral' | 'info' = 'neutral';
  export let dot: boolean = false;

  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    neutral: 'bg-zinc-400',
    info: 'bg-blue-500'
  };
</script>

<span
  class="
    inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border
    {variants[variant]}
  "
>
  {#if dot}
    <span class="relative flex h-2 w-2">
      {#if variant === 'success'}
        <span
          class="animate-ping absolute inline-flex h-full w-full rounded-full {dotColors[
            variant
          ]} opacity-75"
        ></span>
      {/if}
      <span class="relative inline-flex rounded-full h-2 w-2 {dotColors[variant]}"></span>
    </span>
  {/if}
  <slot />
</span>
