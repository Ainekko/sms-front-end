<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { brandsStore, loadBrands, type Brand } from '$lib/stores/brandsStore';
  import { connectionStore, ConnectionStatus } from '$lib/stores/connectionStore';
  import { isAuthenticated, isAuthInitialized, isAdmin, currentUser, authStore } from '$lib/stores';
  import BrandManager from '$lib/components/BrandManager.svelte';

  // Track if user has Twilio configured
  $: hasTwilio = $currentUser?.has_twilio ?? false;

  export let data;
  $: brandId = data.brandId;

  // Auth guard
  $: if ($isAuthInitialized && !$isAuthenticated) {
    goto('/login');
  }

  // Brand state
  $: brands = $brandsStore.brands;
  $: currentBrand = brands.find((b) => b.id === brandId) || null;

  // Sync URL brand to store
  $: if (brandId && brands.length > 0) {
    brandsStore.setSelectedBrandId(brandId);
  }

  // UI state
  let showBrandSwitcher = false;
  let showBrandManager = false;
  let editBrand: Brand | null = null;
  let showUserMenu = false;

  // Connection
  $: status = $connectionStore.status;
  $: currentPath = $page.url.pathname;

  // Nav items — all brand-scoped
  $: navItems = [
    {
      label: 'Dashboard',
      href: `/b/${brandId}`,
      active: currentPath === `/b/${brandId}`,
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      label: 'Messages',
      href: `/b/${brandId}/messages`,
      active: currentPath.includes('/messages'),
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    },
    {
      label: 'Campaigns',
      href: `/b/${brandId}/campaigns`,
      active: currentPath.includes('/campaigns'),
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'
    },
    {
      label: 'Groups',
      href: `/b/${brandId}/groups`,
      active: currentPath.includes('/groups'),
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
    },
    {
      label: 'Settings',
      href: `/b/${brandId}/settings`,
      active: currentPath.includes('/settings'),
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    }
  ];

  onMount(async () => {
    if ($brandsStore.brands.length === 0) {
      await loadBrands();
    }
  });

  function handleBrandSwitch(brand: Brand) {
    const subPath = currentPath.replace(`/b/${brandId}`, '') || '/messages';
    goto(`/b/${brand.id}${subPath}`);
    showBrandSwitcher = false;
  }

  function handleManageBrands() {
    editBrand = null;
    showBrandManager = true;
    showBrandSwitcher = false;
  }

  function handleLogout() {
    showUserMenu = false;
    authStore.logout();
    goto('/login');
  }

  function formatPhone(phone: string): string {
    const d = phone.replace(/^\+/, '');
    if (d.length === 11 && d.startsWith('1'))
      return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return phone;
  }

  function statusColor(s: ConnectionStatus): string {
    if (s === ConnectionStatus.CONNECTED) return '#22c55e';
    if (s === ConnectionStatus.CONNECTING) return '#eab308';
    if (s === ConnectionStatus.ERROR) return '#ef4444';
    return '#71717a';
  }

  function statusLabel(s: ConnectionStatus): string {
    if (s === ConnectionStatus.CONNECTED) return 'Online';
    if (s === ConnectionStatus.CONNECTING) return 'Connecting…';
    if (s === ConnectionStatus.ERROR) return 'Error';
    return 'Offline';
  }

  function closeBrandSwitcher(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.brand-switcher-zone')) showBrandSwitcher = false;
  }
  function closeUserMenu(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.user-menu-zone')) showUserMenu = false;
  }
</script>

<svelte:window on:click={closeBrandSwitcher} on:click={closeUserMenu} />

