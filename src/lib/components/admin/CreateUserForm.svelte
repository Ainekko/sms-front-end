<script lang="ts">
    /**
     * Create User Form Component
     * ==========================
     * Admin-only form to create new users.
     */
    import { createEventDispatcher } from 'svelte';
    import { authApi } from '$lib/api/auth';
    import type { UserRole } from '$lib/types/auth.types';

    const dispatch = createEventDispatcher<{ 
        success: { email: string; role: UserRole };
        error: { message: string };
    }>();

    // Form state
    let email = '';
    let password = '';
    let confirmPassword = '';
    let role: UserRole = 'user';
    let isLoading = false;
    let error = '';

    /**
     * Handle form submission.
     */
    async function handleSubmit() {
        // Validate
        if (!email.trim()) {
            error = 'Email is required';
            return;
        }
        if (!password) {
            error = 'Password is required';
            return;
        }
        if (password.length < 8) {
            error = 'Password must be at least 8 characters';
            return;
        }
        if (password !== confirmPassword) {
            error = 'Passwords do not match';
            return;
        }

        error = '';
        isLoading = true;

        try {
            const user = await authApi.createUser({
                email: email.trim(),
                password,
                role,
            });
            
            dispatch('success', { email: user.email, role: user.role as UserRole });
            
            // Reset form
            email = '';
            password = '';
            confirmPassword = '';
            role = 'user';
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create user';
            error = message;
            dispatch('error', { message });
        } finally {
            isLoading = false;
        }
    }

    /**
     * Clear error when inputs change.
     */
    function clearError() {
        if (error) error = '';
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="create-user-form">
    <h2 class="form-title">Create New User</h2>

    {#if error}
        <div class="error-message">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{error}</span>
        </div>
    {/if}

    <div class="form-field">
        <label for="new-email" class="field-label">Email</label>
        <input
            type="email"
            id="new-email"
            bind:value={email}
            on:input={clearError}
            placeholder="user@example.com"
            class="field-input"
            disabled={isLoading}
        />
    </div>

    <div class="form-field">
        <label for="new-password" class="field-label">Password</label>
        <input
            type="password"
            id="new-password"
            bind:value={password}
            on:input={clearError}
            placeholder="Minimum 8 characters"
            class="field-input"
            disabled={isLoading}
        />
    </div>

    <div class="form-field">
        <label for="confirm-password" class="field-label">Confirm Password</label>
        <input
            type="password"
            id="confirm-password"
            bind:value={confirmPassword}
            on:input={clearError}
            placeholder="Repeat password"
            class="field-input"
            disabled={isLoading}
        />
    </div>

    <div class="form-field">
        <label for="role" class="field-label">Role</label>
        <select
            id="role"
            bind:value={role}
            class="field-input field-select"
            disabled={isLoading}
        >
            <option value="user">User</option>
            <option value="admin">Admin</option>
        </select>
    </div>

    <button
        type="submit"
        class="submit-button"
        disabled={isLoading}
    >
        {#if isLoading}
            <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
            </svg>
            Creating...
        {:else}
            Create User
        {/if}
    </button>
</form>

<style>
    .create-user-form {
        padding: 1.5rem;
        background: rgba(30, 30, 40, 0.6);
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .form-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0 0 1.5rem 0;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.5rem;
        color: #fca5a5;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .error-icon {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }

    .form-field {
        margin-bottom: 1rem;
    }

    .field-label {
        display: block;
        color: #94a3b8;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.375rem;
    }

    .field-input {
        width: 100%;
        padding: 0.625rem 0.875rem;
        background: rgba(15, 15, 20, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.375rem;
        color: #f1f5f9;
        font-size: 0.9375rem;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }

    .field-input::placeholder {
        color: #64748b;
    }

    .field-input:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .field-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .field-select {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1.25rem;
        padding-right: 2.5rem;
    }

    .submit-button {
        width: 100%;
        padding: 0.75rem 1.25rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        margin-top: 1.25rem;
    }

    .submit-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner {
        width: 1.125rem;
        height: 1.125rem;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>
