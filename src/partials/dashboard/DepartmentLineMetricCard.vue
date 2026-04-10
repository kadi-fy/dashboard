<template>
  <section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
    <header class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="h-8 w-8 rounded-lg flex items-center justify-center" :class="iconClass">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ title }}</h3>
          <p class="text-[10px] tracking-wider" :class="subtitleClass">{{ subtitle }}</p>
        </div>
      </div>
      <div class="text-xs text-gray-500">点击折线点查看趋势</div>
    </header>

    <div class="h-[2px]" :class="accentClass"></div>

    <div class="p-3 h-[300px] relative bg-white dark:bg-gray-800">
      <canvas ref="canvasRef"></canvas>
      <div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">暂无数据</div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  metricKey: { type: String, required: true },
  metricType: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  accentClass: { type: String, default: 'bg-sky-400' },
  iconClass: { type: String, default: 'bg-sky-100 text-sky-600' },
  subtitleClass: { type: String, default: 'text-sky-500' },
  primaryLabel: { type: String, default: '' },
  primaryColor: { type: String, default: '#2563eb' },
  secondaryColor: { type: String, default: '#14b8a6' },
  unitLabel: { type: String, default: '' },
  secondaryMetricKey: { type: String, default: '' },
  secondaryLabel: { type: String, default: '' },
})

const emit = defineEmits(['point-click'])

const canvasRef = ref(null)
let chart = null

const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

const formatMetricValue = (value) => {
  if (props.unitLabel === '人') return `${Math.round(toNum(value))}${props.unitLabel}`
  return `${toNum(value).toFixed(2)}${props.unitLabel}`
}

const isEmpty = computed(() => !props.rows || props.rows.length === 0)

const renderChart = () => {
  if (!canvasRef.value) return
  if (chart) {
    chart.destroy()
    chart = null
  }
  if (isEmpty.value) return

  const labels = props.rows.map((r) => r.org_name)
  const values = props.rows.map((r) => toNum(r[props.metricKey]))
  const secondaryValues = props.secondaryMetricKey
    ? props.rows.map((r) => toNum(r[props.secondaryMetricKey]))
    : []

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: props.primaryLabel || props.title,
          data: values,
          borderColor: props.primaryColor,
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          fill: true,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25,
        },
        ...(props.secondaryMetricKey
          ? [
              {
                label: props.secondaryLabel || '第二指标',
                data: secondaryValues,
                borderColor: props.secondaryColor,
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                fill: false,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.25,
              },
            ]
          : []),
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: !!props.secondaryMetricKey, position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatMetricValue(context.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#eef2f7' },
        },
        x: {
          ticks: { maxRotation: 20, minRotation: 20, color: '#475569' },
          grid: { display: false },
        },
      },
      onClick: (_evt, elements) => {
        if (!elements.length) return
        const idx = elements[0].index
        emit('point-click', {
          row: props.rows[idx],
          metricType: props.metricType,
          metricKey: props.secondaryMetricKey ? 'charge_contract_per' : props.metricKey,
        })
      },
    },
  })
}

watch(() => [props.rows, props.metricKey], () => renderChart(), { deep: true })

onMounted(() => renderChart())
onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>
