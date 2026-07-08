<script lang="ts">
  import PerformanceMetrics from './PerformanceMetrics.svelte';
  import SMSVolumeChart from './SMSVolumeChart.svelte';
  import OutcomeDonut from './OutcomeDonut.svelte';
  import SentimentChart from './SentimentChart.svelte';
  import CampaignFunnel from './CampaignFunnel.svelte';
  import type { CampaignInsightsResponse } from '../../api/campaigns';

  // Mock campaign list
  const mockCampaigns = [
    { id: 'all', name: 'All Campaigns (Aggregated)' },
    { id: 'camp-1', name: 'Winter Warm Outbound List' },
    { id: 'camp-2', name: 'Demo Request Follow-Up Sequence' },
    { id: 'camp-3', name: 'Re-engagement Promo #2' }
  ];

  let selectedCampaignId = 'all';

  // Mock insights data corresponding to the campaigns
  const mockInsights: Record<string, CampaignInsightsResponse & { staged: number; noReply: number }> = {
    all: {
      id: 'insights-all',
      campaign_id: 'all',
      calculated_at: new Date().toISOString(),
      total_recipients: 18350,
      total_sent: 18170,
      total_delivered: 17995,
      total_failed: 175,
      total_replies: 3470,
      unique_responders: 3420,
      reply_rate: 0.19, // 19%
      avg_response_time_mins: 11,
      ai_summary: "Aggregated analytics indicate a stable 19% reply rate across all campaigns. AI classification flagged 494 high-interest reply leads. Opt-out rates remain healthy under 3%. Recommended action: Trigger follow-ups for 14,700 non-repliers to reclaim pipeline value.",
      ai_sentiment_score: 0.72,
      ai_insights_json: "",
      staged: 18350,
      noReply: 14700,
      priority_breakdown: {
        interested: 494,
        neutral: 2456,
        dnc: 520
      },
      top_interests: ['Pricing options', 'Free trial extensions', 'Automated APIs'],
      top_objections: ['Too busy right now', 'Wrong department', 'Cost constraint'],
      recommendations: [
        'Run follow-up sequence targeting non-responders from Winter Outbound',
        'Exclude DNC contacts from all future dispatch routes',
        'Segment Acme contacts by industry priority'
      ]
    },
    'camp-1': {
      id: 'insights-1',
      campaign_id: 'camp-1',
      calculated_at: new Date().toISOString(),
      total_recipients: 5000,
      total_sent: 4920,
      total_delivered: 4880,
      total_failed: 40,
      total_replies: 1220,
      unique_responders: 1200,
      reply_rate: 0.25, // 25%
      avg_response_time_mins: 8,
      ai_summary: "Winter Warm Outbound performed exceptionally well, posting a 25% response rate. High sentiment matches immediate product demands. Twilio delivery rate registered a stable 99.2%.",
      ai_sentiment_score: 0.85,
      ai_insights_json: "",
      staged: 5000,
      noReply: 3700,
      priority_breakdown: {
        interested: 280,
        neutral: 840,
        dnc: 100
      },
      top_interests: ['SDR Automations', 'CRM Integrations', 'CSV list scaling'],
      top_objections: ['Already using Competitor', 'Not matching budget'],
      recommendations: [
        'Trigger the secondary follow-up pitch immediately',
        'Throttle next dispatch to 150 SMS/hour'
      ]
    },
    'camp-2': {
      id: 'insights-2',
      campaign_id: 'camp-2',
      calculated_at: new Date().toISOString(),
      total_recipients: 850,
      total_sent: 840,
      total_delivered: 835,
      total_failed: 5,
      total_replies: 310,
      unique_responders: 300,
      reply_rate: 0.37, // 37%
      avg_response_time_mins: 12,
      ai_summary: "High-intent follow-up campaign focused on previous demo inquiries. Conversion rates are high, but manual intervention is required to book final sales calls.",
      ai_sentiment_score: 0.9,
      ai_insights_json: "",
      staged: 850,
      noReply: 530,
      priority_breakdown: {
        interested: 94,
        neutral: 196,
        dnc: 20
      },
      top_interests: ['Enterprise pricing plans', 'Dedicated phone line availability'],
      top_objections: ['No time for pilot', 'Legacy contract ties'],
      recommendations: [
        'Assign high-priority leads directly to account executives',
        'Optimize dispatch times to late afternoon'
      ]
    },
    'camp-3': {
      id: 'insights-3',
      campaign_id: 'camp-3',
      calculated_at: new Date().toISOString(),
      total_recipients: 12500,
      total_sent: 12410,
      total_delivered: 12280,
      total_failed: 130,
      total_replies: 1940,
      unique_responders: 1920,
      reply_rate: 0.16, // 16%
      avg_response_time_mins: 15,
      ai_summary: "Promo campaign targeting historical contacts. Response volume is massive, but sentiment is neutral-to-negative with higher DNC flags (STOP).",
      ai_sentiment_score: 0.45,
      ai_insights_json: "",
      staged: 12500,
      noReply: 10470,
      priority_breakdown: {
        interested: 120,
        neutral: 1420,
        dnc: 400
      },
      top_interests: ['Discounts & coupon codes', 'API setup tutorials'],
      top_objections: ['Do not contact request', 'Irrelevant promo timing'],
      recommendations: [
        'Scrub list for inactive carrier records before next campaign',
        'Offer clear opt-out flags to prevent compliance complaints'
      ]
    }
  };

  // Mock chart data corresponding to each campaign
  const mockChartData: Record<string, { labels: string[]; sent: number[]; replies: number[] }> = {
    all: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      sent: [2100, 3400, 2900, 4200, 3800, 950, 820],
      replies: [420, 680, 520, 780, 710, 210, 150]
    },
    'camp-1': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      sent: [1200, 1500, 1300, 920, 0, 0, 0],
      replies: [280, 360, 310, 270, 0, 0, 0]
    },
    'camp-2': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      sent: [0, 0, 200, 350, 290, 0, 0],
      replies: [0, 0, 70, 140, 100, 0, 0]
    },
    'camp-3': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      sent: [900, 1900, 1400, 2930, 3510, 950, 820],
      replies: [140, 320, 210, 510, 610, 210, 150]
    }
  };

  // Reactively compute active dataset
  $: activeInsights = mockInsights[selectedCampaignId] || mockInsights.all;
  $: activeChartData = mockChartData[selectedCampaignId] || mockChartData.all;
