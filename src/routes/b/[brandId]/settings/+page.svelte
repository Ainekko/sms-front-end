<script lang="ts">
  /**
   * Settings Page
   * ==============
   * User account settings — Twilio credentials, account info, plan details.
   */
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { settingsApi, type UserSettings } from '$lib/api/settings';
  import { authStore, currentUser } from '$lib/stores';

  let settings: UserSettings | null = null;
  let loading = true;
  let error = '';

  // Twilio form
  let twilioSid = '';
  let twilioToken = '';
  let saving = false;
  let saveSuccess = false;
  let saveError = '';
  let showTokenField = false;
  let removing = false;

  onMount(async () => {
    try {
      settings = await settingsApi.getSettings();
    } catch (e: any) {
      error = e.message || 'Failed to load settings';
    } finally {
      loading = false;
    }
  });

  async function handleSaveTwilio() {
    if (!twilioSid.trim() || !twilioToken.trim()) {
      saveError = 'Both fields are required';
      return;
    }
    if (!twilioSid.startsWith('AC')) {
      saveError = 'Account SID must start with "AC"';
      return;
    }
    saving = true;
    saveError = '';
    saveSuccess = false;
    try {
      settings = await settingsApi.saveTwilioSettings({
        twilio_account_sid: twilioSid.trim(),
        twilio_auth_token: twilioToken.trim()
      });
      saveSuccess = true;
      twilioSid = '';
      twilioToken = '';
      showTokenField = false;
      // Refresh user data so has_twilio updates in sidebar
      await authStore.refreshUser();
      setTimeout(() => (saveSuccess = false), 4000);
    } catch (e: any) {
      saveError = e.message || 'Failed to save credentials';
    } finally {
      saving = false;
    }
  }

  async function handleRemoveTwilio() {
    if (!confirm('Remove your Twilio credentials? You will not be able to send or receive messages.')) return;
    removing = true;
    try {
      await settingsApi.removeTwilioSettings();
      settings = await settingsApi.getSettings();
      await authStore.refreshUser();
    } catch (e: any) {
      saveError = e.message || 'Failed to remove credentials';
    } finally {
      removing = false;
    }
  }
</script>

<svelte:head>
  <title>Settings | Broadr</title>
</svelte:head>

