<script lang="ts">
  /**
   * Admin Dashboard
   * ===============
   * Admin-only page for user management.
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    authStore,
    isAuthenticated,
    isAdmin,
    isAuthInitialized,
    currentUser,
    showSuccess,
    showError
  } from '$lib/stores';
  import { authApi } from '$lib/api/auth';
  import { usersApi } from '$lib/api/users';
  import type { User } from '$lib/types/auth.types';
  import CreateUserForm from '$lib/components/admin/CreateUserForm.svelte';
  import UserList from '$lib/components/admin/UserList.svelte';

  let users: User[] = [];
  let isLoadingUsers = true;
  let usersError = '';

  // Redirect if not authenticated or not admin
  $: if ($isAuthInitialized) {
    if (!$isAuthenticated) {
      goto('/login');
    } else if (!$isAdmin) {
      goto('/messages');
    }
  }

  onMount(async () => {
    if ($isAdmin) {
      await loadUsers();
    }
  });

  /**
   * Load all users.
   */
  async function loadUsers() {
    isLoadingUsers = true;
    usersError = '';

    try {
      users = await usersApi.getUsers();
    } catch (err) {
      usersError = err instanceof Error ? err.message : 'Failed to load users';
    } finally {
      isLoadingUsers = false;
    }
  }

  /**
   * Handle user created.
   */
  function handleUserCreated(event: CustomEvent<{ email: string }>) {
    showSuccess(`User ${event.detail.email} created successfully`);
    loadUsers(); // Refresh list
  }

  /**
   * Handle creation error.
   */
  function handleCreateError(event: CustomEvent<{ message: string }>) {
    showError(event.detail.message);
  }

  /**
   * Navigate back to messages.
   */
  function goBack() {
    goto('/messages');
  }

  /**
   * Logout handler.
   */
  function handleLogout() {
    authStore.logout();
    goto('/login');
  }
</script>

<svelte:head>
  <title>Admin Dashboard | SMS Manager</title>
</svelte:head>

{#if $isAuthInitialized && $isAuthenticated && $isAdmin}
  <div class="admin-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <button class="back-button" on:click={goBack}>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <h1 class="page-title">Admin Dashboard</h1>
      </div>
      <div class="header-right">
        <span class="user-email">{$currentUser?.email}</span>
        <button class="logout-button" on:click={handleLogout}> Logout </button>
      </div>
    </header>

    <!-- Content -->
    <main class="page-content">
      <div class="content-grid">
        <!-- Create User Section -->
        <section class="section">
          <CreateUserForm on:success={handleUserCreated} on:error={handleCreateError} />
        </section>

        <!-- Users List Section -->
        <section class="section users-section">
          <div class="section-header">
            <h2 class="section-title">All Users</h2>
            <button class="refresh-button" on:click={loadUsers}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clip-rule="evenodd"
                />
              </svg>
              Refresh
            </button>
          </div>
          <UserList {users} isLoading={isLoadingUsers} error={usersError} />
        </section>
      </div>
    </main>
  </div>
{:else}
  <div class="loading-page">
    <div class="spinner"></div>
  </div>
{/if}

<style>
  .admin-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0f14 0%, #1a1a2e 50%, #16213e 100%);
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: rgba(20, 20, 28, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-button {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
  }

  .back-button svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-email {
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .logout-button {
    padding: 0.5rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 0.375rem;
    color: #f87171;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-button:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .page-content {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 2rem;
    align-items: start;
  }

  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  .section {
    display: flex;
    flex-direction: column;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .refresh-button {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    color: #94a3b8;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
  }

  .refresh-button svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  .loading-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f0f14;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
