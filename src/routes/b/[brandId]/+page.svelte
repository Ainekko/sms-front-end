<script lang="ts">
  /**
   * Brand Dashboard
   * ================
   * Overview page for the selected brand — quick stats and actions.
   */
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { brandsStore, selectedBrand } from '$lib/stores/brandsStore';
  import { currentUser } from '$lib/stores';
  import BulkMessageModal from '$lib/components/BulkMessageModal.svelte';

  export let data;
  $: brandId = data.brandId;
  $: brand = $selectedBrand;
  $: hasTwilio = $currentUser?.has_twilio ?? false;

  let showBulkMessage = false;

  function formatPhone(phone: string): string {
    const d = phone.replace(/^\+/, '');
    if (d.length === 11 && d.startsWith('1'))
      return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return phone;
  }

  const quickActions = [
    {
      label: 'Messages',
      desc: 'View conversations and chat',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      color: '#818cf8',
      bg: 'rgba(99,102,241,0.1)',
      href: 'messages'
    },
    {
      label: 'Campaigns',
      desc: 'Bulk outreach & drip sends',
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      color: '#f472b6',
      bg: 'rgba(244,114,182,0.1)',
      href: 'campaigns'
    },
    {
      label: 'Groups',
      desc: 'Organize your contacts',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      color: '#34d399',
      bg: 'rgba(52,211,153,0.1)',
      href: 'groups'
    },
    {
      label: 'Settings',
      desc: 'Twilio keys & account',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.1)',
      href: 'settings'
    }
  ];
</script>

<svelte:head>
  <title>{brand?.name || 'Dashboard'} | Broadr</title>
</svelte:head>

<div class="dashboard">
  <!-- Header -->
  <div class="dash-header">
    <div class="dash-header-left">
      <h1 class="dash-title">
        {#if brand}
          {brand.name}
        {:else}
          Dashboard
        {/if}
      </h1>
      {#if brand}
        <span class="dash-phone">{formatPhone(brand.phoneNumber)}</span>
      {/if}
    </div>
    <div class="dash-header-right">
      <button class="action-btn-primary" on:click={() => (showBulkMessage = true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Bulk Send
      </button>
    </div>
  </div>

  <!-- Twilio Setup CTA (if not configured) -->
  {#if !hasTwilio}
    <div class="setup-cta">
      <div class="setup-cta-glow"></div>
      <div class="setup-cta-content">
        <div class="setup-cta-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
        </div>
        <div class="setup-cta-text">
          <h3>Connect your Twilio account</h3>
          <p>Add your Account SID and Auth Token to start sending and receiving SMS messages.</p>
        </div>
        <button class="setup-cta-btn" on:click={() => goto(`/b/${brandId}/settings`)}>
          Connect Twilio
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  {/if}

  <!-- Quick Actions Grid -->
  <div class="section-label">Quick Actions</div>
  <div class="actions-grid">
    {#each quickActions as action}
      <a
        href={action.href.startsWith('/') ? action.href : `/b/${brandId}/${action.href}`}
        class="action-card"
      >
        <div class="action-icon" style="background:{action.bg}; color:{action.color}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d={action.icon} />
          </svg>
        </div>
        <div class="action-info">
          <span class="action-label">{action.label}</span>
          <span class="action-desc">{action.desc}</span>
        </div>
        <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
      </a>
    {/each}
  </div>
</div>

<BulkMessageModal isOpen={showBulkMessage} on:close={() => (showBulkMessage = false)} />

<style>
  .dashboard {
    padding: 32px 40px;
    height: 100%;
    overflow-y: auto;
    background: #09090b;
    color: #e4e4e7;
  }

  .dash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .dash-header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .dash-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f4f4f5;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .dash-phone {
    font-size: 0.8rem;
    color: #52525b;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  .dash-header-right {
    display: flex;
    align-items: center;
  }
  .action-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .action-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }

  /* Setup CTA */
  .setup-cta {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 28px;
    background: #111113;
    border: 1px solid rgba(99,102,241,0.2);
  }
  .setup-cta-glow {
    position: absolute;
    top: -40px;
    right: -40px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .setup-cta-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px 28px;
  }
  .setup-cta-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(99,102,241,0.12);
    color: #818cf8;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .setup-cta-text {
    flex: 1;
  }
  .setup-cta-text h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #f4f4f5;
    margin: 0 0 4px;
  }
  .setup-cta-text p {
    font-size: 0.8rem;
    color: #71717a;
    margin: 0;
    line-height: 1.4;
  }
  .setup-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .setup-cta-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }

  /* Section Label */
  .section-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #52525b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
  }

  /* Actions Grid */
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .action-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    border-radius: 14px;
    background: #111113;
    border: 1px solid rgba(255,255,255,0.06);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
    cursor: pointer;
  }
  .action-card:hover {
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .action-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .action-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .action-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f4f4f5;
  }
  .action-desc {
    font-size: 0.75rem;
    color: #52525b;
    margin-top: 2px;
  }
  .action-arrow {
    color: #3f3f46;
    flex-shrink: 0;
    transition: transform 0.2s, color 0.2s;
  }
  .action-card:hover .action-arrow {
    color: #71717a;
    transform: translateX(2px);
  }
</style>