<div class="settings-page">
  <div class="settings-header">
    <h1 class="settings-title">Settings</h1>
    <p class="settings-subtitle">Manage your account and integrations</p>
  </div>

  {#if loading}
    <div class="settings-loading">
      <div class="spin"></div>
      <span>Loading settings…</span>
    </div>
  {:else if error}
    <div class="settings-error">{error}</div>
  {:else if settings}
    <div class="settings-grid">

      <!-- Twilio Integration Card -->
      <div class="card card-twilio">
        <div class="card-header">
          <div class="card-icon twilio-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div class="card-header-text">
            <h2 class="card-title">Twilio Integration</h2>
            <p class="card-desc">Connect your Twilio account to send and receive SMS messages.</p>
          </div>
          {#if settings.has_twilio}
            <span class="status-badge connected">
              <span class="status-dot"></span>
              Connected
            </span>
          {:else}
            <span class="status-badge disconnected">
              <span class="status-dot"></span>
              Not Connected
            </span>
          {/if}
        </div>

        {#if settings.has_twilio && !showTokenField}
          <!-- Show current masked credentials -->
          <div class="cred-display">
            <div class="cred-row">
              <span class="cred-label">Account SID</span>
              <span class="cred-value">{settings.twilio_account_sid_masked}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Auth Token</span>
              <span class="cred-value">{settings.twilio_auth_token_masked}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline" on:click={() => (showTokenField = true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Update Credentials
            </button>
            <button class="btn btn-danger-ghost" on:click={handleRemoveTwilio} disabled={removing}>
              {removing ? 'Removing…' : 'Disconnect'}
            </button>
          </div>
        {:else}
          <!-- Credential entry form -->
          <form class="cred-form" on:submit|preventDefault={handleSaveTwilio}>
            <div class="form-field">
              <label for="twilio-sid">Account SID</label>
              <input id="twilio-sid" type="text" bind:value={twilioSid} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" disabled={saving} autocomplete="off" />
              <span class="field-hint">Found in your <a href="https://console.twilio.com/" target="_blank" rel="noopener">Twilio Console</a></span>
            </div>
            <div class="form-field">
              <label for="twilio-token">Auth Token</label>
              <input id="twilio-token" type="password" bind:value={twilioToken} placeholder="Your auth token" disabled={saving} autocomplete="off" />
              <span class="field-hint">Keep this secret — it's stored securely on our servers</span>
            </div>

            {#if saveError}
              <div class="form-error" transition:fly={{ y: -5, duration: 200 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                {saveError}
              </div>
            {/if}

            {#if saveSuccess}
              <div class="form-success" transition:fly={{ y: -5, duration: 200 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                Twilio credentials saved successfully!
              </div>
            {/if}

            <div class="form-actions">
              {#if settings.has_twilio}
                <button type="button" class="btn btn-ghost" on:click={() => (showTokenField = false)} disabled={saving}>Cancel</button>
              {/if}
              <button type="submit" class="btn btn-primary" disabled={saving || !twilioSid.trim() || !twilioToken.trim()}>
                {#if saving}
                  <div class="btn-spin"></div>
                  Saving…
                {:else}
                  Save Credentials
                {/if}
              </button>
            </div>
          </form>
        {/if}
      </div>

      <!-- Account Info Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-icon account-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="card-header-text">
            <h2 class="card-title">Account</h2>
            <p class="card-desc">Your account details and subscription plan.</p>
          </div>
        </div>
        <div class="cred-display">
          <div class="cred-row">
            <span class="cred-label">Email</span>
            <span class="cred-value">{settings.email}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Role</span>
            <span class="cred-value capitalize">{settings.role}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Plan</span>
            <span class="cred-value">
              <span class="plan-badge {settings.plan}">{settings.plan}</span>
            </span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Member Since</span>
            <span class="cred-value">{new Date(settings.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <!-- Webhook Info Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-icon webhook-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </div>
          <div class="card-header-text">
            <h2 class="card-title">Webhook Setup</h2>
            <p class="card-desc">Configure your Twilio webhook to receive incoming messages.</p>
          </div>
        </div>
        <div class="webhook-info">
          <p class="webhook-text">In your Twilio Console, set the webhook URL for your phone number to:</p>
          <div class="webhook-url-box">
            <code>https://your-api-domain.com/api/v1/messages/webhook/incoming</code>
          </div>
          <p class="webhook-hint">Set the method to <strong>POST</strong> and the format to <strong>HTTP POST</strong>.</p>
        </div>
      </div>

    </div>
  {/if}
</div>

<style>
  .settings-page {
    padding: 32px 40px;
    max-width: 800px;
    height: 100%;
    overflow-y: auto;
    background: #09090b;
    color: #e4e4e7;
  }

  .settings-header { margin-bottom: 32px; }
  .settings-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
  }
  .settings-subtitle {
    font-size: 0.875rem;
    color: #71717a;
    margin: 0;
  }

  .settings-loading {
    display: flex; align-items: center; gap: 12px;
    color: #71717a; font-size: 0.875rem;
    padding: 40px 0;
  }
  .spin {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.08);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .settings-error {
    padding: 16px; border-radius: 12px;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    color: #fca5a5; font-size: 0.875rem;
  }

  .settings-grid {
    display: flex; flex-direction: column; gap: 20px;
  }

  /* Card */
  .card {
    background: #111113;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px 28px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: rgba(255,255,255,0.1); }

  .card-twilio { border-color: rgba(99,102,241,0.15); }
  .card-twilio:hover { border-color: rgba(99,102,241,0.25); }

  .card-header {
    display: flex; align-items: flex-start; gap: 14px;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .card-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .twilio-icon { background: rgba(99,102,241,0.12); color: #818cf8; }
  .account-icon { background: rgba(34,197,94,0.12); color: #4ade80; }
  .webhook-icon { background: rgba(251,191,36,0.12); color: #fbbf24; }

  .card-header-text { flex: 1; min-width: 0; }
  .card-title {
    font-size: 1rem; font-weight: 600; color: #f4f4f5;
    margin: 0 0 4px;
  }
  .card-desc {
    font-size: 0.8rem; color: #71717a; margin: 0;
    line-height: 1.4;
  }

  .status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 20px;
    font-size: 0.7rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    flex-shrink: 0; margin-top: 2px;
  }
  .status-badge.connected {
    background: rgba(34,197,94,0.1); color: #4ade80;
    border: 1px solid rgba(34,197,94,0.2);
  }
  .status-badge.disconnected {
    background: rgba(239,68,68,0.1); color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: currentColor;
  }

  /* Credential Display */
  .cred-display {
    display: flex; flex-direction: column; gap: 0;
  }
  .cred-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .cred-row:last-child { border-bottom: none; }
  .cred-label {
    font-size: 0.8rem; color: #71717a; font-weight: 500;
  }
  .cred-value {
    font-size: 0.8rem; color: #d4d4d8;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  .capitalize { text-transform: capitalize; font-family: inherit; }

  .plan-badge {
    padding: 2px 8px; border-radius: 6px;
    font-size: 0.7rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    font-family: inherit;
  }
  .plan-badge.free {
    background: rgba(99,102,241,0.12); color: #a5b4fc;
  }
  .plan-badge.pro {
    background: rgba(251,191,36,0.12); color: #fbbf24;
  }

  .card-actions {
    display: flex; gap: 10px; margin-top: 16px;
    padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.04);
  }

  /* Credential Form */
  .cred-form {
    display: flex; flex-direction: column; gap: 16px;
  }
  .form-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .form-field label {
    font-size: 0.75rem; font-weight: 600; color: #a1a1aa;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .form-field input {
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #f4f4f5; font-size: 0.875rem;
    outline: none; transition: all 0.2s;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  .form-field input::placeholder { color: #3f3f46; }
  .form-field input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .form-field input:disabled { opacity: 0.5; }
  .field-hint {
    font-size: 0.7rem; color: #52525b;
  }
  .field-hint a {
    color: #818cf8; text-decoration: none;
  }
  .field-hint a:hover { text-decoration: underline; }

  .form-error, .form-success {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 10px;
    font-size: 0.8rem;
  }
  .form-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.2);
    color: #fca5a5;
  }
  .form-success {
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.2);
    color: #86efac;
  }

  .form-actions {
    display: flex; gap: 10px; justify-content: flex-end;
    margin-top: 4px;
  }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 10px;
    font-size: 0.8rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    border: none;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }

  .btn-outline {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: #d4d4d8;
  }
  .btn-outline:hover:not(:disabled) {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.15);
  }

  .btn-ghost {
    background: transparent; color: #a1a1aa;
    border: 1px solid transparent;
  }
  .btn-ghost:hover:not(:disabled) {
    background: rgba(255,255,255,0.05);
    color: #e4e4e7;
  }

  .btn-danger-ghost {
    background: transparent; color: #f87171;
    border: 1px solid transparent;
  }
  .btn-danger-ghost:hover:not(:disabled) {
    background: rgba(239,68,68,0.08);
  }

  .btn-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* Webhook */
  .webhook-info { margin-top: 4px; }
  .webhook-text {
    font-size: 0.8rem; color: #a1a1aa;
    margin: 0 0 12px; line-height: 1.5;
  }
  .webhook-url-box {
    padding: 12px 16px; border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 12px;
  }
  .webhook-url-box code {
    font-size: 0.78rem; color: #a5b4fc;
    font-family: 'SF Mono', 'Fira Code', monospace;
    word-break: break-all;
  }
  .webhook-hint {
    font-size: 0.75rem; color: #52525b; margin: 0;
  }
  .webhook-hint strong { color: #71717a; }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
