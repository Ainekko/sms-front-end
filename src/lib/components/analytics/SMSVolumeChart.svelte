<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  export let chartData: {
    labels: string[];
    sent: number[];
    replies: number[];
  };

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function buildChart() {
    if (!canvas) return;
    if (chart) chart.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gradient for sent messages
    const gradientSent = ctx.createLinearGradient(0, 0, 0, 260);
    gradientSent.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    gradientSent.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

    // Gradient for replies
    const gradientReplies = ctx.createLinearGradient(0, 0, 0, 260);
    gradientReplies.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
    gradientReplies.addColorStop(1, 'rgba(139, 92, 246, 0.02)');

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Sent Messages',
            data: chartData.sent,
            backgroundColor: gradientSent,
            borderColor: 'rgba(99, 102, 241, 0.6)',
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Replies Received',
            data: chartData.replies,
            backgroundColor: gradientReplies,
            borderColor: 'rgba(139, 92, 246, 0.6)',
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#71717a',
              font: { family: 'Poppins', size: 10, weight: 'bold' },
              usePointStyle: true,
              pointStyle: 'rectRounded',
              padding: 16,
              boxWidth: 8,
              boxHeight: 8,
            }
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
            displayColors: true,
            boxPadding: 4,
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#52525b',
              font: { family: 'Poppins', size: 10, weight: 'normal' },
              padding: 8,
            },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255,255,255,0.03)',
            },
            ticks: {
              color: '#52525b',
              font: { family: 'SF Mono', size: 10 },
              padding: 8,
            },
            border: { display: false },
          }
        }
      }
    });
  }

  $: if (canvas && chartData) {
    buildChart();
  }

  onMount(() => {
    buildChart();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<div class="w-full h-full min-h-[280px]">
  <canvas bind:this={canvas}></canvas>
</div>
