<script lang="ts">
  /**
   * User Card Component
   * ===================
   * Displays user info with promote action for admins.
   */
  import { createEventDispatcher } from 'svelte';
  import type { User } from '$lib/types/auth.types';
  import { format } from 'date-fns';

  export let user: User;
  export let canPromote: boolean = true;

  const dispatch = createEventDispatcher<{
    promote: { userId: string };
    depromote: { userId: string };
    delete: { userId: string };
    resetPassword: { userId: string };
  }>();

  let isPromoting = false;
  let isDepromoting = false;
  let isDeleting = false;
  let isResetting = false;

  /**
   * Format the creation date.
   */
  function formatDate(dateStr: string): string {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  }

  /**
   * Handle promote button click.
   */
  function handlePromote() {
    dispatch('promote', { userId: user.id });
  }

  function handleDepromote() {
    dispatch('depromote', { userId: user.id });
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this user?')) {
      dispatch('delete', { userId: user.id });
    }
  }

  function handleResetPassword() {
    dispatch('resetPassword', { userId: user.id });
  }
</script>

<div class="user-card">
  <div class="user-info">
    <div class="user-avatar" class:admin={user.role === 'admin'}>
      {user.email[0].toUpperCase()}
    </div>
    <div class="user-details">
      <span class="user-email">{user.email}</span>
      <div class="user-meta">
        <span class="user-role" class:admin={user.role === 'admin'}>
          {user.role}
        </span>
        <span class="separator">•</span>
        <span class="user-date">Joined {formatDate(user.created_at)}</span>
        {#if !user.is_active}
          <span class="separator">•</span>
          <span class="user-inactive">Inactive</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="user-actions">
    {#if user.role !== 'admin' && canPromote}
      <div class="action-group">
        <button class="action-button promote" on:click={handlePromote} disabled={isPromoting}>
          {#if isPromoting}Promoting...{:else}Promote{/if}
        </button>
        <button class="action-button delete" on:click={handleDelete} disabled={isDeleting}>
          {#if isDeleting}Deleting...{:else}Delete{/if}
        </button>
        <button class="action-button reset" on:click={handleResetPassword} disabled={isResetting}>
          {#if isResetting}Resetting...{:else}Reset PW{/if}
        </button>
      </div>
    {:else if user.role === 'admin'}
      <div class="action-group">
        <span class="admin-badge">
          <svg class="badge-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          Admin
        </span>
        {#if canPromote} <!-- Reuse canPromote prop for general admin actions permission -->
          <button class="action-button depromote" on:click={handleDepromote} disabled={isDepromoting}>
            {#if isDepromoting}Depromoting...{:else}Depromote{/if}
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .user-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: rgba(30, 30, 40, 0.5);
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.2s ease;
  }

  .user-card:hover {
    background: rgba(40, 40, 50, 0.6);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }

  .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: white;
    font-size: 1rem;
  }

  .user-avatar.admin {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  .user-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .user-email {
    color: #f1f5f9;
    font-weight: 500;
    font-size: 0.9375rem;
  }

  .user-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: #64748b;
  }

  .separator {
    color: #475569;
  }

  .user-role {
    text-transform: capitalize;
    color: #94a3b8;
  }

  .user-role.admin {
    color: #fbbf24;
  }

  .user-inactive {
    color: #ef4444;
  }

  .user-actions {
    display: flex;
    align-items: center;
  }

  .action-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .action-button {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-button.promote {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
  }
  .action-button.promote:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.25);
  }

  .action-button.depromote {
    background: rgba(251, 191, 36, 0.15);
    border-color: rgba(251, 191, 36, 0.3);
    color: #fbbf24;
  }
  .action-button.depromote:hover:not(:disabled) {
    background: rgba(251, 191, 36, 0.25);
  }

  .action-button.delete {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
    color: #f87171;
  }
  .action-button.delete:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25);
  }

  .action-button.reset {
    background: rgba(148, 163, 184, 0.15);
    border-color: rgba(148, 163, 184, 0.3);
    color: #cbd5e1;
  }
  .action-button.reset:hover:not(:disabled) {
    background: rgba(148, 163, 184, 0.25);
  }

  .admin-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.2);
    border-radius: 9999px;
    color: #fbbf24;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .badge-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
</style>
