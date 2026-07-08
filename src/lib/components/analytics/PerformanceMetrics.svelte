<script lang="ts">
  import type { CampaignInsightsResponse } from '../../api/campaigns';

  export let insights: CampaignInsightsResponse;

  // Compute stats
  $: totalSent = insights.total_sent;
  $: deliveryRate = insights.total_sent > 0 
    ? Math.round((insights.total_delivered / insights.total_sent) * 100) 
    : 0;
  $: replyRate = Math.round((insights.reply_rate || 0) * 100);
  $: avgRespTime = insights.avg_response_time_mins !== null 
    ? `${insights.avg_response_time_mins}m` 
    : '--';

  // Interested count
  $: interestedCount = insights.priority_breakdown?.['interested'] || 0;
  $: interestedPct = insights.total_replies > 0 
    ? Math.round((interestedCount / insights.total_replies) * 100) 
    : 0;

  // DNC count
  $: dncCount = insights.priority_breakdown?.['dnc'] || 0;
  $: dncPct = insights.total_replies > 0 
    ? Math.round((dncCount / insights.total_replies) * 100) 
    : 0;

  // Cost calculation: twilio dispatch fee vs hiring manual cold texter
  // Twilio costs ~$0.0079 per message. Manual agent costs ~$0.15 per message sent + monitored.
  $: dispatchCost = (insights.total_sent * 0.0079).toFixed(2);
  $: manualEstimatedCost = (insights.total_sent * 0.15).toFixed(2);
  $: netSavings = Math.round(parseFloat(manualEstimatedCost) - parseFloat(dispatchCost));

  interface Metric {
    label: string;
    value: string;
    sub: string;
    color: string;
    glow: string;
    icon: string;
  }

  $: metrics = [
    {
      label: 'Messages Sent',
      value: totalSent.toLocaleString(),
      sub: 'dispatched in bulk',
      color: 'text-indigo-400',
      glow: 'bg-indigo-500/5',
      icon: 'send'
    },
    {
      label: 'Delivered',
      value: `${deliveryRate}%`,
      sub: `${insights.total_failed || 0} delivery failures`,
      color: 'text-emerald-400',
      glow: 'bg-emerald-500/5',
      icon: 'check-circle'
    },
    {
      label: 'Reply Rate',
      value: `${replyRate}%`,
      sub: `${insights.total_replies || 0} direct replies`,
      color: 'text-violet-400',
      glow: 'bg-violet-500/5',
      icon: 'message-circle'
    },
    {
      label: 'Response Latency',
      value: avgRespTime,
      sub: 'average reply wait',
      color: 'text-cyan-400',
      glow: 'bg-cyan-500/5',
      icon: 'clock'
    },
    {
      label: 'Interested Leads',
      value: interestedCount.toString(),
      sub: `${interestedPct}% of repliers`,
      color: 'text-emerald-400',
      glow: 'bg-emerald-500/5',
      icon: 'zap'
    },
    {
      label: 'DNC Safeguarded',
      value: dncCount.toString(),
      sub: `${dncPct}% auto-flagged STOP`,
      color: 'text-rose-400',
      glow: 'bg-rose-500/5',
      icon: 'shield'
    },
    {
      label: 'Twilio Fees',
      value: `$${dispatchCost}`,
      sub: '@ $0.0079 / SMS',
      color: 'text-zinc-400',
      glow: 'bg-zinc-500/5',
      icon: 'credit-card'
    },
    {
      label: 'Net ROI Savings',
      value: `$${netSavings.toLocaleString()}`,
      sub: 'vs manual sales agent',
      color: 'text-emerald-400',
      glow: 'bg-emerald-500/5',
      icon: 'trending-up'
    }
  ] as Metric[];
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  {#each metrics as metric}
    <div class="p-5 rounded-2xl bg-[#111113] border border-white/[0.05] relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
      <!-- Glow effect on hover -->
      <div class="absolute -bottom-6 -right-6 w-24 h-24 {metric.glow} rounded-full blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-150"></div>
      
      <div class="relative z-10 flex flex-col justify-between h-full">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">{metric.label}</span>
          <span class="w-5 h-5 text-zinc-400 flex items-center justify-center">
            {#if metric.icon === 'send'}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            {:else if metric.icon === 'check-circle'}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            {:else if metric.icon === 'message-circle'}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            {:else if metric.icon === 'clock'}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            {:else if metric.icon === 'zap'}
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            {:else if metric.icon === 'shield'}
              <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            {:else if metric.icon === 'credit-card'}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            {:else if metric.icon === 'trending-up'}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            {/if}
          </span>
        </div>
        <div>
          <span class="text-2xl font-extrabold {metric.color} font-[Poppins]">{metric.value}</span>
          <span class="text-[10px] text-zinc-500 font-medium mt-1 block font-[Poppins]">{metric.sub}</span>
        </div>
      </div>
    </div>
  {/each}
</div>
