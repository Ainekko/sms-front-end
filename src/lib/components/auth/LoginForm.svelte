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

<form on:submit|preventDefault={handleSubmit} class="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
    <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
        <p class="text-slate-400 text-sm">Sign in to your account</p>
    </div>

    {#if formError}
        <div class="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
            <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{formError}</span>
        </div>
    {/if}

    <div class="mb-5">
        <label for="email" class="block text-slate-300 text-sm font-medium mb-2">Email</label>
        <input
            type="email"
            id="email"
            bind:value={email}
            placeholder="you@example.com"
            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={$isAuthLoading}
            autocomplete="email"
        />
    </div>

    <div class="mb-6">
        <label for="password" class="block text-slate-300 text-sm font-medium mb-2">Password</label>
        <input
            type="password"
            id="password"
            bind:value={password}
            placeholder="••••••••"
            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={$isAuthLoading}
            autocomplete="current-password"
        />
    </div>

    <button
        type="submit"
        class="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        disabled={$isAuthLoading}
    >
        {#if $isAuthLoading}
            <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" class="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75" />
            </svg>
            <span>Signing in...</span>
        {:else}
            <span>Sign In</span>
        {/if}
    </button>

    <p class="mt-6 text-center text-sm text-slate-400">
        Don't have an account?
        <a href="/signup" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create one
        </a>
    </p>
</form>