</script>

<div class="space-y-8">
  <!-- Campaign Selector Header -->
  <div class="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-[#111113] border border-white/[0.05] shadow-xl relative overflow-hidden">
    <div class="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none"></div>
    <div>
      <span class="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Target Scope</span>
      <h2 class="text-xl font-bold text-white mt-0.5">Campaign Analytics Dashboard</h2>
    </div>
    
    <div class="flex items-center gap-3">
      <label for="campaign-select" class="text-xs font-semibold text-zinc-400">Select Campaign:</label>
      <select 
        id="campaign-select"
        bind:value={selectedCampaignId}
        class="bg-[#18181b] border border-white/[0.08] text-white text-xs font-semibold px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer transition-colors duration-200"
      >
        {#each mockCampaigns as camp}
          <option value={camp.id}>{camp.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- ─── PERFORMANCE METRICS GRID ─── -->
  <section>
    <div class="mb-5">
      <span class="text-[10px] font-bold text-zinc-500 tracking-widest uppercase font-mono">Performance Overview</span>
      <h3 class="text-lg font-bold text-white mt-0.5">Key Performance Indicators</h3>
    </div>
    <PerformanceMetrics insights={activeInsights} />
  </section>

  <!-- ─── CHARTS ROW 1: SMS Volume + Outcome Donut ─── -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- SMS Volume (7 cols) -->
    <div class="lg:col-span-7 p-8 rounded-[2.5rem] bg-[#111113] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
      <div class="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none"></div>
      <div class="relative z-10 h-full flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <div>
            <span class="text-[10px] font-bold text-zinc-500 tracking-widest uppercase font-mono">SMS Traffic</span>
            <h3 class="text-base font-bold text-white mt-0.5">Message Send vs. Reply Volume</h3>
          </div>
          <span class="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Last 7 Days</span>
        </div>
        <div class="flex-1 min-h-[280px]">
          <SMSVolumeChart chartData={activeChartData} />
        </div>
      </div>
    </div>

    <!-- Outcome Donut (5 cols) -->
    <div class="lg:col-span-5 p-8 rounded-[2.5rem] bg-[#111113] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
      <div class="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none"></div>
      <div class="relative z-10 h-full flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <div>
            <span class="text-[10px] font-bold text-zinc-500 tracking-widest uppercase font-mono">Conversion Quality</span>
            <h3 class="text-base font-bold text-white mt-0.5">Audience Status Breakdown</h3>
          </div>
          <span class="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Overview</span>
        </div>
        <div class="flex-1">
          <OutcomeDonut 
            interested={activeInsights.priority_breakdown?.['interested'] || 0}
            neutral={activeInsights.priority_breakdown?.['neutral'] || 0}
            dnc={activeInsights.priority_breakdown?.['dnc'] || 0}
            noReply={activeInsights.noReply}
          />
        </div>
      </div>
    </div>
  </div>

  <!-- ─── CHARTS ROW 2: Funnel + Sentiment ─── -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Conversion Funnel (7 cols) -->
    <div class="lg:col-span-7 p-8 rounded-[2.5rem] bg-[#111113] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
      <div class="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none"></div>
      <div class="relative z-10">
        <div class="mb-6">
          <span class="text-[10px] font-bold text-zinc-500 tracking-widest uppercase font-mono">Conversion Funnel</span>
          <h3 class="text-base font-bold text-white mt-0.5">Leads to Hot Opportunities</h3>
        </div>
        <CampaignFunnel 
          staged={activeInsights.staged}
          sent={activeInsights.total_sent}
          delivered={activeInsights.total_delivered}
          replied={activeInsights.total_replies}
          interested={activeInsights.priority_breakdown?.['interested'] || 0}
        />
      </div>
    </div>

    <!-- Sentiment chart (5 cols) -->
    <div class="lg:col-span-5 p-8 rounded-[2.5rem] bg-[#111113] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
      <div class="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/5 rounded-full blur-[60px] pointer-events-none"></div>
      <div class="relative z-10 h-full flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <div>
            <span class="text-[10px] font-bold text-zinc-500 tracking-widest uppercase font-mono">AI Sentiment Analysis</span>
            <h3 class="text-base font-bold text-white mt-0.5">Categorized Inbox Replies</h3>
          </div>
        </div>
        <div class="flex-1">
          <SentimentChart 
            positive={activeInsights.priority_breakdown?.['interested'] || 0}
            neutral={activeInsights.priority_breakdown?.['neutral'] || 0}
            negative={activeInsights.priority_breakdown?.['dnc'] || 0}
          />
        </div>
      </div>
    </div>
  </div>

  <!-- ─── AI ACTIONABLE INSIGHTS PANEL ─── -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Summary (7 cols) -->
    <div class="lg:col-span-7 p-8 rounded-[2.5rem] bg-[#111113] border border-white/[0.05] shadow-2xl relative overflow-hidden">
      <div class="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/[0.02] rounded-full blur-[60px] pointer-events-none"></div>
      <span class="text-[10px] font-bold text-emerald-400 tracking-widest uppercase font-mono">AI Summary Insights</span>
      <h3 class="text-lg font-bold text-white mt-1">Campaign Assessment</h3>
      <p class="text-sm text-zinc-400 font-light mt-3 leading-relaxed">
        {activeInsights.ai_summary}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/[0.04]">
        <div>
          <h4 class="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Top Lead Interests</h4>
          <ul class="space-y-2">
            {#each activeInsights.top_interests || [] as interest}
              <li class="flex items-start gap-2 text-xs text-zinc-400">
                <span class="text-emerald-400 mt-0.5">•</span>
                <span>{interest}</span>
              </li>
            {/each}
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Top Lead Objections</h4>
          <ul class="space-y-2">
            {#each activeInsights.top_objections || [] as objection}
              <li class="flex items-start gap-2 text-xs text-zinc-400">
                <span class="text-rose-400 mt-0.5">•</span>
                <span>{objection}</span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>

    <!-- Recommendations (5 cols) -->
    <div class="lg:col-span-5 p-8 rounded-[2.5rem] bg-[#111113] border border-white/[0.05] shadow-2xl relative overflow-hidden">
      <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/[0.02] rounded-full blur-[60px] pointer-events-none"></div>
      <span class="text-[10px] font-bold text-indigo-400 tracking-widest uppercase font-mono font-bold">Suggested Actions</span>
      <h3 class="text-lg font-bold text-white mt-1">AI Recommendation Log</h3>
      
      <div class="space-y-4 mt-5">
        {#each activeInsights.recommendations || [] as rec, idx}
          <div class="flex gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] transition-colors duration-200">
            <span class="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center font-mono">
              {idx + 1}
            </span>
            <p class="text-xs text-zinc-400 leading-normal">{rec}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
