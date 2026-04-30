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

  // onMount is handled in the benefits section below

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
      title: 'AI-Powered DNC',
      desc: 'Automatically flags contacts who opt out — zero manual work.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />'
    },
    {
      title: 'Smart Campaigns',
      desc: 'Launch targeted SMS blasts with follow-up sequences built in.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />'
    },
    {
      title: '2-Way Inbox',
      desc: 'Real-time conversations — every reply lands in one clean thread.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />'
    },
    {
      title: 'Contact Groups',
      desc: 'Organize audiences into segments for precision targeting.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />'
    },
    {
      title: 'Multi-Brand',
      desc: 'Isolate data per brand — one dashboard, many businesses.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />'
    },
    {
      title: 'Campaign Insights',
      desc: 'Reply rates, delivery stats, and AI sentiment — all tracked.',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />'
    }
  ];

  let sectionRef: HTMLElement;
  let visibleBenefits = false;

  onMount(() => {
    setTimeout(() => (mounted = true), 50);
    setTimeout(() => {
      if (sectionRef) {
        const obs = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) { visibleBenefits = true; obs.disconnect(); }
        }, { threshold: 0.08 });
        obs.observe(sectionRef);
      }
    }, 100);
  });
</script>

<svelte:head>
  <title>Broadr by Flowjoy — AI-Powered SMS Platform</title>
  <meta name="description" content="Broadr is an AI-powered SMS platform for businesses. Smart campaigns, automated DNC, 2-way messaging, and contact groups — starting free." />
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
  <div class="font-[Poppins] bg-white min-h-screen text-zinc-900 overflow-x-hidden selection:bg-zinc-300/40">
    
    <!-- Header -->
    <header class="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
      <div class="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-sm">B</div>
        Broadr
      </div>
      <nav class="flex items-center gap-3">
        <a href="#pricing" class="hidden sm:inline text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</a>
        {#if $isAuthInitialized}
          <button on:click={() => goto('/signup')} class="px-5 py-2 text-sm font-semibold rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors shadow-lg shadow-zinc-900/20">
            Get Started
          </button>
        {/if}
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-24 md:pt-40 md:pb-32 min-h-screen flex flex-col justify-center border-b border-zinc-100">
      <div class="absolute inset-0 pointer-events-none opacity-40" style="background-image: radial-gradient(circle, #d4d4d8 1px, transparent 1px); background-size: 28px 28px;"></div>
      <div class="absolute -top-20 left-1/3 w-[500px] h-[500px] bg-zinc-200/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {#if mounted}
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <!-- Left Column -->
            <div class="lg:col-span-7 space-y-8 lg:pr-8">
              <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 leading-[1.05] tracking-tight">
                <span in:blur={{ duration: 800, delay: 100, amount: 8 }}>Send smarter.</span><br />
                <span in:blur={{ duration: 800, delay: 250, amount: 8 }} class="font-['Instrument_Serif'] italic text-zinc-500 font-normal tracking-wide">Close faster.</span><br />
                <span in:blur={{ duration: 800, delay: 400, amount: 8 }}>Scale with AI.</span>
              </h1>

              <p in:blur={{ duration: 700, delay: 180, amount: 6 }} class="text-lg md:text-xl text-zinc-500 leading-relaxed font-light max-w-lg">
                AI-powered SMS campaigns, automated DNC compliance, and real-time 2-way messaging — <strong class="font-medium text-zinc-700">all in one platform, starting free.</strong>
              </p>

              <div in:fly={{ y: 20, duration: 600, delay: 420 }} class="flex flex-col sm:flex-row items-center gap-4 pt-6 max-w-lg">
                <div class="flex-1 w-full p-6 rounded-[1.5rem] bg-white border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                  <div class="absolute -right-4 -top-8 w-24 h-24 bg-zinc-100/50 rounded-full blur-xl pointer-events-none"></div>
                  <div class="relative z-10">
                    <div class="text-[2rem] font-bold text-zinc-900 tracking-tight leading-none mb-2">Free</div>
                    <div class="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Starter Plan</div>
                  </div>
                </div>
                <div class="flex-1 w-full p-6 rounded-[1.5rem] bg-white border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                  <div class="absolute -right-4 -top-8 w-24 h-24 bg-zinc-200/50 rounded-full blur-xl pointer-events-none"></div>
                  <div class="relative z-10">
                    <div class="text-[2rem] font-bold text-zinc-900 tracking-tight leading-none mb-2">$19<span class="text-lg font-medium text-zinc-400">/mo</span></div>
                    <div class="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Pro + AI</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column (Bento Card) -->
            <div class="lg:col-span-5 w-full relative" in:fly={{ y: 30, duration: 800, delay: 200 }}>
              <div class="group relative overflow-hidden bg-[#14161A] rounded-[2.5rem] p-8 lg:p-10 border border-zinc-800/80 shadow-2xl flex flex-col justify-between w-full isolate h-[520px]">
                <div class="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none z-10" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
                <div class="absolute -top-24 -right-24 w-[350px] h-[350px] bg-zinc-500/15 rounded-full blur-[80px] pointer-events-none transition-transform duration-[10s] group-hover:scale-125 z-0"></div>
                <div class="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-zinc-400/10 rounded-full blur-[70px] pointer-events-none z-0"></div>

                <!-- Top Badge -->
                <div class="relative z-20">
                  <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1C21]/80 backdrop-blur-sm border border-white/10 shadow-xl text-xs font-semibold text-zinc-300">
                    <span class="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.3)]"></span>
                    Part of the Flowjoy ecosystem
                  </div>
                </div>

                <div class="relative z-20 mt-auto">
                  <h3 class="text-[2.75rem] font-bold text-white mb-4 leading-[1.05] tracking-tight">Your SMS.<br /><span class="font-['Instrument_Serif'] italic font-normal text-zinc-400">Supercharged.</span></h3>
                  <p class="text-zinc-400 text-[15px] font-light mb-8">Campaigns, contacts, AI compliance — turn SMS into a revenue engine.</p>
                  <button on:click={() => goto('/signup')} class="w-full py-4 text-center bg-white hover:bg-zinc-100 text-zinc-900 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95">Start Free Today</button>
                </div>
              </div>
            </div>

          </div>
        {/if}
      </div>
    </section>

    <!-- Benefits Section -->
    <section bind:this={sectionRef} class="py-24 bg-white relative z-10 font-[Poppins]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-8 shadow-sm">
            Why Broadr?
          </div>
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-zinc-900 leading-[1.05]">
            Stop guessing.<br />
            <span class="font-['Instrument_Serif'] italic font-normal text-zinc-500">Start converting.</span>
          </h2>
          <p class="text-lg md:text-xl text-zinc-500 leading-relaxed max-w-2xl mx-auto mt-6 font-light">
            Every feature designed to help you send the right message, to the right people, at the right time.
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {#each benefits as benefit, idx}
            <div 
              class="group relative overflow-hidden bg-[#181A1F] rounded-[2rem] p-6 lg:p-8 border border-white/5 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-white/10 flex flex-col items-center justify-center text-center gap-5"
              style="opacity: {visibleBenefits ? 1 : 0}; transform: translateY({visibleBenefits ? 0 : 30}px); transition: opacity 0.6s ease {idx * 100}ms, transform 0.6s ease {idx * 100}ms;"
            >
              <div class="absolute -top-10 -right-10 w-32 h-32 opacity-[0.05] pointer-events-none transition-transform duration-700 group-hover:scale-150 group-hover:opacity-[0.1]">
                <div class="w-full h-full rounded-full bg-white blur-2xl"></div>
              </div>
              <div class="w-14 h-14 rounded-2xl bg-[#212328] border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-white group-hover:text-zinc-900 group-hover:border-transparent transition-all duration-300 relative z-10 shrink-0 shadow-inner">
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

    <!-- Pricing Section -->
    <section id="pricing" class="py-24 bg-white font-[Poppins]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-8 shadow-sm">
            Simple Pricing
          </div>
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-zinc-900 leading-[1.05]">
            Free to start.<br />
            <span class="font-['Instrument_Serif'] italic font-normal text-zinc-500">Pro when you're ready.</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Free Plan -->
          <div class="relative bg-white rounded-[2rem] p-8 md:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div class="mb-8">
              <h3 class="text-lg font-bold text-zinc-900 mb-1">Starter</h3>
              <div class="flex items-baseline gap-1 mb-3">
                <span class="text-4xl font-bold text-zinc-900">$0</span>
                <span class="text-zinc-400 text-sm">/mo</span>
              </div>
              <p class="text-sm text-zinc-500 font-light">Everything you need to get started with SMS outreach.</p>
            </div>
            <div class="space-y-3 mb-8">
              {#each ['Multi-brand messaging', '2-way inbox', 'Contact groups', 'Campaign builder', 'Basic delivery stats', 'Up to 500 contacts'] as feat}
                <div class="flex items-center gap-3 text-sm text-zinc-700">
                  <svg class="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  {feat}
                </div>
              {/each}
            </div>
            <button on:click={() => goto('/signup')} class="w-full py-3.5 rounded-xl font-semibold text-sm bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-all">
              Get Started Free
            </button>
          </div>

          <!-- Pro Plan -->
          <div class="relative bg-zinc-900 text-white rounded-[2rem] p-8 md:p-10 overflow-hidden shadow-2xl">
            <div class="absolute -top-10 -right-10 w-60 h-60 bg-white/5 rounded-full blur-[60px] pointer-events-none"></div>
            <div class="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full blur-[60px] pointer-events-none"></div>
            <div class="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
            <div class="relative z-10">
              <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                ✦ Most Popular
              </div>
              <h3 class="text-lg font-bold mb-1">Pro</h3>
              <div class="flex items-baseline gap-1 mb-3">
                <span class="text-4xl font-bold">$19.99</span>
                <span class="text-white/50 text-sm">/mo</span>
              </div>
              <p class="text-sm text-white/60 font-light mb-8">AI features unlocked. Scale without limits.</p>
              <div class="space-y-3 mb-8">
                {#each ['Everything in Starter', 'AI-powered DNC detection', 'Smart follow-up campaigns', 'Campaign insights & analytics', 'AI sentiment analysis', 'Priority support', 'Unlimited contacts'] as feat}
                  <div class="flex items-center gap-3 text-sm text-white/80">
                    <div class="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    {feat}
                  </div>
                {/each}
              </div>
              <button on:click={() => goto('/signup')} class="w-full py-3.5 rounded-xl font-bold text-sm bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                Start Pro Trial
              </button>
            </div>
          </div>
        </div>

        <!-- Custom CTA -->
        <div class="mt-12 text-center">
          <p class="text-sm text-zinc-500 font-light">
            Need a custom-built SMS follow-up system integrated with your entire business? <a href="https://flowjoy.online" target="_blank" rel="noopener noreferrer" class="text-zinc-800 font-medium hover:text-zinc-900 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-500 transition-colors">Talk to Flowjoy →</a>
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#0A0A0B] text-zinc-400 py-16 pt-24 relative overflow-hidden font-[Poppins] border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-24">
          <div class="md:col-span-5 lg:col-span-4 flex flex-col items-start gap-5">
            <div class="flex items-center gap-3 text-white">
              <div class="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#09090B] font-bold text-xl">B</div>
              <span class="font-bold text-xl tracking-tight">Broadr</span>
            </div>
            <p class="text-sm font-light">Built by <a href="https://flowjoy.online" target="_blank" rel="noopener noreferrer" class="text-white/70 hover:text-white transition-colors">Flowjoy</a> · © {new Date().getFullYear()}</p>
          </div>
          <div class="md:col-span-7 lg:col-span-8 flex flex-wrap md:justify-end gap-16 lg:gap-32">
            <div class="flex flex-col gap-4">
              <h4 class="text-white text-xs font-bold tracking-widest uppercase mb-1">Product</h4>
              <a href="#pricing" class="text-sm hover:text-white transition-colors">Pricing</a>
              <button on:click={() => goto('/signup')} class="text-sm text-left hover:text-white transition-colors">Get Started</button>
              <button on:click={() => goto('/login')} class="text-sm text-left hover:text-white transition-colors">Login</button>
            </div>
            <div class="flex flex-col gap-4">
              <h4 class="text-white text-xs font-bold tracking-widest uppercase mb-1">Company</h4>
              <a href="https://flowjoy.online" target="_blank" rel="noopener noreferrer" class="text-sm hover:text-white transition-colors">Flowjoy</a>
            </div>
          </div>
        </div>
        <div class="w-full flex justify-center items-end opacity-[0.12] pointer-events-none select-none overflow-hidden relative -mb-16 md:-mb-24">
          <h1 class="font-['Poppins'] font-black text-[12rem] md:text-[22rem] lg:text-[28rem] leading-[0.75] tracking-tighter text-transparent" style="-webkit-text-stroke: 3px rgba(255,255,255,0.5);">
            Broadr
          </h1>
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
