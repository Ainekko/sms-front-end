<script lang="ts">
  /**
   * Root Page
   * =========
   * - If authenticated + has brands → redirect to /b/[brandId]/messages
   * - If authenticated + no brands → show empty state with create option (admin) or waiting message
   * - If not authenticated → show nice landing page
   */
  import { onMount } from 'svelte';
  import { blur, fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { isAuthenticated, isAuthInitialized, isAdmin, currentUser } from '$lib/stores';
  import { brandsStore, loadBrands, createBrand } from '$lib/stores/brandsStore';
  import { showError } from '$lib/stores/uiStore';
  import { get } from 'svelte/store';

  let loading = true;
  let noBrands = false;
  let mounted = false;

  // Brand creation form (admin only)
  let brandName = '';
  let brandPhone = '';
  let creating = false;
  let showCreateForm = false;

  onMount(() => {
    setTimeout(() => (mounted = true), 50);
  });

  // Load brands once authenticated
  $: if ($isAuthInitialized && $isAuthenticated && loading) {
    loadBrands()
      .then(() => {
        const state = get(brandsStore);
        if (state.brands.length > 0) {
          goto(`/b/${state.brands[0].id}/messages`, { replaceState: true });
        } else {
          noBrands = true;
          loading = false;
        }
      })
      .catch(() => {
        noBrands = true;
        loading = false;
      });
  }

  // Stop loading if unauthenticated
  $: if ($isAuthInitialized && !$isAuthenticated) {
    loading = false;
  }

  async function handleCreateBrand() {
    if (!brandName.trim() || !brandPhone.trim()) return;
    creating = true;
    try {
      const brand = await createBrand({
        name: brandName.trim(),
        phone_number: brandPhone.trim()
      });
      if (brand) {
        goto(`/b/${brand.id}/messages`, { replaceState: true });
      }
    } catch (err: any) {
      showError(err.message || 'Failed to create brand');
      creating = false;
    }
  }

  function handleRefresh() {
    loading = true;
    noBrands = false;
  }

  const benefits = [
    {
      title: 'Multi-Brand Routing',
      desc: 'Seamlessly isolate conversations per brand.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />'
    },
    {
      title: 'Bulk Messaging',
      desc: 'Blast out personalized texts in seconds.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />'
    },
    {
      title: 'Live 2-Way Inbox',
      desc: 'Talk to customers in real-time.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />'
    },
    {
      title: 'Automated Campaigns',
      desc: 'Set drip sequences on complete autopilot.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />'
    },
    {
      title: 'Secure & Scoped',
      desc: 'Dedicated databases with enterprise auth.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />'
    },
    {
      title: 'Rich Analytics',
      desc: 'Track exact open and conversion rates.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />'
    }
  ];
</script>

<svelte:head>
  <title>SMS Multi-Tenant Platform | Enterprise Messaging</title>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

{#if $isAuthenticated}
  {#if loading}
    <div class="page">
      <div class="spinner"></div>
      <p class="muted">Loading…</p>
    </div>
  {:else if noBrands}
    <div class="page">
      <div class="card">
        <!-- Logo -->
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <h1 class="title">No Brands Yet</h1>

        {#if $isAdmin}
          <!-- Admin: can create brands -->
          <p class="subtitle">Create your first brand to start sending messages.</p>

          {#if !showCreateForm}
            <div class="actions">
              <button class="btn-primary" on:click={() => (showCreateForm = true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
                Create Brand
              </button>
            </div>
          {:else}
            <form class="form" on:submit|preventDefault={handleCreateBrand}>
              <div class="form-group">
                <label for="brand-name">Brand Name</label>
                <input id="brand-name" type="text" bind:value={brandName} placeholder="e.g. My Business" required disabled={creating} />
              </div>
              <div class="form-group">
                <label for="brand-phone">Twilio Phone Number</label>
                <input id="brand-phone" type="tel" bind:value={brandPhone} placeholder="e.g. +16505551234" required disabled={creating} />
                <span class="hint">E.164 format</span>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-ghost" on:click={() => (showCreateForm = false)} disabled={creating}>Cancel</button>
                <button type="submit" class="btn-primary" disabled={creating || !brandName.trim() || !brandPhone.trim()}>
                  {#if creating}
                    <div class="btn-spinner"></div>Creating…
                  {:else}
                    Create Brand
                  {/if}
                </button>
              </div>
            </form>
          {/if}
        {:else}
          <!-- Regular user: can't create brands -->
          <p class="subtitle">Your account doesn't have any brands assigned yet. Ask an admin to create one for you.</p>
          <div class="actions">
            <button class="btn-ghost" on:click={handleRefresh}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refresh
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <!-- Landing Page (No Auth) -->
  <div class="font-[Poppins] bg-white min-h-screen text-zinc-900 overflow-x-hidden selection:bg-indigo-500/30">
    
    <!-- Header -->
    <header class="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
      <div class="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">S</div>
        SMS SaaS
      </div>
      <nav>
        {#if $isAuthInitialized}
          <button on:click={() => goto('/login')} class="px-5 py-2 text-sm font-semibold rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors shadow-lg shadow-zinc-900/20">
            Login
          </button>
        {/if}
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-24 md:pt-40 md:pb-32 min-h-screen flex flex-col justify-center border-b border-zinc-100">
      <div class="absolute inset-0 pointer-events-none opacity-40" style="background-image: radial-gradient(circle, #d4d4d8 1px, transparent 1px); background-size: 28px 28px;"></div>
      <div class="absolute -top-20 left-1/3 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {#if mounted}
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <!-- Left Column -->
            <div class="lg:col-span-7 space-y-8 lg:pr-8">
              <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 leading-[1.05] tracking-tight">
                <span in:blur={{ duration: 800, delay: 100, amount: 8 }}>Multi-brand</span><br />
                <span in:blur={{ duration: 800, delay: 250, amount: 8 }} class="font-['Instrument_Serif'] italic text-indigo-600 font-normal tracking-wide">SMS automation</span><br />
                <span in:blur={{ duration: 800, delay: 400, amount: 8 }}>made enterprise.</span>
              </h1>

              <p in:blur={{ duration: 700, delay: 180, amount: 6 }} class="text-lg md:text-xl text-zinc-500 leading-relaxed font-light max-w-lg">
                Broadcast campaigns, isolation per brand, scalable 2-way conversations. <strong class="font-medium text-zinc-700">Zero overlap, 100% deliverability.</strong>
              </p>

              <div in:fly={{ y: 20, duration: 600, delay: 420 }} class="flex flex-col sm:flex-row items-center gap-4 pt-6 max-w-lg">
                <div class="flex-1 w-full p-6 rounded-[1.5rem] bg-white border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                  <div class="absolute -right-4 -top-8 w-24 h-24 bg-indigo-100/50 rounded-full blur-xl pointer-events-none"></div>
                  <div class="relative z-10">
                    <div class="text-[2rem] font-bold text-zinc-900 tracking-tight leading-none mb-2">99%</div>
                    <div class="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Open Rate</div>
                  </div>
                </div>

                <div class="flex-1 w-full p-6 rounded-[1.5rem] bg-white border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                  <div class="absolute -right-4 -top-8 w-24 h-24 bg-blue-100/50 rounded-full blur-xl pointer-events-none"></div>
                  <div class="relative z-10">
                    <div class="text-[2rem] font-bold text-zinc-900 tracking-tight leading-none mb-2">10x</div>
                    <div class="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Customer ROI</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column (Bento Card) -->
            <div class="lg:col-span-5 w-full relative" in:fly={{ y: 30, duration: 800, delay: 200 }}>
              <div class="case-card group relative overflow-hidden bg-[#0F1115] rounded-[2.5rem] p-8 lg:p-10 border border-zinc-800/80 shadow-2xl flex flex-col justify-between w-full isolate h-[500px]">
                <div class="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none z-10" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
                <div class="absolute -top-24 -right-24 w-[350px] h-[350px] bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none transition-transform duration-[10s] group-hover:scale-125 z-0"></div>

                <div class="relative z-20 mt-auto">
                  <h3 class="text-[3rem] font-bold text-white mb-4 leading-[1.05] tracking-tight">Let's scale<br />messaging.</h3>
                  <p class="text-zinc-400 text-lg font-light mb-8">One single platform to drive revenue through direct text.</p>
                  <button on:click={() => goto('/login')} class="w-full py-4 text-center bg-white hover:bg-zinc-100 text-zinc-900 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95">Get Started Today</button>
                </div>
              </div>
            </div>

          </div>
        {/if}
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-white relative z-10 font-[Poppins]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-8 shadow-sm">
            Core Features
          </div>
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-zinc-900 leading-[1.05]">
            Everything needed for<br />
            <span class="font-['Instrument_Serif'] italic font-normal text-indigo-600">secure, powerful</span> SMS.
          </h2>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {#each benefits as benefit, idx}
            <div class="group relative overflow-hidden bg-[#181A1F] rounded-[2rem] p-6 lg:p-8 border border-white/5 shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col items-center justify-center text-center gap-5">
              <div class="absolute -top-10 -right-10 w-32 h-32 opacity-[0.05] pointer-events-none transition-transform duration-700 group-hover:scale-150">
                <div class="w-full h-full rounded-full bg-indigo-400 blur-2xl"></div>
              </div>
              <div class="w-14 h-14 rounded-2xl bg-[#212328] border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-white group-hover:text-zinc-900 transition-all duration-300 relative z-10 shadow-inner">
                <svg class="w-6 h-6 flex-shrink-0 -rotate-12 group-hover:rotate-0 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {@html benefit.svg}
                </svg>
              </div>
              <div class="relative z-10 w-full">
                <h3 class="text-[14px] md:text-[15px] font-semibold text-white tracking-tight mb-2">{benefit.title}</h3>
                <p class="text-[12px] text-zinc-400 leading-tight">{benefit.desc}</p>
              </div>
            </div>
          {/each}
        </div>

      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#09090B] text-zinc-400 py-16 pt-24 relative overflow-hidden font-[Poppins] border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-24">
          <div class="md:col-span-5 lg:col-span-4 flex flex-col items-start gap-5">
            <div class="flex items-center gap-3 text-white">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">S</div>
              <span class="font-bold text-xl tracking-tight">SMS SaaS</span>
            </div>
            <p class="text-sm font-light">© {new Date().getFullYear()} SMS SaaS, Inc.</p>
          </div>
        </div>
        <div class="w-full flex justify-center items-end opacity-[0.1] pointer-events-none select-none overflow-hidden relative -mb-16 md:-mb-24">
          <h1 class="font-['Poppins'] font-black text-[12rem] md:text-[22rem] lg:text-[28rem] leading-[0.75] tracking-tighter text-transparent" style="-webkit-text-stroke: 3px rgba(255,255,255,0.5);">SMS</h1>
        </div>
      </div>
    </footer>

  </div>
{/if}

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #09090b;
    padding: 2rem;
    gap: 1rem;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(255,255,255,0.08);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .muted { color: #52525b; font-size: 0.85rem; margin: 0; }

  .card {
    width: 100%;
    max-width: 400px;
    text-align: center;
  }

  .logo {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem;
    box-shadow: 0 8px 24px rgba(99,102,241,0.25);
  }

  .title {
    font-size: 1.35rem; font-weight: 700; color: #f4f4f5;
    margin: 0 0 0.5rem; letter-spacing: -0.01em;
  }
  .subtitle {
    font-size: 0.875rem; color: #71717a; margin: 0 0 1.5rem; line-height: 1.5;
  }

  .actions {
    display: flex; justify-content: center; gap: 0.75rem;
  }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.65rem 1.25rem; border-radius: 9px; border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; font-size: 0.875rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.65rem 1.25rem; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; color: #a1a1aa;
    font-size: 0.875rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover:not(:disabled) {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.15);
    color: #e4e4e7;
  }
  .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Form */
  .form {
    text-align: left;
    display: flex; flex-direction: column; gap: 1rem;
    margin-top: 0.5rem;
  }
  .form-group {
    display: flex; flex-direction: column; gap: 0.3rem;
  }
  .form-group label {
    font-size: 0.75rem; font-weight: 600; color: #a1a1aa;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .form-group input {
    padding: 0.7rem 0.9rem; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: #f4f4f5;
    font-size: 0.9rem; outline: none; transition: all 0.15s;
  }
  .form-group input::placeholder { color: #3f3f46; }
  .form-group input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .form-group input:disabled { opacity: 0.5; }
  .hint { font-size: 0.7rem; color: #52525b; }

  .form-actions {
    display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.25rem;
  }

  .btn-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
