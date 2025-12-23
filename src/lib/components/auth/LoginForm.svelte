<script lang="ts">
    /**
     * Login Form Component
     * ====================
     * Email/password login form with validation and error display.
     */
    import { createEventDispatcher } from 'svelte';
    import { authStore, authError, isAuthLoading } from '$lib/stores';

    const dispatch = createEventDispatcher<{ success: void }>();

    // Form state
    let email = '';
    let password = '';
    let formError = '';

    // Reactive: clear form error when auth error changes
    $: if ($authError) {
        formError = $authError;
    }

    /**
     * Handle form submission.
     */
    async function handleSubmit() {
        // Validate
        if (!email.trim()) {
            formError = 'Email is required';
            return;
        }
        if (!password) {
            formError = 'Password is required';
            return;
        }

        formError = '';
        authStore.clearError();

        const success = await authStore.login(email, password);
        
        if (success) {
            dispatch('success');
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="login-form">
    <div class="form-header">
        <h1 class="form-title">Welcome Back</h1>
        <p class="form-subtitle">Sign in to your account</p>
    </div>

    {#if formError}
        <div class="error-message">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{formError}</span>
        </div>
    {/if}

    <div class="form-field">
        <label for="email" class="field-label">Email</label>
        <input
            type="email"
            id="email"
            bind:value={email}
            placeholder="you@example.com"
            class="field-input"
            disabled={$isAuthLoading}
            autocomplete="email"
        />
    </div>

    <div class="form-field">
        <label for="password" class="field-label">Password</label>
        <input
            type="password"
            id="password"
            bind:value={password}
            placeholder="••••••••"
            class="field-input"
            disabled={$isAuthLoading}
            autocomplete="current-password"
        />
    </div>

    <button
        type="submit"
        class="submit-button"
        disabled={$isAuthLoading}
    >
        {#if $isAuthLoading}
            <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
            </svg>
            Signing in...
        {:else}
            Sign In
        {/if}
    </button>
</form>

<style>
    .login-form {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        background: linear-gradient(145deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95));
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
    }

    .form-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .form-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 0.5rem 0;
    }

    .form-subtitle {
        color: #94a3b8;
        margin: 0;
        font-size: 0.875rem;
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
        margin-bottom: 1.5rem;
    }

    .error-icon {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }

    .form-field {
        margin-bottom: 1.25rem;
    }

    .field-label {
        display: block;
        color: #cbd5e1;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }

    .field-input {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(15, 15, 20, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        color: #f1f5f9;
        font-size: 1rem;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }

    .field-input::placeholder {
        color: #64748b;
    }

    .field-input:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    .field-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .submit-button {
        width: 100%;
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        font-weight: 600;
        font-size: 1rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        margin-top: 1.5rem;
    }

    .submit-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
    }

    .submit-button:active:not(:disabled) {
        transform: translateY(0);
    }

    .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner {
        width: 1.25rem;
        height: 1.25rem;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>
