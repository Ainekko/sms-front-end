<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  import {
    brandsStore,
    selectedBrand,
    loadBrandContacts,
    type BrandContact
  } from '$lib/stores/brandsStore';
  import { createContact, removeContactFromBrand } from '$lib/stores/contactsStore';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  import AddToGroupModal from '$lib/components/groups/AddToGroupModal.svelte';
  import BulkContactImportModal from '$lib/components/BulkContactImportModal.svelte';
  import ContactExportModal from '$lib/components/ContactExportModal.svelte';
  import DNCListPanel from '$lib/components/ai/DNCListPanel.svelte';
  import HotLeadsPanel from '$lib/components/ai/HotLeadsPanel.svelte';

  $: brandId = $page.params.brandId;
  $: currentBrand = $selectedBrand;
  $: contacts = $brandsStore.contacts;
  $: isLoading = $brandsStore.isLoadingContacts;

  let loadedBrandId: string | null = null;

  $: if (currentBrand && currentBrand.id !== loadedBrandId) {
    loadedBrandId = currentBrand.id;
    loadBrandContacts(currentBrand.id);
  }

  // Modals
  let showDNCPanel = false;
  let showHotLeadsPanel = false;
  let showAddForm = false;
  let showAddToGroup = false;
  let showBulkImport = false;
  let showExport = false;

  // Selection
  let selectedContactIds: Set<string> = new Set();
  $: isAllSelected = contacts.length > 0 && selectedContactIds.size === contacts.length;
  $: hasSelection = selectedContactIds.size > 0;
  let selectedContactIdsForGroup: string[] = [];

  // Form
  let newPhoneNumber = '';
  let newName = '';
  let isAddingContact = false;

  function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/^\+/, '');
    if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return phone;
  }

  async function handleAddContact() {
    if (!currentBrand) return;
    if (!newPhoneNumber.trim()) {
      showError('Phone number is required');
      return;
    }
    let phone = newPhoneNumber.trim();
    if (!phone.startsWith('+')) phone = '+' + phone;
    
    isAddingContact = true;
    try {
      await createContact({
        phone_number: phone,
        name: newName.trim() || undefined,
        brand_ids: [currentBrand.id]
      });
      showSuccess('Contact added successfully');
      newPhoneNumber = '';
      newName = '';
      showAddForm = false;
      await loadBrandContacts(currentBrand.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add contact');
    } finally {
      isAddingContact = false;
    }
  }

  async function handleRemoveContact(contact: BrandContact) {
    if (!currentBrand) return;
    if (!confirm('Are you sure you want to remove this contact?')) return;
    try {
      await removeContactFromBrand(contact.id, currentBrand.id);
      showSuccess('Contact removed from brand');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove contact');
    }
  }

  function handleAddToGroup(contact: BrandContact) {
    selectedContactIdsForGroup = [contact.id];
    showAddToGroup = true;
  }

  function handleBulkAddToGroup() {
    selectedContactIdsForGroup = Array.from(selectedContactIds);
    showAddToGroup = true;
  }

  function toggleContactSelection(contactId: string) {
    if (selectedContactIds.has(contactId)) selectedContactIds.delete(contactId);
    else selectedContactIds.add(contactId);
    selectedContactIds = selectedContactIds;
  }

  function toggleSelectAll() {
    if (isAllSelected) selectedContactIds = new Set();
    else selectedContactIds = new Set(contacts.map((c) => c.id));
  }

  function handleSendMessage(contact: BrandContact) {
    goto(`/b/${brandId}/messages?phone=${encodeURIComponent(contact.phoneNumber)}`);
  }
</script>

<svelte:head>
  <title>Contacts | Broadr</title>
</svelte:head>

<div class="contacts-page">
  <div class="header">
    <div class="header-left">
      <h1 class="page-title">Contacts</h1>
      <span class="subtitle">{contacts.length} total contacts</span>
    </div>
    
    <div class="header-actions">
      <!-- Hot Leads -->
      <button class="action-btn action-btn-warm" on:click={() => (showHotLeadsPanel = true)}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
        </svg>
        Hot Leads
      </button>

      <!-- DNC -->
      <button class="action-btn action-btn-danger" on:click={() => (showDNCPanel = true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        DNC List
      </button>
      
      <div class="action-divider"></div>
      
      <button class="action-btn" on:click={() => (showBulkImport = true)}>Import CSV</button>
      <button class="action-btn" on:click={() => (showExport = true)}>Export CSV</button>
      <button class="action-btn action-btn-primary" on:click={() => (showAddForm = !showAddForm)}>
        + Add Contact
      </button>
    </div>
  </div>

  <div class="content">
    {#if showAddForm}
      <div class="add-contact-card">
        <h3 class="card-title">Add New Contact</h3>
        <div class="add-form">
          <input type="tel" bind:value={newPhoneNumber} placeholder="Phone (+1...)" disabled={isAddingContact} />
          <input type="text" bind:value={newName} placeholder="Name (optional)" disabled={isAddingContact} />
          <button class="action-btn action-btn-primary" on:click={handleAddContact} disabled={isAddingContact}>
            {isAddingContact ? 'Adding...' : 'Save Contact'}
          </button>
          <button class="action-btn" on:click={() => (showAddForm = false)}>Cancel</button>
        </div>
      </div>
    {/if}

    <div class="table-container">
      {#if isLoading}
        <div class="empty-state">
          <div class="spinner"></div>
          <p>Loading contacts...</p>
        </div>
      {:else if contacts.length === 0}
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3>No contacts found</h3>
          <p>Import a CSV or add contacts manually to get started.</p>
        </div>
      {:else}
        <div class="table-header">
          <label class="checkbox-label">
            <input type="checkbox" checked={isAllSelected} on:change={toggleSelectAll} />
            <span>Select All</span>
          </label>
          {#if hasSelection}
            <button class="action-btn action-btn-primary action-btn-sm" on:click={handleBulkAddToGroup}>
              Add {selectedContactIds.size} to Group
            </button>
          {/if}
        </div>
        
        <div class="contacts-list">
          {#each contacts as contact (contact.id)}
            <div class="contact-row">
              <div class="contact-info">
                <input type="checkbox" checked={selectedContactIds.has(contact.id)} on:change={() => toggleContactSelection(contact.id)} />
                <div class="avatar">{contact.name ? contact.name.charAt(0).toUpperCase() : '#'}</div>
                <div class="details">
                  <span class="name">{contact.name || 'Unknown'}</span>
                  <span class="phone">{formatPhoneNumber(contact.phoneNumber)}</span>
                </div>
              </div>
              <div class="contact-actions">
                <button class="icon-btn" title="Send Message" on:click={() => handleSendMessage(contact)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                </button>
                <button class="icon-btn" title="Add to Group" on:click={() => handleAddToGroup(contact)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
                </button>
                <button class="icon-btn icon-btn-danger" title="Remove" on:click={() => handleRemoveContact(contact)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<DNCListPanel isOpen={showDNCPanel} on:close={() => (showDNCPanel = false)} on:viewContact={(e) => goto(`/b/${brandId}/messages?phone=${encodeURIComponent(e.detail.phoneNumber)}`)} />
<HotLeadsPanel isOpen={showHotLeadsPanel} on:close={() => (showHotLeadsPanel = false)} on:viewContact={(e) => goto(`/b/${brandId}/messages?phone=${encodeURIComponent(e.detail.phoneNumber)}`)} on:sendMessage={(e) => goto(`/b/${brandId}/messages?phone=${encodeURIComponent(e.detail.phoneNumber)}`)} />
<AddToGroupModal isOpen={showAddToGroup} contactIds={selectedContactIdsForGroup} on:close={() => (showAddToGroup = false)} />
<BulkContactImportModal isOpen={showBulkImport} on:close={() => (showBulkImport = false)} on:imported={() => currentBrand && loadBrandContacts(currentBrand.id)} />
<ContactExportModal isOpen={showExport} brandId={currentBrand?.id || null} on:close={() => (showExport = false)} />

<style>
  .contacts-page {
    padding: 32px 40px;
    height: 100%;
    overflow-y: auto;
    background: #09090b;
    color: #e4e4e7;
  }
  .header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 16px;
  }
  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0;
  }
  .subtitle {
    font-size: 0.85rem;
    color: #71717a;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #d4d4d8;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .action-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.15);
    color: #f4f4f5;
  }
  .action-btn-sm { padding: 4px 10px; font-size: 11px; border-radius: 6px; }

  .action-btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: transparent;
    color: white;
  }
  .action-btn-primary:hover {
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }

  .action-btn-warm { color: #fbbf24; border-color: rgba(251,191,36,0.2); background: rgba(251,191,36,0.08); }
  .action-btn-warm:hover { background: rgba(251,191,36,0.15); }
  
  .action-btn-danger { color: #f87171; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.08); }
  .action-btn-danger:hover { background: rgba(239,68,68,0.15); }

  .action-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.08); margin: 0 4px; }

  .add-contact-card {
    background: #111113;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .card-title { font-size: 1rem; font-weight: 600; margin: 0 0 16px; color: #f4f4f5; }
  .add-form { display: flex; gap: 12px; flex-wrap: wrap; }
  .add-form input {
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f4f4f5;
    font-size: 13px;
    flex: 1;
    min-width: 200px;
  }

  .table-container {
    background: #111113;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    overflow: hidden;
  }
  .table-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .checkbox-label {
    display: flex; align-items: center; gap: 8px; font-size: 13px; color: #a1a1aa; cursor: pointer;
  }
  .checkbox-label input { width: 14px; height: 14px; }

  .contacts-list {
    display: flex;
    flex-direction: column;
  }
  .contact-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.15s;
  }
  .contact-row:hover { background: rgba(255,255,255,0.02); }
  .contact-row:last-child { border-bottom: none; }

  .contact-info { display: flex; align-items: center; gap: 12px; }
  .avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    color: white; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .details { display: flex; flex-direction: column; }
  .name { font-size: 13px; font-weight: 600; color: #e4e4e7; }
  .phone { font-size: 11px; color: #71717a; margin-top: 2px; }

  .contact-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
  .contact-row:hover .contact-actions { opacity: 1; }
  .icon-btn {
    width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; color: #71717a; cursor: pointer;
  }
  .icon-btn:hover { background: rgba(255,255,255,0.08); color: #e4e4e7; }
  .icon-btn-danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }

  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-icon { width: 56px; height: 56px; margin: 0 auto 16px; color: #52525b; background: rgba(255,255,255,0.04); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
  .empty-state h3 { font-size: 1.1rem; color: #f4f4f5; margin: 0 0 8px; }
  .empty-state p { font-size: 0.85rem; color: #71717a; margin: 0; }
  
  .spinner {
    width: 24px; height: 24px; margin: 0 auto 12px;
    border: 2px solid rgba(255,255,255,0.1);
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
