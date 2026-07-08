<script lang="ts">
  export let staged: number = 0;
  export let sent: number = 0;
  export let delivered: number = 0;
  export let replied: number = 0;
  export let interested: number = 0;

  const stages = [
    { key: 'staged', label: 'Audience Staged' },
    { key: 'sent', label: 'Dispatched SMS' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'replied', label: 'Direct Replies' },
    { key: 'interested', label: 'Interested Leads' },
  ];

  $: values = [staged, sent, delivered, replied, interested];
  $: maxVal = Math.max(staged, 1);

  function getBarWidth(val: number): string {
    const pct = Math.max((val / maxVal) * 100, 8);
    return `${pct}%`;
  }

  function getConversionRate(fromIdx: number): string {
    if (fromIdx === 0) return '';
    const prev = values[fromIdx - 1];
    const curr = values[fromIdx];
    if (prev === 0) return '0%';
    return `${Math.round((curr / prev) * 100)}%`;
  }

  const barColors = [
    'from-indigo-600/80 to-indigo-600/40',
    'from-indigo-500/80 to-indigo-500/40',
    'from-blue-500/80 to-blue-500/40',
    'from-violet-500/80 to-violet-500/40',
    'from-emerald-500/80 to-emerald-500/40',
  ];

  const glowColors = [
    'shadow-indigo-600/20',
    'shadow-indigo-500/20',
    'shadow-blue-500/20',
    'shadow-violet-500/20',
    'shadow-emerald-500/20',
  ];
</script>

<div class="space-y-4 w-full">
  {#each stages as stage, i}
    <div class="group">
      <!-- Stage header -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2.5">
          <span class="w-4 h-4 text-zinc-400 flex items-center justify-center">
            {#if stage.key === 'staged'}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            {:else if stage.key === 'sent'}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            {:else if stage.key === 'delivered'}
              <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            {:else if stage.key === 'replied'}
              <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            {:else if stage.key === 'interested'}
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            {/if}
          </span>
          <span class="text-xs font-semibold text-zinc-300 font-[Poppins]">{stage.label}</span>
        </div>
        <div class="flex items-center gap-3">
          {#if i > 0}
            <span class="text-[10px] font-bold tracking-wider uppercase font-mono
              {getConversionRate(i) === '0%' ? 'text-zinc-600' : 'text-emerald-400/80'}">
              {getConversionRate(i)} conversion
            </span>
          {/if}
          <span class="text-sm font-bold text-white font-mono">{values[i].toLocaleString()}</span>
        </div>
      </div>

      <!-- Animated bar -->
      <div class="w-full h-3 rounded-full bg-white/[0.03] border border-white/[0.04] overflow-hidden">
        <div
          class="h-full rounded-full bg-gradient-to-r {barColors[i]} shadow-lg {glowColors[i]} transition-all duration-700 ease-out"
          style="width: {getBarWidth(values[i])}"
        ></div>
      </div>

      <!-- Connecting arrow between stages -->
      {#if i < stages.length - 1}
        <div class="flex justify-center py-1">
          <svg class="w-3.5 h-3.5 text-zinc-800" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 13l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
        </div>
      {/if}
    </div>
  {/each}
</div>
