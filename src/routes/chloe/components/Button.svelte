<script lang="ts">
  /**
   * Button Component
   * =================
   * Reusable button with variants, sizes, and loading state.
   */
  import Spinner from './Spinner.svelte';

  export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let type: 'button' | 'submit' = 'button';

  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm active:bg-brand-800',
    secondary:
      'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm active:bg-zinc-100',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm active:bg-red-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base'
  };
</script>

<button
  {type}
  disabled={disabled || loading}
  class="
    inline-flex items-center justify-center gap-2 font-medium rounded-lg
    transition-all duration-150 cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    {variants[variant]}
    {sizes[size]}
  "
  on:click
>
  {#if loading}
    <Spinner size="sm" />
  {/if}
  <slot />
</button>
