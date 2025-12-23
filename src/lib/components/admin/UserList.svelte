<script lang="ts">
  /**
   * User List Component
   * ===================
   * Displays all users for admin management.
   */
  import { onMount } from 'svelte';
  import { authApi } from '$lib/api/auth';
  import type { User } from '$lib/types/auth.types';
  import UserCard from './UserCard.svelte';

  export let users: User[] = [];
  export let isLoading = false;
  export let error = '';

  /**
   * Handle user promotion.
   */
  async function handlePromote(event: CustomEvent<{ userId: string }>) {
    const { userId } = event.detail;
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      const updated = await authApi.promoteUser(userId);
      // Update local list
      users = users.map((u) =>
        u.id === userId ? { ...u, role: updated.role as User['role'] } : u
      );
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to promote user';
    }
  }
</script>

<div class="user-list">
  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading users...</span>
    </div>
  {:else if error}
    <div class="error-state">
      <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{error}</span>
    </div>
  {:else if users.length === 0}
    <div class="empty-state">
      <svg
        class="empty-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
      <span>No users found</span>
    </div>
  {:else}
    <div class="list-header">
      <span class="user-count">{users.length} user{users.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="list-content">
      {#each users as user (user.id)}
        <UserCard {user} on:promote={handlePromote} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .user-list {
    background: rgba(20, 20, 28, 0.6);
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .list-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .user-count {
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .list-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: rgba(255, 255, 255, 0.02);
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 1.5rem;
    color: #64748b;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .error-state {
    color: #f87171;
  }

  .error-icon,
  .empty-icon {
    width: 2.5rem;
    height: 2.5rem;
    opacity: 0.7;
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
