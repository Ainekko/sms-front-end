<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  export let positive: number = 0;
  export let neutral: number = 0;
  export let negative: number = 0;

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function buildChart() {
    if (!canvas) return;
    if (chart) chart.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Interested / Positive', 'Neutral / Inquiries', 'Negative / DNC'],
        datasets: [{
          data: [positive, neutral, negative],
          backgroundColor: [
            'rgba(52, 211, 153, 0.6)',
            'rgba(161, 161, 170, 0.4)',
            'rgba(244, 63, 94, 0.5)',
          ],
          borderColor: [
            'rgba(52, 211, 153, 0.3)',
            'rgba(161, 161, 170, 0.2)',
            'rgba(244, 63, 94, 0.3)',
          ],
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
          }
        },
        scales: {
          r: {
            grid: {
              color: 'rgba(255,255,255,0.04)',
            },
            ticks: {
              display: false,
            },
            pointLabels: {
              display: false,
            }
          }
        }
      }
    });
  }

  $: if (canvas && (positive || neutral || negative)) {
    buildChart();
  }

  onMount(() => {
    buildChart();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<div class="flex flex-col items-center gap-5 w-full h-full">
  <div class="relative w-full flex-1 min-h-[200px]">
    <canvas bind:this={canvas}></canvas>
  </div>
  <div class="flex flex-wrap items-center justify-center gap-4">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
      <span class="text-[11px] font-semibold text-zinc-400 font-[Poppins]">Positive <span class="text-emerald-400 font-bold">{positive}</span></span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
      <span class="text-[11px] font-semibold text-zinc-400 font-[Poppins]">Neutral <span class="text-white font-bold">{neutral}</span></span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
      <span class="text-[11px] font-semibold text-zinc-400 font-[Poppins]">Negative <span class="text-rose-400 font-bold">{negative}</span></span>
    </div>
  </div>
</div>