<div class="app-shell">
  <!-- Sidebar -->
  <aside class="sidebar">
    <!-- Brand Card -->
    <div class="brand-switcher-zone sidebar-brand">
      <button class="brand-card" on:click|stopPropagation={() => (showBrandSwitcher = !showBrandSwitcher)}>
        {#if currentBrand}
          <div class="brand-avatar">
            {currentBrand.name.charAt(0).toUpperCase()}
          </div>
          <div class="brand-info">
            <span class="brand-name">{currentBrand.name}</span>
            <span class="brand-phone">{formatPhone(currentBrand.phoneNumber)}</span>
          </div>
          <svg class="brand-chevron" class:open={showBrandSwitcher} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        {:else}
          <div class="brand-avatar">?</div>
          <div class="brand-info">
            <span class="brand-name">Loading…</span>
          </div>
        {/if}
      </button>

      <!-- Brand Switcher Dropdown -->
      {#if showBrandSwitcher}
        <div class="brand-dropdown">
          <div class="brand-dropdown-label">Switch Brand</div>
          <div class="brand-dropdown-list">
            {#each brands as brand (brand.id)}
              <button
                class="brand-dropdown-item"
                class:active={brand.id === brandId}
                on:click|stopPropagation={() => handleBrandSwitch(brand)}
              >
                <div class="brand-dropdown-avatar">{brand.name.charAt(0).toUpperCase()}</div>
                <div class="brand-dropdown-info">
                  <span>{brand.name}</span>
                  <span class="brand-dropdown-phone">{formatPhone(brand.phoneNumber)}</span>
                </div>
                {#if brand.id === brandId}
                  <svg class="brand-dropdown-check" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
          <div class="brand-dropdown-divider"></div>
          <button class="brand-dropdown-manage" on:click|stopPropagation={handleManageBrands}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4v16m8-8H4" />
            </svg>
            <span>Manage Brands</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      {#each navItems as item}
        {#if item.disabled}
          <div class="nav-item disabled">
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d={item.icon} />
            </svg>
            <span class="nav-label">{item.label}</span>
            {#if item.badge}
              <span class="nav-badge">{item.badge}</span>
            {/if}
          </div>
        {:else}
          <a
            href={item.href}
            class="nav-item"
            class:active={item.active}
            data-sveltekit-noscroll
          >
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d={item.icon} />
            </svg>
            <span class="nav-label">{item.label}</span>
          </a>
        {/if}
      {/each}
    </nav>

    <!-- Twilio Setup Banner -->
    {#if !hasTwilio}
      <div class="twilio-banner">
        <div class="twilio-banner-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="twilio-banner-text">
          <span class="twilio-banner-title">Connect Twilio</span>
          <span class="twilio-banner-desc">Add your credentials to start messaging</span>
        </div>
        <a href="/b/{brandId}/settings" class="twilio-banner-btn">Setup</a>
      </div>
    {/if}

    <!-- Spacer -->
    <div class="sidebar-spacer"></div>

    <!-- Admin link -->
    {#if $isAdmin}
      <a href="/admin" class="nav-item admin-link" class:active={currentPath.startsWith('/admin')}>
        <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span class="nav-label">Admin</span>
      </a>
    {/if}

    <!-- Connection + User -->
    <div class="sidebar-footer">
      <div class="connection-status">
        <span class="status-dot" style="background:{statusColor(status)}"></span>
        <span class="status-text">{statusLabel(status)}</span>
      </div>

      {#if $isAuthenticated && $currentUser}
        <div class="user-menu-zone">
          <button class="user-card" on:click|stopPropagation={() => (showUserMenu = !showUserMenu)}>
            <div class="user-avatar">{$currentUser.email[0].toUpperCase()}</div>
            <span class="user-email">{$currentUser.email}</span>
          </button>
          {#if showUserMenu}
            <div class="user-dropdown">
              <div class="user-dropdown-info">
                <span>{$currentUser.email}</span>
                <span class="user-role">{$currentUser.role}</span>
              </div>
              <button class="user-dropdown-logout" on:click={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <slot />
  </main>
</div>

<!-- Brand Manager Modal -->
<BrandManager
  isOpen={showBrandManager}
  {editBrand}
  on:close={() => { showBrandManager = false; editBrand = null; }}
  on:saved={() => { showBrandManager = false; editBrand = null; }}
/>

<style>
  /* ===== Shell ===== */
  .app-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #09090b;
  }

  /* ===== Sidebar ===== */
  .sidebar {
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #09090b;
    color: #e4e4e7;
    border-right: 1px solid rgba(255,255,255,0.06);
    position: relative;
    z-index: 30;
  }

  /* ===== Brand Card ===== */
  .sidebar-brand {
    padding: 16px;
    position: relative;
  }

  .brand-card {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #e4e4e7;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }
  .brand-card:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.12);
  }

  .brand-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
  }

  .brand-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .brand-name {
    font-size: 13px;
    font-weight: 600;
    color: #f4f4f5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .brand-phone {
    font-size: 11px;
    color: #71717a;
    margin-top: 1px;
  }

  .brand-chevron {
    color: #52525b;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  .brand-chevron.open {
    transform: rotate(180deg);
  }

  /* ===== Brand Dropdown ===== */
  .brand-dropdown {
    position: absolute;
    top: calc(100% - 4px);
    left: 12px;
    right: 12px;
    background: #18181b;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    z-index: 50;
    animation: dropIn 0.15s ease;
    overflow: hidden;
  }
  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .brand-dropdown-label {
    padding: 10px 14px 6px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #52525b;
  }

  .brand-dropdown-list {
    max-height: 200px;
    overflow-y: auto;
    padding: 0 4px 4px;
  }

  .brand-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 6px;
    border: none;
    background: none;
    color: #d4d4d8;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }
  .brand-dropdown-item:hover {
    background: rgba(255,255,255,0.06);
  }
  .brand-dropdown-item.active {
    background: rgba(99,102,241,0.12);
    color: #a5b4fc;
  }

  .brand-dropdown-avatar {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 11px;
    flex-shrink: 0;
  }

  .brand-dropdown-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    font-size: 13px;
    font-weight: 500;
  }
  .brand-dropdown-phone {
    font-size: 11px;
    color: #52525b;
  }

  .brand-dropdown-check {
    color: #818cf8;
    flex-shrink: 0;
  }

  .brand-dropdown-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 4px 0;
  }

  .brand-dropdown-manage {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: none;
    color: #818cf8;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.1s;
  }
  .brand-dropdown-manage:hover {
    background: rgba(99,102,241,0.08);
  }

  /* ===== Navigation ===== */
  .sidebar-nav {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #a1a1aa;
    text-decoration: none;
    transition: all 0.15s ease;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    position: relative;
  }
  .nav-item:hover:not(.disabled) {
    color: #e4e4e7;
    background: rgba(255,255,255,0.05);
  }
  .nav-item.active {
    color: #f4f4f5;
    background: rgba(99,102,241,0.1);
  }
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 18px;
    background: #6366f1;
    border-radius: 0 3px 3px 0;
  }
  .nav-item.disabled {
    color: #3f3f46;
    cursor: default;
  }

  .nav-icon {
    flex-shrink: 0;
  }
  .nav-label {
    flex: 1;
  }

  .nav-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(255,255,255,0.06);
    color: #52525b;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .admin-link {
    margin: 0 12px 4px;
  }

  /* ===== Spacer ===== */
  .sidebar-spacer {
    flex: 1;
  }

  /* ===== Footer ===== */
  .sidebar-footer {
    padding: 12px 16px 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px;
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .status-text {
    font-size: 11px;
    color: #71717a;
    font-weight: 500;
  }

  /* ===== User ===== */
  .user-menu-zone {
    position: relative;
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: none;
    background: rgba(255,255,255,0.03);
    color: #d4d4d8;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }
  .user-card:hover {
    background: rgba(255,255,255,0.06);
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .user-email {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .user-dropdown {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    right: 0;
    background: #18181b;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    box-shadow: 0 -10px 30px rgba(0,0,0,0.4);
    overflow: hidden;
    animation: dropIn 0.12s ease;
  }

  .user-dropdown-info {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #d4d4d8;
  }
  .user-role {
    font-size: 11px;
    color: #52525b;
    text-transform: capitalize;
    margin-top: 2px;
  }

  .user-dropdown-logout {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: none;
    color: #ef4444;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.1s;
  }
  .user-dropdown-logout:hover {
    background: rgba(239,68,68,0.08);
  }

  /* ===== Main Content ===== */
  .main-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    background: #09090b;
  }

  /* ===== Twilio Banner ===== */
  .twilio-banner {
    margin: 8px 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(251,191,36,0.08);
    border: 1px solid rgba(251,191,36,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .twilio-banner-icon {
    color: #fbbf24;
    flex-shrink: 0;
  }
  .twilio-banner-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .twilio-banner-title {
    font-size: 11px;
    font-weight: 600;
    color: #fbbf24;
  }
  .twilio-banner-desc {
    font-size: 10px;
    color: #a16207;
    margin-top: 1px;
  }
  .twilio-banner-btn {
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(251,191,36,0.15);
    color: #fbbf24;
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .twilio-banner-btn:hover {
    background: rgba(251,191,36,0.25);
  }
</style>
