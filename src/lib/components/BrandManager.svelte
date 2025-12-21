<!--
  BrandManager Component
  =======================
  Modal component for creating, editing, and deleting brands.
  
  This component:
  - Modal overlay with form for brand CRUD
  - Create new brand with name and phone number
  - Edit existing brand details
  - Delete brand with confirmation
  - Form validation and error handling
  
  Props:
    isOpen: boolean - Whether the modal is visible
    editBrand?: Brand - Brand to edit (null for create mode)
  
  Events:
    close - Modal should be closed
    saved - Brand was created or updated
  
  Usage:
    <BrandManager 
      isOpen={showManager} 
      editBrand={brandToEdit}
      on:close={() => showManager = false}
      on:saved={handleBrandSaved}
    />
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Import stores and actions
  import { createBrand, updateBrand, deleteBrand, type Brand } from '../stores/brandsStore';
  import { showSuccess, showError } from '../stores/uiStore';

  // ==========================================================================
  // Props
  // ==========================================================================

  /** Whether the modal is open */
  export let isOpen = false;

  /** Brand to edit (null for create mode) */
  export let editBrand: Brand | null = null;

  // ==========================================================================
  // Event Dispatcher
  // ==========================================================================

  const dispatch = createEventDispatcher<{
    close: void;
    saved: Brand;
  }>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  /** Form data */
  let name = '';
  let phoneNumber = '';
  let isActive = true;

  /** Loading states */
  let isSaving = false;
  let isDeleting = false;

  /** Error message */
  let error = '';

  /** Show delete confirmation */
  let showDeleteConfirm = false;

  // ==========================================================================
  // Reactive Updates
  // ==========================================================================

  // Reset form when modal opens or editBrand changes
  $: if (isOpen) {
    resetForm();
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Reset the form to initial state or populate with edit data.
   */
  function resetForm(): void {
    if (editBrand) {
      name = editBrand.name;
      phoneNumber = editBrand.phoneNumber;
      isActive = editBrand.isActive;
    } else {
      name = '';
      phoneNumber = '';
      isActive = true;
    }
    error = '';
    showDeleteConfirm = false;
  }

  /**
   * Validate phone number format (basic E.164 check).
   */
  function isValidPhoneNumber(phone: string): boolean {
    // Accept formats like +1234567890, +44 1234 567890, etc.
    const cleaned = phone.replace(/[\s-()]/g, '');
    return /^\+[1-9]\d{6,14}$/.test(cleaned);
  }

  /**
   * Format phone number input (adds + if missing).
   */
  function formatPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Add + prefix if not present and user typed numbers
    if (value && !value.startsWith('+') && /^\d/.test(value)) {
      value = '+' + value;
      phoneNumber = value;
    }
  }

  /**
   * Handle form submission.
   */
  async function handleSubmit(): Promise<void> {
    error = '';

    // Validate
    if (!name.trim()) {
      error = 'Brand name is required';
      return;
    }

    if (!phoneNumber.trim()) {
      error = 'Phone number is required';
      return;
    }

    // Clean phone number
    const cleanedPhone = phoneNumber.replace(/[\s-()]/g, '');

    if (!isValidPhoneNumber(cleanedPhone)) {
      error = 'Please enter a valid phone number in E.164 format (e.g., +1234567890)';
      return;
    }

    isSaving = true;

    try {
      let savedBrand: Brand | null;

      if (editBrand) {
        // Update existing brand
        savedBrand = await updateBrand(editBrand.id, {
          name: name.trim(),
          phone_number: cleanedPhone,
          is_active: isActive
        });
        showSuccess(`Brand "${name}" updated successfully`);
      } else {
        // Create new brand
        savedBrand = await createBrand({
          name: name.trim(),
          phone_number: cleanedPhone,
          is_active: isActive
        });
        showSuccess(`Brand "${name}" created successfully`);
      }

      if (savedBrand) {
        dispatch('saved', savedBrand);
      }
      dispatch('close');
    } catch (err) {
      console.error('Failed to save brand:', err);
      error = err instanceof Error ? err.message : 'Failed to save brand';
      showError(error);
    } finally {
      isSaving = false;
    }
  }

  /**
   * Handle delete confirmation.
   */
  async function handleDelete(): Promise<void> {
    if (!editBrand) return;

    isDeleting = true;

    try {
      await deleteBrand(editBrand.id);
      showSuccess(`Brand "${editBrand.name}" deleted successfully`);
      dispatch('close');
    } catch (err) {
      console.error('Failed to delete brand:', err);
      error = err instanceof Error ? err.message : 'Failed to delete brand';
      showError(error);
    } finally {
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }

  /**
   * Handle modal close.
   */
  function handleClose(): void {
    if (!isSaving && !isDeleting) {
      dispatch('close');
    }
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

<!-- Modal Backdrop -->
{#if isOpen}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="brand-modal-title"
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-modal-in"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 id="brand-modal-title" class="text-xl font-bold text-gray-800">
          {editBrand ? 'Edit Brand' : 'Create New Brand'}
        </h2>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          on:click={handleClose}
          disabled={isSaving || isDeleting}
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

      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-5">
        <!-- Error Message -->
        {#if error}
          <div
            class="flex items-center space-x-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <svg
              class="w-5 h-5 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}

        <!-- Brand Name -->
        <div>
          <label for="brand-name" class="block text-sm font-medium text-gray-700 mb-1.5">
            Brand Name <span class="text-red-500">*</span>
          </label>
          <input
            id="brand-name"
            type="text"
            bind:value={name}
            placeholder="e.g., Acme Corp"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               transition-colors placeholder:text-gray-400"
            disabled={isSaving || isDeleting}
          />
        </div>

        <!-- Phone Number -->
        <div>
          <label for="phone-number" class="block text-sm font-medium text-gray-700 mb-1.5">
            Twilio Phone Number <span class="text-red-500">*</span>
          </label>
          <input
            id="phone-number"
            type="tel"
            bind:value={phoneNumber}
            on:input={formatPhoneInput}
            placeholder="+1234567890"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               transition-colors placeholder:text-gray-400 font-mono"
            disabled={isSaving || isDeleting}
          />
          <p class="mt-1.5 text-xs text-gray-500">
            Enter the phone number in E.164 format (e.g., +1234567890)
          </p>
        </div>

        <!-- Active Status -->
        <div class="flex items-center space-x-2">
          <input
            id="is-active"
            type="checkbox"
            bind:checked={isActive}
            class="w-4 h-4 text-blue-600 border-gray-300 rounded
                               focus:ring-2 focus:ring-blue-500"
            disabled={isSaving || isDeleting}
          />
          <label for="is-active" class="text-sm text-gray-700"> Brand is active </label>
        </div>

        <!-- Delete Confirmation -->
        {#if showDeleteConfirm}
          <div class="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-800 mb-3">
              Are you sure you want to delete "{editBrand?.name}"? This action cannot be undone.
            </p>
            <div class="flex space-x-2">
              <button
                type="button"
                class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg
                                       hover:bg-red-700 transition-colors disabled:opacity-50"
                on:click={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg
                                       hover:bg-gray-300 transition-colors"
                on:click={() => (showDeleteConfirm = false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        {/if}
      </form>

      <!-- Footer -->
      <div
        class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl"
      >
        <!-- Delete Button (only in edit mode) -->
        <div>
          {#if editBrand && !showDeleteConfirm}
            <button
              type="button"
              class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              on:click={() => (showDeleteConfirm = true)}
              disabled={isSaving || isDeleting}
            >
              Delete Brand
            </button>
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300
                               rounded-lg hover:bg-gray-50 transition-colors"
            on:click={handleClose}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg
                               hover:bg-blue-700 transition-colors disabled:opacity-50
                               flex items-center space-x-2"
            on:click={handleSubmit}
            disabled={isSaving || isDeleting}
          >
            {#if isSaving}
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
              <span>Saving...</span>
            {:else}
              <span>{editBrand ? 'Update Brand' : 'Create Brand'}</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Modal entrance animation */
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-modal-in {
    animation: modal-in 0.2s ease-out;
  }
</style>
