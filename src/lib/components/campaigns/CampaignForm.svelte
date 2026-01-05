<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { format } from 'date-fns';
  import { brandsStore, loadBrands } from '$lib/stores/brandsStore';
  import { groupsStore, loadGroups } from '$lib/stores/groupsStore';
  import type { CreateCampaignRequest, CampaignResponse } from '$lib/api/campaigns';

  export let campaign: CampaignResponse | null = null;
  export let isLoading: boolean = false;

  const dispatch = createEventDispatcher();

  let name = '';
  let messageBody = '';
  let targetType: 'brand' | 'group' | 'contacts' = 'brand';
  let targetBrandId = '';
  let targetGroupId = '';
  let targetContactId = '';
  let scheduledAt = '';
  let fromBrandId = '';

  // Derived state for read-only mode
  $: isReadOnly =
    campaign && ['processing', 'completed', 'cancelled', 'failed'].includes(campaign.status);
  $: brands = $brandsStore.brands;
  $: groups = $groupsStore.groups;

  onMount(async () => {
    await Promise.all([loadBrands(), loadGroups()]);
  });

  // Reactively update form fields when campaign data loads
  $: if (campaign) {
    name = campaign.name;
    messageBody = campaign.message_body;
    targetType = campaign.target_type;
    targetBrandId = campaign.target_brand_id || '';
    targetGroupId = campaign.target_group_id || '';
    targetContactId = campaign.target_contact_id || '';
    if (campaign.scheduled_at) {
      scheduledAt = format(new Date(campaign.scheduled_at), "yyyy-MM-dd'T'HH:mm");
    }
    // Set fromBrandId if available, otherwise default to first brand if not set
    if (campaign.from_brand_name) {
      // If we have the name but need ID, we might need to find it in brands list
      // But usually the API should return from_brand_id too if we added it.
      // Let's assume we can match by name or just rely on what we have.
      // Actually, looking at the API response type, we didn't add from_brand_id to the response interface explicitly in my previous edit,
      // but it should be there. Let's check if we can find the brand by name or if we should just trust the user selection.
      // For now, let's try to find the brand ID from the list if possible.
      const foundBrand = brands.find((b) => b.name === campaign?.from_brand_name);
      if (foundBrand) fromBrandId = foundBrand.id;
    }
  }

  function handleSubmit() {
    if (isReadOnly) return;
    const payload: CreateCampaignRequest = {
      name,
      message_body: messageBody,
      from_brand_id: fromBrandId || (brands.length > 0 ? brands[0].id : ''),
      target_type: targetType,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      target_brand_id: targetType === 'brand' ? targetBrandId : undefined,
      target_group_id: targetType === 'group' ? targetGroupId : undefined,
      target_contact_id: targetType === 'contacts' ? targetContactId : undefined
    };
    dispatch('submit', payload);
  }
</script>

