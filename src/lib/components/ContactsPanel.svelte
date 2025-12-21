<!--
  ContactsPanel Component
  ========================
  Slide-out panel showing contacts for the selected brand.
  
  This component:
  - Displays list of contacts for current brand
  - Add new contact form
  - Remove contact from brand
  - Loading and empty states
  
  Props:
    isOpen: boolean - Whether the panel is visible
  
  Events:
    close - Panel should be closed
  
  Usage:
    <ContactsPanel 
      isOpen={showContacts} 
      on:close={() => showContacts = false}
    />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Import stores
  import {
    brandsStore,
    selectedBrand,
    loadBrandContacts,
    type BrandContact
  } from '../stores/brandsStore';
  import { createContact, removeContactFromBrand } from '../stores/contactsStore';
  import { showSuccess, showError } from '../stores/uiStore';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Whether the panel is open */
  export let isOpen = false;

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** New contact form */
  let newPhoneNumber = '';
  let newName = '';
  let isAddingContact = false;
  let showAddForm = false;

  // ==========================================================================
  // Reactive State
  // ==========================================================================

  $: currentBrand = $selectedBrand;
  $: contacts = $brandsStore.contacts;
  $: isLoading = $brandsStore.isLoadingContacts;

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Format phone number for display.
   */
  function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/^\+/, '');

    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone;
  }

  /**
   * Handle adding a new contact.
   */
  async function handleAddContact(): Promise<void> {
    if (!currentBrand) return;

    if (!newPhoneNumber.trim()) {
      showError('Phone number is required');
      return;
    }

    // Clean and validate phone number
    let phone = newPhoneNumber.trim();
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    isAddingContact = true;

    try {
      await createContact({
        phone_number: phone,
        name: newName.trim() || undefined,
        brand_ids: [currentBrand.id]
      });

      showSuccess('Contact added successfully');

      // Reset form
      newPhoneNumber = '';
      newName = '';
      showAddForm = false;

      // Reload contacts
      await loadBrandContacts(currentBrand.id);
    } catch (err) {
      console.error('Failed to add contact:', err);
      showError(err instanceof Error ? err.message : 'Failed to add contact');
    } finally {
      isAddingContact = false;
    }
  }

  /**
   * Handle removing a contact from the brand.
   */
  async function handleRemoveContact(contact: BrandContact): Promise<void> {
    if (!currentBrand) return;

    try {
      await removeContactFromBrand(contact.id, currentBrand.id);
      showSuccess('Contact removed from brand');
    } catch (err) {
      console.error('Failed to remove contact:', err);
      showError(err instanceof Error ? err.message : 'Failed to remove contact');
    }
  }

  /**
   * Handle panel close.
   */
  function handleClose(): void {
    showAddForm = false;
    newPhoneNumber = '';
    newName = '';
    dispatch('close');
  }

  /**
   * Handle backdrop click.
   */
  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  /**
   * Handle Escape key.
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isOpen) {
      handleClose();
    }
  }
</script>

<!-- Keyboard handler -->
<svelte:window on:keydown={handleKeydown} />

<!-- Panel Backdrop -->
{#if isOpen}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" on:click={handleBackdropClick}>
    <!-- Slide-out Panel -->
    <div
      class="absolute right-0 top-0 h-full w-96 max-w-full bg-white shadow-2xl
                   flex flex-col animate-slide-in"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 class="text-lg font-bold text-gray-800">Contacts</h2>
          {#if currentBrand}
            <p class="text-sm text-gray-500">{currentBrand.name}</p>
          {/if}
        </div>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          on:click={handleClose}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Add Contact Section -->
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
        {#if showAddForm}
          <div class="space-y-3">
            <input
              type="tel"
              bind:value={newPhoneNumber}
              placeholder="+1234567890"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isAddingContact}
            />
            <input
              type="text"
              bind:value={newName}
              placeholder="Name (optional)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isAddingContact}
            />
            <div class="flex space-x-2">
              <button
                type="button"
                class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg
                                       hover:bg-blue-700 transition-colors disabled:opacity-50"
                on:click={handleAddContact}
                disabled={isAddingContact}
              >
                {isAddingContact ? 'Adding...' : 'Add Contact'}
              </button>
              <button
                type="button"
                class="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300
                                       rounded-lg hover:bg-gray-50 transition-colors"
                on:click={() => (showAddForm = false)}
                disabled={isAddingContact}
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <button
            type="button"
            class="w-full flex items-center justify-center space-x-2 px-4 py-2.5
                               text-sm text-blue-600 bg-white border-2 border-dashed border-blue-300
                               rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors"
            on:click={() => (showAddForm = true)}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add New Contact</span>
          </button>
        {/if}
      </div>

      <!-- Contacts List -->
      <div class="flex-1 overflow-y-auto">
        {#if isLoading}
          <!-- Loading State -->
          <div class="flex items-center justify-center h-32">
            <div class="flex flex-col items-center space-y-2">
              <svg class="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span class="text-sm text-gray-500">Loading contacts...</span>
            </div>
          </div>
        {:else if contacts.length === 0}
          <!-- Empty State -->
          <div class="flex items-center justify-center h-32 p-4">
            <div class="text-center">
              <svg
                class="w-12 h-12 text-gray-300 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p class="text-sm text-gray-500">No contacts yet</p>
              <p class="text-xs text-gray-400 mt-1">Add contacts to send bulk messages</p>
            </div>
          </div>
        {:else}
          <!-- Contact Items -->
          {#each contacts as contact (contact.id)}
            <div
              class="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <!-- Avatar -->
                <div
                  class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500
                                            flex items-center justify-center text-white font-semibold text-sm"
                >
                  {contact.name ? contact.name.charAt(0).toUpperCase() : '#'}
                </div>

                <!-- Contact Info -->
                <div>
                  {#if contact.name}
                    <p class="text-sm font-medium text-gray-800">{contact.name}</p>
                    <p class="text-xs text-gray-500">{formatPhoneNumber(contact.phoneNumber)}</p>
                  {:else}
                    <p class="text-sm font-medium text-gray-800">
                      {formatPhoneNumber(contact.phoneNumber)}
                    </p>
                  {/if}
                </div>
              </div>

              <!-- Remove Button -->
              <button
                type="button"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove from brand"
                on:click={() => handleRemoveContact(contact)}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p class="text-xs text-gray-500 text-center">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in this brand
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Slide-in animation */
  @keyframes slide-in {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>
