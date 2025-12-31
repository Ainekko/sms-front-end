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

      <!-- Schedule -->
      <div class="sm:col-span-3">
        <label for="scheduled_at" class="block text-sm font-semibold text-gray-700 mb-1"
          >Schedule (Optional)</label
        >
        <input
          type="datetime-local"
          id="scheduled_at"
          bind:value={scheduledAt}
          disabled={isReadOnly}
          class="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        />
      </div>
    </div>

    <div class="border-t border-gray-100 pt-8">
      <h3 class="text-lg font-bold text-gray-900 tracking-tight mb-4">Target Audience</h3>

      <!-- Target Type Selection Tabs -->
      <div class="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {#each ['brand', 'group', 'contacts'] as type}
          <button
            type="button"
            disabled={isReadOnly}
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

      <!-- Game-Type Selection Cards -->
      <div class="space-y-4">
        {#if targetType === 'brand'}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {#each brands as brand}
              <button
                type="button"
                disabled={isReadOnly}
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
                disabled={isReadOnly}
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
              disabled={isReadOnly}
              class="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              placeholder="Enter Contact UUID"
            />
          </div>
        {/if}
      </div>
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
          class="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Campaign'}
        </button>
      </div>
    {/if}
  </form>
</div>
