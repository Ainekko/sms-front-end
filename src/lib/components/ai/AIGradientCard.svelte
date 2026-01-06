<!--
  AIGradientCard Component
  =========================
  Modern card with subtle shimmer effect and zinc-based palette.
  Minimal, clean design with soft shadows.
-->

<script lang="ts">
  /** Padding variant */
  export let variant: 'default' | 'compact' | 'none' = 'default';

  /** Whether to show shimmer effect */
  export let shimmer: boolean = true;

  /** Custom CSS classes */
  let className = '';
  export { className as class };

  $: paddingClass = {
    default: 'p-5',
    compact: 'p-4',
    none: 'p-0'
  }[variant];
</script>

<div class="ai-card {paddingClass} {shimmer ? 'ai-shimmer' : ''} {className}">
  <slot />
</div>

<style>
  .ai-card {
    position: relative;
    background: linear-gradient(145deg, rgb(39 39 42) 0%, rgb(24 24 27) 100%);
    border-radius: 0.75rem;
    border: 1px solid rgb(63 63 70);
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.3),
      0 2px 4px -2px rgb(0 0 0 / 0.2),
      inset 0 1px 0 0 rgb(82 82 91 / 0.3);
    overflow: hidden;
  }

  /* Shimmer overlay */
  .ai-shimmer::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgb(161 161 170 / 0.03) 45%,
      rgb(161 161 170 / 0.06) 50%,
      rgb(161 161 170 / 0.03) 55%,
      transparent 60%
    );
    background-size: 200% 100%;
    animation: shimmer 8s ease-in-out infinite;
    pointer-events: none;
    border-radius: 0.75rem;
  }

  @keyframes shimmer {
    0%,
    100% {
      background-position: 200% 0;
    }
    50% {
      background-position: -200% 0;
    }
  }

  /* Subtle top highlight */
  .ai-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgb(161 161 170 / 0.2) 50%,
      transparent 100%
    );
    pointer-events: none;
  }
</style>
