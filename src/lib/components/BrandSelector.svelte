<!--
  BrandSelector Component
  ========================
  Dropdown component for selecting and switching between brands.
  
  This component:
  - Shows currently selected brand with phone number
  - Dropdown list of all available brands
  - Click to switch between brands
  - Loading state while brands load
  - "Manage Brands" button to open brand manager
  
  Props:
    onManageBrands?: () => void - Callback when "Manage Brands" clicked
  
  Events: None (uses stores directly)
  
  Usage:
    <BrandSelector on:manageBrands={openBrandManager} />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Import stores
  import { brandsStore, type Brand } from '../stores/brandsStore';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Currently selected brand ID from URL */
  export let selectedBrandId: string | null = null;

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  const dispatch = createEventDispatcher<{
    manageBrands: void;
    brandChange: { brandId: string };
  }>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** Whether the dropdown is open */
  let isOpen = false;

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  // Subscribe to stores
  $: brands = $brandsStore.brands;
  $: isLoading = $brandsStore.isLoading;

  // Get current brand from the selectedBrandId prop (URL-driven)
  $: currentBrand = selectedBrandId
    ? brands.find((b) => b.id === selectedBrandId)
    : brands[0] || null;

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Toggle dropdown open/closed.
   */
  function toggleDropdown(): void {
    isOpen = !isOpen;
  }

  /**
   * Close the dropdown.
   */
  function closeDropdown(): void {
    isOpen = false;
  }

  /**
   * Handle selecting a brand - update URL.
   */
  function handleSelectBrand(brand: Brand): void {
    // Update URL with brand query param
    goto(`?brand=${brand.id}`, { replaceState: true, keepFocus: true });
    dispatch('brandChange', { brandId: brand.id });
    closeDropdown();
  }

  /**
   * Handle clicking "Manage Brands".
   */
  function handleManageBrands(): void {
    closeDropdown();
    dispatch('manageBrands');
  }

  /**
   * Format phone number for display.
   */
  function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/^\+/, '');

    if (digits.length === 11 && digits.startsWith('1')) {
      const area = digits.slice(1, 4);
      const prefix = digits.slice(4, 7);
      const line = digits.slice(7);
      return `(${area}) ${prefix}-${line}`;
    }

    if (digits.length === 10) {
      const area = digits.slice(0, 3);
      const prefix = digits.slice(3, 6);
      const line = digits.slice(6);
      return `(${area}) ${prefix}-${line}`;
    }

    return phone;
  }

  /**
   * Close dropdown when clicking outside.
   */
  function handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.brand-selector')) {
      closeDropdown();
    }
  }
</script>

<!-- Click outside listener -->
<svelte:window on:click={handleClickOutside} />

<!-- Brand Selector Container -->
<div class="brand-selector relative">
  <!-- Trigger Button -->
  <button
    type="button"
    class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100
               transition-colors duration-200 border border-transparent
               {isOpen ? 'bg-gray-100 border-gray-200' : ''}"
    on:click|stopPropagation={toggleDropdown}
  >
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center space-x-2">
        <div
          class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <span class="text-sm text-gray-500">Loading...</span>
      </div>
    {:else if currentBrand}
      <!-- Selected Brand Display -->
      <div class="flex items-center space-x-2">
        <!-- Brand Icon -->
        <div
          class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center text-white text-xs font-bold shadow-sm"
        >
          {currentBrand.name.charAt(0).toUpperCase()}
        </div>

        <!-- Brand Info -->
        <div class="text-left">
          <p class="text-sm font-medium text-gray-800">{currentBrand.name}</p>
          <p class="text-xs text-gray-500">{formatPhoneNumber(currentBrand.phoneNumber)}</p>
        </div>
      </div>

      <!-- Dropdown Arrow -->
      <svg
        class="w-4 h-4 text-gray-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    {:else}
      <!-- No Brand Selected -->
      <span class="text-sm text-gray-500">Select a brand</span>
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    {/if}
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div
      class="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg
                   border border-gray-200 py-1 z-50 animate-fade-in"
    >
      <!-- Brand List -->
      {#if brands.length > 0}
        <div class="max-h-64 overflow-y-auto">
          {#each brands as brand (brand.id)}
            <button
              type="button"
              class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50
                                   transition-colors duration-150
                                   {currentBrand?.id === brand.id ? 'bg-blue-50' : ''}"
              on:click|stopPropagation={() => handleSelectBrand(brand)}
            >
              <!-- Brand Icon -->
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                                        flex items-center justify-center text-white text-xs font-bold shadow-sm"
              >
                {brand.name.charAt(0).toUpperCase()}
              </div>

              <!-- Brand Info -->
              <div class="flex-1 text-left">
                <p class="text-sm font-medium text-gray-800">{brand.name}</p>
                <p class="text-xs text-gray-500">{formatPhoneNumber(brand.phoneNumber)}</p>
              </div>

              <!-- Selected Check -->
              {#if currentBrand?.id === brand.id}
                <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      {:else}
        <!-- Empty State -->
        <div class="px-4 py-3 text-center">
          <p class="text-sm text-gray-500">No brands available</p>
        </div>
      {/if}

      <!-- Divider -->
      <div class="border-t border-gray-100 my-1"></div>

      <!-- Manage Brands Button -->
      <button
        type="button"
        class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-blue-600
                       hover:bg-blue-50 transition-colors duration-150"
        on:click|stopPropagation={handleManageBrands}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Manage Brands</span>
      </button>
    </div>
  {/if}
</div>

<style>
  /* Fade-in animation for dropdown */
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.15s ease-out;
  }
</style>
