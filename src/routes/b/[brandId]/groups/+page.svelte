<!--
  Groups Page (Brand-Scoped, Dark Theme)
  =======================================
  Master-detail view for managing contact groups.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { groupsApi, type ContactGroup } from '$lib/api/groups';
  import { showSuccess, showError } from '$lib/stores/uiStore';

  // Components
  import CreateGroupModal from '$lib/components/groups/CreateGroupModal.svelte';
  import GroupContactSelectorModal from '$lib/components/groups/GroupContactSelectorModal.svelte';
  import SendToGroupModal from '$lib/components/groups/SendToGroupModal.svelte';
  import GroupValidationProgress from '$lib/components/groups/GroupValidationProgress.svelte';

  $: brandId = $page.params.brandId;

  // State
  let groups: ContactGroup[] = [];
  let selectedGroup: ContactGroup | null = null;
  let isLoading = true;
  let showCreateModal = false;
  let showAddContactsModal = false;
  let showSendModal = false;
  let searchQuery = '';

  // Group Members State
  let groupContacts: any[] = [];
  let isLoadingContacts = false;
  let memberSearchQuery = '';

  $: filteredContacts = groupContacts.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(memberSearchQuery.toLowerCase())) ||
      (c.phone_number && c.phone_number.includes(memberSearchQuery))
  );

  $: filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: selectedGroupId = $page.url.searchParams.get('id');

  $: if (selectedGroupId && groups.length > 0) {
    const group = groups.find((g) => g.id === selectedGroupId);
    if (group && selectedGroup?.id !== group.id) {
      selectedGroup = group;
      loadGroupContacts(group.id);
    }
  } else if (!selectedGroupId) {
    selectedGroup = null;
    groupContacts = [];
  }

  onMount(async () => {
    await loadGroups();
  });

  async function loadGroups() {
    isLoading = true;
    try {
      groups = await groupsApi.listGroups();
      if (selectedGroupId) {
        const group = groups.find((g) => g.id === selectedGroupId);
        if (group) {
          selectedGroup = group;
          loadGroupContacts(group.id);
        }
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
      showError('Failed to load groups');
    } finally {
      isLoading = false;
    }
  }

  function selectGroup(group: ContactGroup) {
    selectedGroup = group;
    const url = new URL(window.location.href);
    url.searchParams.set('id', group.id);
    goto(url.toString(), { keepFocus: true, noScroll: true });
    loadGroupContacts(group.id);
  }

  async function loadGroupContacts(groupId: string) {
    isLoadingContacts = true;
    try {
      groupContacts = await groupsApi.getGroupContacts(groupId);
    } catch (err) {
      console.error('Failed to load group contacts:', err);
    } finally {
      isLoadingContacts = false;
    }
  }

  function handleGroupCreated(event: CustomEvent<{ group: ContactGroup }>) {
    groups = [...groups, event.detail.group];
    selectGroup(event.detail.group);
  }

  function handleContactsAdded() {
    loadGroups();
    if (selectedGroup) {
      groupsApi.getGroup(selectedGroup.id).then((updatedGroup) => {
        selectedGroup = updatedGroup;
        groups = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
      });
      loadGroupContacts(selectedGroup.id);
    }
  }

  async function handleDeleteGroup(group: ContactGroup) {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) return;
    try {
      await groupsApi.deleteGroup(group.id);
      showSuccess('Group deleted successfully');
      groups = groups.filter((g) => g.id !== group.id);
      if (selectedGroup?.id === group.id) {
        selectedGroup = null;
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        goto(url.toString(), { keepFocus: true, noScroll: true });
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
      showError('Failed to delete group');
    }
  }
</script>

<svelte:head>
  <title>Groups | Broadr</title>
</svelte:head>

<div class="groups-shell">
  <!-- Groups Sidebar -->
  <aside class="groups-sidebar">
    <div class="gsb-header">
      <div class="gsb-title-row">
        <h2 class="gsb-title">Groups</h2>
        <button class="gsb-add-btn" on:click={() => (showCreateModal = true)} title="Create Group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>
      <div class="gsb-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" bind:value={searchQuery} placeholder="Search groups..." />
      </div>
    </div>

    <div class="gsb-list">
      {#if isLoading}
        <div class="gsb-loading"><div class="spinner"></div></div>
      {:else if groups.length === 0}
        <div class="gsb-empty">
          <p class="gsb-empty-title">No groups yet</p>
          <p class="gsb-empty-desc">Create a group to organize contacts</p>
          <button class="gsb-empty-btn" on:click={() => (showCreateModal = true)}>Create Group</button>
        </div>
      {:else if filteredGroups.length === 0}
        <div class="gsb-empty">
          <p class="gsb-empty-desc">No groups match your search</p>
        </div>
      {:else}
        {#each filteredGroups as group (group.id)}
          <button class="gsb-item" class:selected={selectedGroup?.id === group.id} on:click={() => selectGroup(group)}>
            <div class="gsb-item-icon" class:selected={selectedGroup?.id === group.id}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={selectedGroup?.id === group.id ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div class="gsb-item-info">
              <span class="gsb-item-name">{group.name}</span>
              <span class="gsb-item-count">{group.contact_count} member{group.contact_count !== 1 ? 's' : ''}</span>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </aside>

  <!-- Main Detail Panel -->
  <main class="groups-main">
    {#if selectedGroup}
      <!-- Group Header -->
      <div class="gm-header">
        <div class="gm-header-left">
          <h2 class="gm-title">{selectedGroup.name}</h2>
          {#if selectedGroup.description}
            <p class="gm-desc">{selectedGroup.description}</p>
          {/if}
        </div>
        <div class="gm-actions">
          <button class="btn btn-danger-ghost" on:click={() => handleDeleteGroup(selectedGroup)}>Delete</button>
          <button class="btn btn-outline" on:click={() => (showSendModal = true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            Send Message
          </button>
          <button class="btn btn-primary" on:click={() => (showAddContactsModal = true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
            Add Members
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="gm-stats">
        <div class="stat-card">
          <span class="stat-label">Members</span>
          <span class="stat-value">{selectedGroup.contact_count}</span>
        </div>
        <div class="stat-card muted">
          <span class="stat-label">Messages Sent</span>
          <span class="stat-value">—</span>
        </div>
        <div class="stat-card muted">
          <span class="stat-label">Last Active</span>
          <span class="stat-value">—</span>
        </div>
      </div>

      <!-- Validation -->
      <div class="gm-section">
        <GroupValidationProgress group={selectedGroup} on:refresh={loadGroups} />
      </div>

      <!-- Members Table -->
      <div class="gm-members">
        <div class="gm-members-header">
          <h3>Members</h3>
          <div class="gm-members-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input bind:value={memberSearchQuery} placeholder="Search members..." />
          </div>
        </div>
        <div class="gm-members-list">
          {#if isLoadingContacts}
            <div class="gsb-loading"><div class="spinner"></div></div>
          {:else if groupContacts.length === 0}
            <div class="gsb-empty" style="padding:40px 0">
              <p class="gsb-empty-title">No members yet</p>
              <p class="gsb-empty-desc">Add contacts to this group to start.</p>
              <button class="gsb-empty-btn" on:click={() => (showAddContactsModal = true)}>Add Members</button>
            </div>
          {:else}
            {#each filteredContacts as contact}
              <div class="member-row">
                <div class="member-avatar">
                  {contact.name ? contact.name.charAt(0).toUpperCase() : '#'}
                </div>
                <div class="member-info">
                  <span class="member-name">{contact.name || 'Unknown'}</span>
                  <span class="member-phone">{contact.phone_number || contact.phoneNumber}</span>
                </div>
                <button
                  class="member-remove"
                  title="Remove"
                  on:click={async () => {
                    if (!confirm('Remove this contact from the group?')) return;
                    try {
                      await groupsApi.removeContactFromGroup(selectedGroup.id, contact.id);
                      showSuccess('Contact removed');
                      loadGroupContacts(selectedGroup.id);
                      groupsApi.getGroup(selectedGroup.id).then((u) => {
                        selectedGroup = u;
                        groups = groups.map((g) => g.id === u.id ? u : g);
                      });
                    } catch (e) { showError('Failed to remove contact'); }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="gm-empty">
        <div class="gm-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3>Select a Group</h3>
        <p>Choose a group from the sidebar to view and manage its members.</p>
      </div>
    {/if}
  </main>
</div>

<CreateGroupModal isOpen={showCreateModal} on:close={() => (showCreateModal = false)} on:created={handleGroupCreated} />

{#if selectedGroup}
  <GroupContactSelectorModal isOpen={showAddContactsModal} groupId={selectedGroup.id} on:close={() => (showAddContactsModal = false)} on:added={handleContactsAdded} />
  <SendToGroupModal isOpen={showSendModal} groupId={selectedGroup.id} groupName={selectedGroup.name} on:close={() => (showSendModal = false)} />
{/if}

<style>
  .groups-shell {
    display: flex;
    height: 100%;
    overflow: hidden;
    background: #09090b;
  }

  /* ===== Groups Sidebar ===== */
  .groups-sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #111113;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .gsb-header { padding: 20px 16px 16px; }
  .gsb-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .gsb-title {
    font-size: 1rem;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0;
  }
  .gsb-add-btn {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: rgba(99,102,241,0.12);
    color: #818cf8;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .gsb-add-btn:hover { background: rgba(99,102,241,0.2); }

  .gsb-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    color: #52525b;
  }
  .gsb-search input {
    flex: 1; border: none; outline: none;
    background: transparent; color: #e4e4e7;
    font-size: 0.78rem;
  }
  .gsb-search input::placeholder { color: #3f3f46; }

  .gsb-list { flex: 1; overflow-y: auto; padding: 4px 8px; }

  .gsb-loading {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.08);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .gsb-empty { text-align: center; padding: 40px 16px; }
  .gsb-empty-title { font-size: 0.85rem; font-weight: 600; color: #f4f4f5; margin: 0 0 4px; }
  .gsb-empty-desc { font-size: 0.75rem; color: #52525b; margin: 0 0 12px; }
  .gsb-empty-btn {
    padding: 6px 14px; border-radius: 8px;
    background: rgba(99,102,241,0.12); color: #818cf8;
    font-size: 0.75rem; font-weight: 600;
    border: none; cursor: pointer;
    transition: all 0.15s;
  }
  .gsb-empty-btn:hover { background: rgba(99,102,241,0.2); }

  .gsb-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    margin-bottom: 2px;
  }
  .gsb-item:hover { background: rgba(255,255,255,0.04); }
  .gsb-item.selected { background: rgba(99,102,241,0.1); }

  .gsb-item-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    color: #71717a;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .gsb-item-icon.selected {
    background: rgba(99,102,241,0.15);
    color: #818cf8;
  }
  .gsb-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .gsb-item-name { font-size: 0.8rem; font-weight: 600; color: #e4e4e7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gsb-item-count { font-size: 0.7rem; color: #52525b; margin-top: 1px; }

  /* ===== Main Panel ===== */
  .groups-main {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .gm-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 28px 32px;
    flex-shrink: 0;
    gap: 20px;
    flex-wrap: wrap;
  }
  .gm-title { font-size: 1.5rem; font-weight: 700; color: #f4f4f5; margin: 0 0 4px; }
  .gm-desc { font-size: 0.8rem; color: #71717a; margin: 0; }
  .gm-actions { display: flex; gap: 8px; flex-shrink: 0; }

  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 9px;
    font-size: 0.78rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s; border: none;
  }
  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
  }
  .btn-primary:hover { box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
  .btn-outline {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: #d4d4d8;
  }
  .btn-outline:hover { background: rgba(255,255,255,0.05); }
  .btn-danger-ghost { background: transparent; color: #f87171; }
  .btn-danger-ghost:hover { background: rgba(239,68,68,0.08); }

  .gm-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 0 32px 20px;
  }
  .stat-card {
    padding: 16px 20px;
    border-radius: 12px;
    background: #111113;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column; gap: 4px;
  }
  .stat-card.muted { opacity: 0.5; }
  .stat-label { font-size: 0.72rem; color: #71717a; font-weight: 500; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: #f4f4f5; }

  .gm-section { padding: 0 32px 20px; }

  /* Members */
  .gm-members {
    flex: 1;
    margin: 0 32px 32px;
    border-radius: 14px;
    background: #111113;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    min-height: 300px;
  }
  .gm-members-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .gm-members-header h3 { font-size: 0.9rem; font-weight: 600; color: #f4f4f5; margin: 0; }
  .gm-members-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    color: #52525b;
  }
  .gm-members-search input {
    border: none; outline: none;
    background: transparent; color: #e4e4e7;
    font-size: 0.75rem; width: 180px;
  }
  .gm-members-search input::placeholder { color: #3f3f46; }

  .gm-members-list { flex: 1; overflow-y: auto; }

  .member-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.15s;
  }
  .member-row:hover { background: rgba(255,255,255,0.02); }
  .member-row:last-child { border-bottom: none; }

  .member-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700;
    flex-shrink: 0;
  }
  .member-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .member-name { font-size: 0.8rem; font-weight: 600; color: #e4e4e7; }
  .member-phone { font-size: 0.7rem; color: #52525b; margin-top: 1px; }

  .member-remove {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: #52525b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.15s;
  }
  .member-row:hover .member-remove { opacity: 1; }
  .member-remove:hover { background: rgba(239,68,68,0.1); color: #f87171; }

  /* Empty Main */
  .gm-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px;
  }
  .gm-empty-icon {
    width: 80px; height: 80px;
    border-radius: 24px;
    background: rgba(99,102,241,0.08);
    color: #818cf8;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }
  .gm-empty h3 { font-size: 1.2rem; font-weight: 600; color: #f4f4f5; margin: 0 0 8px; }
  .gm-empty p { font-size: 0.85rem; color: #52525b; margin: 0; max-width: 360px; }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