<div class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
  <form on:submit|preventDefault={handleSubmit} class="space-y-8">
    <!-- Header Section -->
    <div>
      <h3 class="text-xl font-bold text-gray-900 tracking-tight">Campaign Configuration</h3>
      <p class="mt-1 text-gray-500">
        {isReadOnly ? 'View campaign details.' : 'Configure your campaign settings.'}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
      <!-- Campaign Name -->
      <div class="sm:col-span-4">
        <label for="name" class="block text-sm font-semibold text-gray-700 mb-1"
          >Campaign Name</label
        >
        <input
          type="text"
          id="name"
          bind:value={name}
          disabled={isReadOnly}
          class="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          placeholder="Campaign Name"
        />
      </div>

      <!-- From Brand -->
      <div class="sm:col-span-2">
        <label for="from_brand" class="block text-sm font-semibold text-gray-700 mb-1"
          >Send From</label
        >
        {#if isReadOnly && campaign?.from_brand_name}
          <div
            class="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 sm:text-sm py-3 px-4 opacity-80"
          >
            {campaign.from_brand_name}
          </div>
        {:else}
          <select
            id="from_brand"
            bind:value={fromBrandId}
            disabled={isReadOnly}
            class="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <option value="" disabled>Select Brand</option>
            {#each brands as brand}
              <option value={brand.id}>{brand.name}</option>
            {/each}
          </select>
        {/if}
      </div>

      <!-- Message Body -->
      <div class="sm:col-span-6">
        <label for="message_body" class="block text-sm font-semibold text-gray-700 mb-1"
          >Message Content</label
        >
        <div class="relative">
          <textarea
            id="message_body"
            rows="4"
            bind:value={messageBody}
            disabled={isReadOnly}
            class="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 disabled:opacity-60 disabled:cursor-not-allowed transition-colors resize-none"
            placeholder="Type your message here..."
          ></textarea>
          {#if !isReadOnly}
            <div class="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
              {messageBody.length} chars
            </div>
          {/if}
        </div>
      </div>

      <!-- When to Send Section -->
      {#if !isReadOnly}
        <div class="sm:col-span-6">
          <label class="block text-sm font-semibold text-gray-700 mb-3">When to Send?</label>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <!-- Execute Now Card -->
            <button
              type="button"
              class="relative p-5 rounded-2xl border-2 text-left transition-all duration-200 {!scheduledAt
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 ring-1 ring-green-500'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}"
              on:click={() => (scheduledAt = '')}
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center {!scheduledAt
                    ? 'bg-green-500'
                    : 'bg-gray-100'}"
                >
                  <svg
                    class="w-5 h-5 {!scheduledAt ? 'text-white' : 'text-gray-500'}"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-gray-900">Execute Now</p>
                  <p class="text-xs text-gray-500">Send immediately after saving</p>
                </div>
              </div>
              {#if !scheduledAt}
                <div class="absolute top-3 right-3 text-green-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              {/if}
            </button>

            <!-- Schedule Later Card -->
            <button
              type="button"
              class="relative p-5 rounded-2xl border-2 text-left transition-all duration-200 {scheduledAt
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-500'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}"
              on:click={() => {
                if (!scheduledAt) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  scheduledAt = tomorrow.toISOString().slice(0, 16);
                }
              }}
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center {scheduledAt
                    ? 'bg-blue-500'
                    : 'bg-gray-100'}"
                >
                  <svg
                    class="w-5 h-5 {scheduledAt ? 'text-white' : 'text-gray-500'}"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-gray-900">Schedule for Later</p>
                  <p class="text-xs text-gray-500">Choose a specific date & time</p>
                </div>
              </div>
              {#if scheduledAt}
                <div class="absolute top-3 right-3 text-blue-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              {/if}
            </button>
          </div>

          <!-- Date/Time Picker (only when scheduling) -->
          {#if scheduledAt}
            <div
              class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5"
            >
              <label
                class="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2"
              >
                Scheduled Date & Time
              </label>
              <div class="flex items-center gap-4">
                <div class="flex-1 relative">
                  <input
                    type="datetime-local"
                    bind:value={scheduledAt}
                    class="block w-full rounded-xl border-blue-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 text-base py-3.5 px-4 pr-12 shadow-sm"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      class="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="text-center min-w-[80px]">
                  <p class="text-xs text-blue-600 font-medium">Sends in</p>
                  <p class="text-lg font-bold text-blue-700">
                    {#if new Date(scheduledAt) > new Date()}
                      {@const mins = Math.floor(
                        (new Date(scheduledAt).getTime() - Date.now()) / 1000 / 60
                      )}
                      {#if mins < 60}
                        {mins}m
                      {:else if mins < 1440}
                        {Math.floor(mins / 60)}h
                      {:else}
                        {Math.floor(mins / 1440)}d
                      {/if}
                    {:else}
                      Past
                    {/if}
                  </p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {:else if scheduledAt}
        <div class="sm:col-span-3">
          <label class="block text-sm font-semibold text-gray-700 mb-1">Scheduled For</label>
          <div
            class="flex items-center gap-2 py-3 px-4 bg-blue-50 rounded-xl border border-blue-100"
          >
            <svg
              class="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="font-medium text-gray-900">{new Date(scheduledAt).toLocaleString()}</span>
          </div>
        </div>
      {/if}
    </div>

    <div class="border-t border-gray-100 pt-8">
      <h3 class="text-lg font-bold text-gray-900 tracking-tight mb-4">Target Audience</h3>

      {#if isReadOnly}
        <div
          class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6"
        >
          <div class="flex items-center">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mr-4"
            >
              {#if targetType === 'brand'}
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              {:else if targetType === 'group'}
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              {:else}
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              {/if}
            </div>
            <div>
              <p class="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                {targetType === 'brand'
                  ? 'Brand Audience'
                  : targetType === 'group'
                    ? 'Group'
                    : 'Contact'}
              </p>
              <p class="text-lg font-bold text-gray-900">
                {#if targetType === 'brand'}
                  {campaign?.target_brand_name || 'Unknown Brand'}
                {:else if targetType === 'group'}
                  {campaign?.target_group_name || 'Unknown Group'}
                {:else}
                  {campaign?.target_contact_name || targetContactId || 'Unknown Contact'}
                {/if}
              </p>
            </div>
          </div>
        </div>
      {:else}
        <div class="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {#each ['brand', 'group', 'contacts'] as type}
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize {targetType ===
              type
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}"
              on:click={() => (targetType = type)}
            >
              {type}
            </button>
          {/each}
        </div>

        <div class="space-y-4">
          {#if targetType === 'brand'}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {#each brands as brand}
                <button
                  type="button"
                  class="relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md
                    {targetBrandId === brand.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-100 bg-white hover:border-gray-200'}"
                  on:click={() => (targetBrandId = brand.id)}
                >
                  <div class="font-bold text-gray-900">{brand.name}</div>
                  <div class="text-xs text-gray-500 mt-1">Brand Audience</div>
                  {#if targetBrandId === brand.id}
                    <div class="absolute top-3 right-3 text-blue-500">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {:else if targetType === 'group'}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {#each groups as group}
                <button
                  type="button"
                  class="relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md
                    {targetGroupId === group.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-100 bg-white hover:border-gray-200'}"
                  on:click={() => (targetGroupId = group.id)}
                >
                  <div class="font-bold text-gray-900">{group.name}</div>
                  <div class="text-xs text-gray-500 mt-1">{group.contact_count} members</div>
                  {#if targetGroupId === group.id}
                    <div class="absolute top-3 right-3 text-blue-500">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {:else if targetType === 'contacts'}
            <div class="max-w-md">
              <input
                type="text"
                bind:value={targetContactId}
                class="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 transition-colors"
                placeholder="Enter Contact UUID"
              />
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Actions -->
    {#if !isReadOnly}
      <div class="flex justify-end pt-6 border-t border-gray-100">
        <button
          type="button"
          class="mr-4 px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          on:click={() => history.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed {scheduledAt
            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 shadow-blue-500/30'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/20 shadow-green-500/30'}"
        >
          {#if !scheduledAt}
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isLoading ? 'Creating...' : 'Create & Run Now'}
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {isLoading ? 'Scheduling...' : 'Schedule Campaign'}
          {/if}
        </button>
      </div>
    {/if}
  </form>
</div>
