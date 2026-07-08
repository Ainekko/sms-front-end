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

  onMount(() => {
    setTimeout(() => (mounted = true), 50);
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
  <div class="font-[Poppins] min-h-screen overflow-x-clip selection:bg-emerald-500/30 bg-white">
    
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-6 py-4">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <a href="/" class="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-sm">B</div>
          Broadr
        </a>
        <div class="flex items-center gap-4">
          <a href="#features" class="hidden sm:inline-flex text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Features</a>
          <a href="#pricing" class="hidden sm:inline-flex text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</a>
          {#if $isAuthInitialized}
            <button on:click={() => goto('/signup')} class="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-md transition-all">
              Get Started Free
            </button>
          {/if}
        </div>
      </div>
    </header>

    <!-- ═══════════ HERO ═══════════ -->
    <section class="relative pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col justify-center overflow-hidden">
      <!-- Prism gradient mesh -->
      <div class="prism-wrap">
        <div class="prism-blob prism-1"></div>
        <div class="prism-blob prism-2"></div>
        <div class="prism-blob prism-3"></div>
        <div class="prism-blob prism-4"></div>
      </div>
      <!-- Noise overlay -->
      <div class="noise-overlay"></div>
      <!-- Dot grid -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.3] z-[2]" style="background-image: radial-gradient(circle, #d4d4d8 0.6px, transparent 0.6px); background-size: 28px 28px;"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {#if mounted}
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <!-- Left Column -->
            <div class="lg:col-span-7 space-y-8 lg:pr-8">
              <h1 class="text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 leading-[1.05] tracking-tight">
                <span in:blur={{ duration: 800, delay: 100, amount: 8 }}>Import lists.</span><br />
                <span in:blur={{ duration: 800, delay: 250, amount: 8 }}>Run SMS Campaigns.</span><br />
                <span in:blur={{ duration: 800, delay: 400, amount: 8 }} class="font-['Instrument_Serif'] italic text-zinc-500 font-normal tracking-wide">Stay Compliant.</span>
              </h1>

              <p in:blur={{ duration: 700, delay: 180, amount: 6 }} class="text-lg md:text-xl text-zinc-500 leading-relaxed font-light max-w-xl">
                The lightweight SMS platform built for sales teams. Import CSVs, run campaigns, auto-exclude opt-outs, and instantly surface hot replies.
                <span class="block mt-3 text-base md:text-lg font-semibold text-zinc-800">Clean, compliance-first, and built for speed. No bloated features.</span>
                <span class="block mt-4 text-xs font-bold text-emerald-600 tracking-wider uppercase">CSV Upload · Smart Filter Lists · AI Compliance Built-in</span>
              </p>

              <!-- Main CTA -->
              <div in:fly={{ y: 20, duration: 600, delay: 350 }} class="flex flex-wrap items-center gap-4">
                <button on:click={() => goto('/signup')} class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm tracking-wide transition-all duration-300 shadow-[0_12px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_16px_40px_rgba(16,185,129,0.4)] hover:scale-[1.03]">
                  Start Free Today
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
                <a href="#pricing" class="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-sm transition-all duration-300">
                  View Pricing &rarr;
                </a>
              </div>

              <!-- Proof stats -->
              <div in:fly={{ y: 20, duration: 600, delay: 420 }} class="flex flex-col sm:flex-row items-center gap-4 max-w-lg">
                {#each [{ val: '0%', label: 'Compliance Penalties', sub: 'Auto-DNC system' }, { val: '10x', label: 'More Replies', sub: 'Than email campaigns' }, { val: '<2m', label: 'Upload to Send', sub: 'Fast CSV parser' }] as stat}
                  <div class="flex-1 w-full p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-md border border-zinc-200 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 shadow-sm">
                    <div class="relative z-10">
                      <div class="text-2xl font-bold text-zinc-900 tracking-tight leading-none mb-1">{stat.val}</div>
                      <div class="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">{stat.label}</div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Right: Interactive Dashboard Mockup -->
            <div class="lg:col-span-5 w-full relative" in:fly={{ y: 30, duration: 800, delay: 200 }}>
              <div class="group relative overflow-hidden bg-[#111215] rounded-[2.5rem] p-6 border border-white/[0.06] shadow-2xl flex flex-col justify-between w-full isolate h-[540px]">
                <div class="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none z-10" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');"></div>
                <div class="absolute -top-24 -right-24 w-[350px] h-[350px] bg-emerald-600/15 rounded-full blur-[80px] pointer-events-none z-0"></div>
                <div class="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-blue-500/15 rounded-full blur-[70px] pointer-events-none z-0"></div>

                <!-- Header area of mock UI -->
                <div class="relative z-20 flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">Campaign: Q3 Outreach</h4>
                    <span class="text-[10px] text-zinc-500">Source: leads_july.csv</span>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">Active</span>
                </div>

                <!-- Stats in mock UI -->
                <div class="relative z-20 grid grid-cols-4 gap-2 my-4">
                  <div class="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                    <span class="text-[10px] text-zinc-500 block">Sent</span>
                    <span class="text-sm font-bold text-white">1,420</span>
                  </div>
                  <div class="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                    <span class="text-[10px] text-zinc-500 block">Replied</span>
                    <span class="text-sm font-bold text-white">312</span>
                  </div>
                  <div class="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-center">
                    <span class="text-[10px] text-emerald-400 block font-medium">Interested 🔥</span>
                    <span class="text-sm font-bold text-emerald-400">42</span>
                  </div>
                  <div class="bg-rose-500/5 border border-rose-500/10 rounded-xl p-2.5 text-center">
                    <span class="text-[10px] text-rose-400 block font-medium">DNC 🛑</span>
                    <span class="text-sm font-bold text-rose-400">18</span>
                  </div>
                </div>

                <!-- Live Chat/Alert Stream in Mock UI -->
                <div class="relative z-20 flex-1 space-y-3 overflow-y-auto pr-1 py-1 custom-scrollbar">
                  <!-- Msg 1 -->
                  <div class="bg-[#18191E] border border-white/5 rounded-xl p-3 flex justify-between items-start gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[11px] font-bold text-white">Alex Mercer</span>
                        <span class="text-[9px] text-zinc-500">1m ago</span>
                      </div>
                      <p class="text-[11px] text-zinc-300 leading-tight">"Yeah, this looks great. Can you send over a demo link?"</p>
                    </div>
                    <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-[9px] font-bold text-emerald-400 uppercase shrink-0">Interested</span>
                  </div>

                  <!-- Msg 2 -->
                  <div class="bg-[#18191E] border border-white/5 rounded-xl p-3 flex justify-between items-start gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[11px] font-bold text-white">Sarah Jenkins</span>
                        <span class="text-[9px] text-zinc-500">4m ago</span>
                      </div>
                      <p class="text-[11px] text-zinc-300 leading-tight">"Please stop messaging this number."</p>
                    </div>
                    <span class="px-2 py-0.5 rounded bg-rose-500/15 text-[9px] font-bold text-rose-400 uppercase shrink-0">DNC Flagged</span>
                  </div>

                  <!-- Msg 3 -->
                  <div class="bg-[#18191E]/50 border border-white/5 rounded-xl p-3 opacity-60">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[11px] font-bold text-white">David Miller</span>
                      <span class="text-[9px] text-zinc-500">12m ago</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 leading-tight">"I'll look at this over the weekend."</p>
                  </div>
                </div>

                <!-- Follow-up Campaign Trigger Mock -->
                <div class="relative z-20 mt-4 border-t border-white/5 pt-4">
                  <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p class="text-[11px] font-bold text-white">Configure Follow-up Campaign</p>
                      <p class="text-[9px] text-zinc-400">Targeting: 1,108 No Replies · Excluding: 18 DNC</p>
                    </div>
                    <button class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[10px] transition-colors">Start Sequence</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- ═══════════ FEATURES SECTION ═══════════ -->
    <section id="features" class="py-24 bg-[#09090B] text-white relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm font-medium text-zinc-400 mb-6">
            Engineered for High-Volume Outreach
          </div>
          <h2 class="text-4xl md:text-5xl font-bold mb-5 tracking-tight leading-[1.05]">
            Run campaigns, isolate hot leads,<br />and stay out of <span class="font-['Instrument_Serif'] italic font-normal text-zinc-500">compliance trouble</span>.
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {#each [
            { title: 'CSV List Importing', desc: 'Import contacts in seconds. Broadr parses phone numbers, checks for formatting, and prepares clean campaigns.', icon: '📁' },
            { title: 'Smart Campaign Launcher', desc: 'Send bulk SMS with automatic send throttling. Customize messages dynamically with variables.', icon: '🚀' },
            { title: 'Real-time Two-way Inbox', desc: 'Chat directly with leads that reply. High-fidelity texting client lets you handle objections in real-time.', icon: '💬' },
            { title: 'Do Not Contact Safeguard', desc: 'Any opt-out keywords (STOP, unsubscribe) automatically flag the contact as DNC, blocking future texts.', icon: '🛡️' }
          ] as feat}
            <div class="group relative bg-[#111215] rounded-[2rem] p-8 border border-white/[0.06] overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:border-white/10">
              <span class="text-3xl mb-4 block">{feat.icon}</span>
              <h3 class="text-lg font-bold text-white mb-2 tracking-tight">{feat.title}</h3>
              <p class="text-zinc-400 text-xs leading-relaxed font-light">{feat.desc}</p>
            </div>
          {/each}
        </div>

        <!-- Secondary Feature Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div class="bg-[#111215] rounded-[2rem] p-8 border border-white/[0.06] flex flex-col md:flex-row gap-6 items-start">
            <span class="text-3xl p-3 bg-white/[0.03] border border-white/5 rounded-2xl shrink-0">🔥</span>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">Priority Sentiment Flagging</h3>
              <p class="text-zinc-400 text-xs leading-relaxed font-light">If you send 1,000s of messages, our system detects "interested" sentiments and flags them immediately. Zero time wasted wading through complaints or confusion.</p>
            </div>
          </div>
          <div class="bg-[#111215] rounded-[2rem] p-8 border border-white/[0.06] flex flex-col md:flex-row gap-6 items-start">
            <span class="text-3xl p-3 bg-white/[0.03] border border-white/5 rounded-2xl shrink-0">🔁</span>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">Non-Reply Follow-ups</h3>
              <p class="text-zinc-400 text-xs leading-relaxed font-light">Quickly build second-step campaigns targeting only leads who didn't respond to the first message. The system auto-excludes active DNCs so you stay compliant.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════ PRICING ═══════════ -->
    <section id="pricing" class="py-24 bg-white relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-8 shadow-sm">
            Fair & Transparent
          </div>
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-zinc-900 leading-[1.05]">
            Simple plans.<br />
            <span class="font-['Instrument_Serif'] italic font-normal text-zinc-500">For growth at any scale.</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Free -->
          <div class="bg-white rounded-[2rem] p-10 border border-zinc-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-bold text-zinc-900 mb-1">Starter</h3>
              <div class="flex items-baseline gap-1 mb-6">
                <span class="text-4xl font-bold text-zinc-900">$0</span>
                <span class="text-zinc-400 text-sm">/mo</span>
              </div>
              <ul class="space-y-4 mb-10 text-sm text-zinc-600">
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> CSV Contact Import</li>
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> 2-way messaging inbox</li>
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Standard campaigns</li>
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Up to 500 contacts</li>
              </ul>
            </div>
            <button on:click={() => goto('/signup')} class="w-full py-4 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all">Get Started Free</button>
          </div>

          <!-- Pro -->
          <div class="bg-[#111215] text-white rounded-[2rem] p-10 border border-white/[0.06] shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px]"></div>
            <div class="relative z-10">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-6">Most Popular</div>
              <h3 class="text-lg font-bold mb-1">Pro + AI</h3>
              <div class="flex items-baseline gap-1 mb-6">
                <span class="text-4xl font-bold">$19.99</span>
                <span class="text-zinc-500 text-sm">/mo</span>
              </div>
              <ul class="space-y-4 mb-10 text-sm text-zinc-400">
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Auto-flag DNC (opt-outs)</li>
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Sentiment flagging (Interested leads)</li>
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Smart non-reply follow-ups</li>
                <li class="flex items-center gap-3"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Unlimited contacts & advanced stats</li>
              </ul>
            </div>
            <button on:click={() => goto('/signup')} class="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Start Pro Trial</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#09090B] border-t border-white/[0.04] py-16 text-center">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-zinc-900 font-bold text-xl">B</div>
          <span class="text-white font-bold text-2xl tracking-tight">Broadr</span>
        </div>
        <p class="text-zinc-500 text-sm font-light">
          Built by <a href="https://flowjoy.online" class="text-white hover:text-emerald-400 transition-colors">Flowjoy</a> · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>

  </div>
{/if}

<style>
  /* ── Prism container ── */
  .prism-wrap {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    clip-path: inset(0);
    filter: blur(80px) saturate(1.8);
    opacity: 0.45;
  }

  .prism-blob {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
  }

  .prism-1 {
    width: 45%;
    height: 55%;
    top: -15%;
    left: -8%;
    background: conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b);
    animation: drift1 18s ease-in-out infinite;
  }

  .prism-2 {
    width: 40%;
    height: 50%;
    bottom: -20%;
    right: -10%;
    background: conic-gradient(from 120deg, #0abde3, #a29bfe, #fd79a8, #fdcb6e, #0abde3);
    animation: drift2 22s ease-in-out infinite;
  }

  .prism-3 {
    width: 30%;
    height: 40%;
    top: 30%;
    right: 15%;
    background: conic-gradient(from 240deg, #6c5ce7, #00cec9, #e17055, #74b9ff, #6c5ce7);
    animation: drift3 25s ease-in-out infinite;
  }

  .prism-4 {
    width: 25%;
    height: 35%;
    bottom: 10%;
    left: 20%;
    background: conic-gradient(from 60deg, #fd79a8, #fdcb6e, #00b894, #e84393, #fd79a8);
    animation: drift4 20s ease-in-out infinite;
  }

  @keyframes drift1 {
    0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
    33% { transform: translate(8%, 12%) rotate(40deg) scale(1.08); }
    66% { transform: translate(-5%, 6%) rotate(-20deg) scale(0.95); }
  }
  @keyframes drift2 {
    0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
    33% { transform: translate(-10%, -8%) rotate(-35deg) scale(1.1); }
    66% { transform: translate(6%, -4%) rotate(25deg) scale(0.92); }
  }
  @keyframes drift3 {
    0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
    50% { transform: translate(-12%, 10%) rotate(50deg) scale(1.12); }
  }
  @keyframes drift4 {
    0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
    40% { transform: translate(10%, -6%) rotate(-30deg) scale(1.05); }
    70% { transform: translate(-8%, 8%) rotate(20deg) scale(0.98); }
  }

  .noise-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0.1;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* ── Custom Scrollbar for Chat History ── */
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 99px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }

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
    border-top-color: #10b981;
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
    background: #18181b;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }

  .title {
    font-size: 1.35rem; font-weight: 700; color: #f4f4f5;
    margin: 0 0 0.5rem; letter-spacing: -0.01em;
  }
  .subtitle {
    font-size: 0.875rem; color: #71717a; margin: 0 0 1.5rem; line-height: 1.5;
  }

  .actions { display: flex; justify-content: center; gap: 0.75rem; }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.65rem 1.25rem; border-radius: 9px; border: none;
    background: #10b981;
    color: white; font-size: 0.875rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(16,185,129,0.3); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.65rem 1.25rem; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; color: #a1a1aa;
    font-size: 0.875rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #e4e4e7; }
  .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  .form { text-align: left; display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; }
  .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
  .form-group label { font-size: 0.75rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.04em; }
  .form-group input { padding: 0.7rem 0.9rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #f4f4f5; font-size: 0.9rem; outline: none; transition: all 0.15s; }
  .form-group input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
  .form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.25rem; }

  .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
