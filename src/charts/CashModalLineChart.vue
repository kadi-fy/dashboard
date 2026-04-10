<template>
  <canvas ref="canvasRef" class="w-full h-full"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const props = defineProps({
  currentValues: { type: Array, default: () => [] },
  lastYearValues: { type: Array, default: () => [] },
  targetValues: { type: Array, default: () => [] },
  showTarget: { type: Boolean, default: true },
})

const canvasRef = ref(null)
let chart = null

const renderChart = () => {
  if (!canvasRef.value) return

  if (chart) {
    chart.destroy()
    chart = null
  }

  const labels = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

  chart = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '今年',
          data: props.currentValues,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          fill: true,
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.25,
        },
        {
          label: '去年同期',
          data: props.lastYearValues,
          borderColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 1,
          tension: 0.25,
        },
        ...(props.showTarget
          ? [{
            label: '年度目标',
            data: props.targetValues,
            borderColor: '#eab308',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.25,
          }]
          : []),
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            color: '#334155',
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y || 0).toFixed(1)} 万元`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#64748b',
          },
          title: {
            display: true,
            text: '月份',
            color: '#64748b',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#64748b',
            callback: (v) => `${v}`,
          },
          title: {
            display: true,
            text: '金额（万元）',
            color: '#64748b',
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
        },
      },
    },
  })
}

watch(
  () => [props.currentValues, props.lastYearValues, props.targetValues],
  () => renderChart(),
  { deep: true },
)

onMounted(() => renderChart())
onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>
