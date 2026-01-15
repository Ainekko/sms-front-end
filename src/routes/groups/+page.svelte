<!--
  Groups Page
  ===========
  Master-detail view for managing contact groups.
  Redesigned for a premium, modern look.
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

  // Filtered groups
  $: filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // URL State Management
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

      // If ID in URL, select it and load its contacts
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
      // Don't show error toast to avoid spamming if it fails silently
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

  function handleBack() {
    goto('/messages');
  }
</script>

<div class="flex h-screen bg-gray-50 font-sans overflow-hidden">
  <!-- Sidebar -->
  <aside
    class="w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
  >
    <!-- Header -->
    <div class="p-6 border-b border-gray-100">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-3">
          <button
            class="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            on:click={handleBack}
            title="Back to Messages"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900 tracking-tight">Groups</h1>
        </div>
        <button
          class="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm hover:shadow-md"
          on:click={() => (showCreateModal = true)}
          title="Create Group"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <!-- Search -->
      <div class="relative group">
        <svg
          class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search groups..."
          class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900
                 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
        />
      </div>
    </div>

    <!-- Group List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      {#if isLoading}
        <div class="flex justify-center py-12">
          <div
            class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
      {:else if groups.length === 0}
        <div class="text-center py-12 px-4">
          <div
            class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-blue-500"
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
          </div>
          <p class="text-base font-semibold text-gray-900">No groups yet</p>
          <p class="text-sm text-gray-500 mt-1 mb-6">Create a group to organize your contacts</p>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
            on:click={() => (showCreateModal = true)}
          >
            Create Group
          </button>
        </div>
      {:else if filteredGroups.length === 0}
        <div class="text-center py-12">
          <p class="text-gray-500">No groups match your search</p>
        </div>
      {:else}
        {#each filteredGroups as group (group.id)}
          <button
            class="w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden
                   {selectedGroup?.id === group.id ? 'bg-blue-50 shadow-sm' : 'hover:bg-gray-50'}"
            on:click={() => selectGroup(group)}
          >
            {#if selectedGroup?.id === group.id}
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
              ></div>
            {/if}

            <!-- Folder Icon -->
            <div
              class="flex-shrink-0 transition-transform duration-200 {selectedGroup?.id === group.id
                ? 'scale-110'
                : 'group-hover:scale-105'}"
            >
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center
                          {selectedGroup?.id === group.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'}"
              >
                <svg
                  class="w-5 h-5"
                  fill={selectedGroup?.id === group.id ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-semibold truncate {selectedGroup?.id === group.id
                  ? 'text-gray-900'
                  : 'text-gray-700'}"
              >
                {group.name}
              </p>
              <p
                class="text-xs truncate mt-0.5 {selectedGroup?.id === group.id
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500'}"
              >
                {group.contact_count} member{group.contact_count !== 1 ? 's' : ''}
              </p>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col min-w-0 bg-gray-50 relative overflow-hidden">
    <!-- Background Decoration -->
    <div
      class="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-white to-transparent pointer-events-none"
    ></div>

    {#if selectedGroup}
      <!-- Group Header -->
      <div class="relative px-8 py-8 flex-shrink-0 z-10">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-3 mb-2">
              <h2 class="text-3xl font-bold text-gray-900 tracking-tight">{selectedGroup.name}</h2>
              <span
                class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider"
              >
                Group
              </span>
            </div>
            {#if selectedGroup.description}
              <p class="text-gray-500 max-w-2xl text-lg leading-relaxed">
                {selectedGroup.description}
              </p>
            {/if}
          </div>
          <div class="flex items-center space-x-3">
            <button
              class="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
              on:click={() => handleDeleteGroup(selectedGroup)}
            >
              Delete
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-green-600 bg-white border border-green-100 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all shadow-sm flex items-center space-x-2"
              on:click={() => (showSendModal = true)}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>Send Message</span>
            </button>
            <button
              class="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/20 flex items-center space-x-2"
              on:click={() => (showAddContactsModal = true)}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Members</span>
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-6 mt-8">
          <div
            class="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Total Members</p>
            <p class="text-3xl font-bold text-gray-900">{selectedGroup.contact_count}</p>
          </div>
          <!-- Placeholders for future stats -->
          <div
            class="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 opacity-60"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Messages Sent</p>
            <p class="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div
            class="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 opacity-60"
          >
            <p class="text-sm font-medium text-gray-500 mb-1">Last Active</p>
            <p class="text-3xl font-bold text-gray-900">-</p>
          </div>
        </div>

        <!-- Validation Panel -->
        <div class="mt-6">
          <GroupValidationProgress group={selectedGroup} on:refresh={loadGroups} />
        </div>
      </div>

      <!-- Group Content -->
      <div class="flex-1 px-8 pb-8 overflow-y-auto z-10">
        <div
          class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 min-h-[400px] flex flex-col"
        >
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900">Members</h3>
            <div class="relative">
              <input
                bind:value={memberSearchQuery}
                placeholder="Search members..."
                class="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <svg
                class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <!-- Members List -->
          <div class="flex-1 overflow-y-auto">
            {#if isLoadingContacts}
              <div class="flex justify-center py-12">
                <div
                  class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                ></div>
              </div>
            {:else if groupContacts.length === 0}
              <div class="flex flex-col items-center justify-center p-8 text-center h-full">
                <div
                  class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"
                >
                  <svg
                    class="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h4 class="text-lg font-medium text-gray-900 mb-2">No members yet</h4>
                <p class="text-gray-500 max-w-md mb-6">
                  Add contacts to this group to start managing them.
                </p>
                <button
                  class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  on:click={() => (showAddContactsModal = true)}
                >
                  Add Members
                </button>
              </div>
            {:else if filteredContacts.length === 0}
              <div class="text-center py-12">
                <p class="text-gray-500">No members match your search</p>
              </div>
            {:else}
              <div class="divide-y divide-gray-100">
                {#each filteredContacts as contact}
                  <div
                    class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div class="flex items-center space-x-4">
                      <div
                        class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                      >
                        {contact.name ? contact.name.charAt(0).toUpperCase() : '#'}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">{contact.name || 'Unknown'}</p>
                        <p class="text-xs text-gray-500">
                          {contact.phone_number || contact.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <div
                      class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from group"
                        on:click={async () => {
                          if (!confirm('Remove this contact from the group?')) return;
                          try {
                            await groupsApi.removeContactFromGroup(selectedGroup.id, contact.id);
                            showSuccess('Contact removed');
                            loadGroupContacts(selectedGroup.id);
                            // Update count
                            groupsApi.getGroup(selectedGroup.id).then((updatedGroup) => {
                              selectedGroup = updatedGroup;
                              groups = groups.map((g) =>
                                g.id === updatedGroup.id ? updatedGroup : g
                              );
                            });
                          } catch (e) {
                            showError('Failed to remove contact');
                          }
                        }}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
        <div
          class="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          <svg
            class="w-16 h-16 text-blue-500"
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
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">Select a Group</h3>
        <p class="text-gray-500 max-w-md text-lg leading-relaxed">
          Choose a group from the sidebar to view details and manage members, or create a new group
          to get started.
        </p>
      </div>
    {/if}
  </main>
</div>

<CreateGroupModal
  isOpen={showCreateModal}
  on:close={() => (showCreateModal = false)}
  on:created={handleGroupCreated}
/>

{#if selectedGroup}
  <GroupContactSelectorModal
    isOpen={showAddContactsModal}
    groupId={selectedGroup.id}
    on:close={() => (showAddContactsModal = false)}
    on:added={handleContactsAdded}
  />

  <SendToGroupModal
    isOpen={showSendModal}
    groupId={selectedGroup.id}
    groupName={selectedGroup.name}
    on:close={() => (showSendModal = false)}
  />
{/if}
