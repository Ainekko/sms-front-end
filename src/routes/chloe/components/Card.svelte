<script lang="ts">
  /**
   * Card Component
   * ===============
   * White card with subtle zinc border and shadow.
   */
  export let padding: string = 'p-6';
  export let hover: boolean = false;
</script>

<div
  class="
    bg-white rounded-xl border border-zinc-200/60 shadow-card
    {padding}
    {hover ? 'hover:shadow-card-hover hover:border-zinc-300 transition-shadow duration-200' : ''}
  "
>
  <slot />
</div>
