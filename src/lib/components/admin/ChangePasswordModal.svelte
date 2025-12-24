<script lang="ts">
  /**
   * Change Password Modal
   * =====================
   * Modal dialog to reset a user's password.
   */
  import { createEventDispatcher, onMount } from 'svelte';

  export let email: string = '';

  const dispatch = createEventDispatcher<{
    close: void;
    save: { password: string };
  }>();

  let password = '';
  let error = '';
  let inputElement: HTMLInputElement;

  onMount(() => {
    if (inputElement) {
      inputElement.focus();
    }
  });

  function handleClose() {
    dispatch('close');
  }

  function handleSave() {
    if (!password) {
      error = 'Password is required';
      return;
    }
    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }
    dispatch('save', { password });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter') {
      handleSave();
    }
  }
</script>

<div
  class="modal-backdrop"
  on:click={handleClose}
  on:keydown={handleKeydown}
  role="button"
  tabindex="-1"
>
  <div class="modal-content" on:click|stopPropagation role="dialog" aria-modal="true">
    <div class="modal-header">
      <h3 class="modal-title">Reset Password</h3>
      <button class="close-button" on:click={handleClose}>
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <div class="modal-body">
      <p class="description">
        Enter a new password for <span class="email">{email}</span>.
      </p>

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      <div class="form-field">
        <label for="new-password" class="field-label">New Password</label>
        <input
          type="password"
          id="new-password"
          bind:this={inputElement}
          bind:value={password}
          placeholder="Minimum 8 characters"
          class="field-input"
          on:input={() => (error = '')}
        />
      </div>
    </div>

    <div class="modal-footer">
      <button class="cancel-button" on:click={handleClose}>Cancel</button>
      <button class="save-button" on:click={handleSave}>Reset Password</button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal-content {
    background: #1e1e28;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    width: 100%;
    max-width: 400px;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.5),
      0 10px 10px -5px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .close-button {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f1f5f9;
  }

  .close-button svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .description {
    margin: 0 0 1.5rem 0;
    color: #94a3b8;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  .email {
    color: #f1f5f9;
    font-weight: 500;
  }

  .error-message {
    padding: 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 0.375rem;
    color: #fca5a5;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    color: #cbd5e1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .field-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    color: #f1f5f9;
    font-size: 0.9375rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .field-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .modal-footer {
    padding: 1.25rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-bottom-left-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
  }

  .cancel-button {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    color: #cbd5e1;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-button:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f1f5f9;
  }

  .save-button {
    padding: 0.5rem 1rem;
    background: #6366f1;
    border: 1px solid #6366f1;
    border-radius: 0.375rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-button:hover {
    background: #4f46e5;
    border-color: #4f46e5;
  }
</style>
