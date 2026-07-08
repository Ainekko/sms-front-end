<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  export let interested: number = 0;
  export let neutral: number = 0;
  export let dnc: number = 0;
  export let noReply: number = 0;

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  $: total = interested + neutral + dnc + noReply;

  function buildChart() {
    if (!canvas) return;
    if (chart) chart.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Interested 🔥', 'Neutral', 'Opted Out 🛑', 'No Reply'],
        datasets: [{
          data: [interested, neutral, dnc, noReply],
          backgroundColor: [
            'rgba(52, 211, 153, 0.85)',
            'rgba(161, 161, 170, 0.65)',
            'rgba(244, 63, 94, 0.85)',
            'rgba(63, 63, 70, 0.5)'
          ],
          borderColor: [
            'rgba(52, 211, 153, 0.3)',
            'rgba(161, 161, 170, 0.2)',
            'rgba(244, 63, 94, 0.3)',
            'rgba(63, 63, 70, 0.2)'
          ],
          borderWidth: 2,
          hoverOffset: 8,
          spacing: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#fff',
            bodyColor: '#a1a1aa',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            titleFont: { family: 'Poppins', size: 11, weight: 'bold' },
            bodyFont: { family: 'Poppins', size: 11 },
            padding: 12,
            cornerRadius: 12,
            callbacks: {
              label: function(ctx: any) {
                const val = ctx.parsed;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${ctx.label}: ${val} (${pct}%)`;
              }
            }
          }
        },
      }
    });
  }

  $: if (canvas && (interested || neutral || dnc || noReply)) {
    buildChart();
  }

  onMount(() => {
    buildChart();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<div class="flex flex-col items-center gap-6 w-full h-full">
  <div class="relative w-full flex-1 min-h-[200px]">
    <canvas bind:this={canvas}></canvas>
    <!-- Center label -->
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span class="text-3xl font-extrabold text-white font-[Poppins]">{total}</span>
      <span class="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mt-0.5">Recipients</span>
    </div>
  </div>

  <!-- Custom Legend -->
  <div class="grid grid-cols-2 gap-x-5 gap-y-2 text-center justify-center">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
      <span class="text-[11px] font-semibold text-zinc-400 font-[Poppins]">Interested <span class="text-white font-bold">{interested}</span></span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
      <span class="text-[11px] font-semibold text-zinc-400 font-[Poppins]">Neutral <span class="text-white font-bold">{neutral}</span></span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
      <span class="text-[11px] font-semibold text-zinc-400 font-[Poppins]">Opted Out <span class="text-white font-bold">{dnc}</span></span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
      <span class="text-[11px] font-semibold text-zinc-400 font-[Poppins]">No Reply <span class="text-white font-bold">{noReply}</span></span>
    </div>
  </div>
</div>
