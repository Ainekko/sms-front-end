<script lang="ts">
  import type { CampaignResponse } from '$lib/api/campaigns';
  import { format } from 'date-fns';

  export let campaign: CampaignResponse;

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  }

  function getTargetDisplay(c: CampaignResponse) {
    if (c.target_type === 'group') return `Group: ${c.target_group_name || 'Unknown Group'}`;
    if (c.target_type === 'brand') return `Brand: ${c.target_brand_name || 'Unknown Brand'}`;
    if (c.target_type === 'contacts')
      return `Contact: ${c.target_contact_name || 'Single Contact'}`;
    return 'Unknown Target';
  }
</script>

<a
  href="/campaigns/{campaign.id}"
  class="block group relative bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-100 hover:border-blue-100"
>
  <!-- Status Badge -->
  <div class="flex justify-between items-start mb-4">
    <span
      class={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(campaign.status)}`}
    >
      {campaign.status}
    </span>
    <span class="text-xs text-gray-400 font-medium">
      {campaign.scheduled_at ? format(new Date(campaign.scheduled_at), 'MMM d, HH:mm') : 'Draft'}
    </span>
  </div>

  <!-- Title & Target -->
  <h3
    class="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate"
  >
    {campaign.name || 'Untitled Campaign'}
  </h3>
  <p class="text-sm text-gray-500 mb-4 flex items-center">
    <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
    {getTargetDisplay(campaign)}
  </p>

  <!-- Message Preview -->
  <div class="bg-gray-50 rounded-xl p-3 mb-4">
    <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed">
      {campaign.message_body}
    </p>
  </div>

  <!-- Stats Footer -->
  <div class="flex items-center justify-between pt-4 border-t border-gray-50">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Sent</span>
      <span class="text-sm font-bold text-gray-900">{campaign.total_sent || 0}</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Delivered</span
      >
      <span class="text-sm font-bold text-gray-900">{campaign.total_delivered || 0}</span>
    </div>
    <div class="flex flex-col items-end">
      <span class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Failed</span>
      <span class="text-sm font-bold text-red-600">{campaign.total_failed || 0}</span>
    </div>
  </div>
</a>
