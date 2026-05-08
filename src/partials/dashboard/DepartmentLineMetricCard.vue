<template>
  <section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
    <header class="relative overflow-hidden px-4 py-3 border-b flex items-center justify-between" :class="headerTheme.headerClass">
      <div class="pointer-events-none absolute -left-10 -top-8 h-24 w-24 rounded-full blur-2xl" :class="headerTheme.glowLeftClass"></div>
      <div class="pointer-events-none absolute right-4 -bottom-10 h-20 w-20 rounded-full blur-2xl" :class="headerTheme.glowRightClass"></div>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent" :class="headerTheme.energyLineClass"></div>
      <div class="flex items-center gap-2">
        <div class="h-8 w-8 rounded-lg flex items-center justify-center ring-1" :class="[iconClass, headerTheme.iconFrameClass]">
          <DotLottieVue
            class="h-7 w-7"
            autoplay
            loop
            :src="doodleLottieSrc"
          />
        </div>
        <div>
          <h3 class="text-lg font-extrabold tracking-[0.03em] text-slate-800 dark:text-slate-100">{{ title }}</h3>
          <p class="text-[10px] tracking-[0.2em] uppercase" :class="subtitleClass">{{ subtitle }}</p>
        </div>
      </div>
      <div
        v-if="secondaryMetricKey"
        class="hidden md:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/45 rounded-full px-3 py-1 ring-1 backdrop-blur-sm"
        :class="headerTheme.signalFrameClass"
      >
        <span class="flex items-center gap-1">
          <i class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: primaryColor }"></i>
          {{ primaryLabel || title }}
        </span>
        <span class="flex items-center gap-1">
          <i class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: secondaryColor }"></i>
          {{ secondaryLabel || '第二指标' }}
        </span>
      </div>
      <div v-else class="hidden md:flex items-center gap-1.5" aria-hidden="true">
        <span class="h-2 w-2 rounded-full ring-2 ring-white/70 dark:ring-slate-900/60" :class="headerTheme.signalDotClass"></span>
        <span class="h-1.5 w-8 rounded-full" :class="headerTheme.signalBarClass"></span>
        <span class="h-1.5 w-4 rounded-full opacity-70" :class="headerTheme.signalBarClass"></span>
      </div>
    </header>

    <div class="p-3 h-[300px] relative bg-white dark:bg-gray-800">
      <canvas ref="canvasRef"></canvas>
      <div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">暂无数据</div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
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

const zeroBaselinePlugin = {
  id: 'zeroBaselinePlugin',
  afterDraw(chart, _args, pluginOptions) {
    if (!pluginOptions?.enabled) return

    const yScale = chart.scales?.y
    const area = chart.chartArea
    if (!yScale || !area) return

    const y = yScale.getPixelForValue(0)
    if (!Number.isFinite(y) || y < area.top || y > area.bottom) return

    const ctx = chart.ctx
    ctx.save()
    ctx.beginPath()
    ctx.setLineDash(pluginOptions.dash || [8, 6])
    ctx.lineWidth = pluginOptions.lineWidth || 1.5
    ctx.strokeStyle = pluginOptions.color || 'rgba(16, 185, 129, 0.78)'
    ctx.moveTo(area.left, y)
    ctx.lineTo(area.right, y)
    ctx.stroke()
    ctx.restore()
  },
}

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, zeroBaselinePlugin)

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
const doodleLottieSrc = '/lottie/doodle-motif-316-growth-hover-pinch.json'
let chart = null

const destroyChart = () => {
  if (chart) {
    chart.destroy()
    chart = null
  }
}

const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

const formatMetricValue = (value) => {
  if (props.unitLabel === '人') return `${Math.round(toNum(value))}${props.unitLabel}`
  return `${toNum(value).toFixed(2)}${props.unitLabel}`
}

const isEmpty = computed(() => !props.rows || props.rows.length === 0)

const headerTheme = computed(() => {
  const themes = {
    'line-charge-per': {
      headerClass: 'border-cyan-100/80 dark:border-cyan-500/20 bg-gradient-to-r from-slate-50 via-cyan-50/65 to-sky-50/75 dark:from-slate-900/85 dark:via-cyan-950/25 dark:to-slate-900/70',
      glowLeftClass: 'bg-cyan-300/20 dark:bg-cyan-400/15',
      glowRightClass: 'bg-sky-300/20 dark:bg-sky-400/15',
      energyLineClass: 'via-cyan-400/70 dark:via-cyan-300/60',
      iconFrameClass: 'ring-cyan-300/35 dark:ring-cyan-400/25 shadow-[0_0_14px_rgba(34,211,238,0.2)] dark:shadow-[0_0_18px_rgba(56,189,248,0.14)]',
      signalDotClass: 'bg-cyan-400/90 dark:bg-cyan-300/85',
      signalBarClass: 'bg-cyan-400/75 dark:bg-cyan-300/65',
      signalFrameClass: 'ring-cyan-200/70 dark:ring-cyan-400/30',
    },
    'line-cost-per': {
      headerClass: 'border-amber-100/80 dark:border-amber-500/20 bg-gradient-to-r from-slate-50 via-amber-50/70 to-orange-50/75 dark:from-slate-900/85 dark:via-amber-950/25 dark:to-slate-900/70',
      glowLeftClass: 'bg-amber-300/20 dark:bg-amber-400/15',
      glowRightClass: 'bg-orange-300/20 dark:bg-orange-400/15',
      energyLineClass: 'via-amber-400/70 dark:via-amber-300/60',
      iconFrameClass: 'ring-amber-300/35 dark:ring-amber-400/25 shadow-[0_0_14px_rgba(251,191,36,0.2)] dark:shadow-[0_0_18px_rgba(245,158,11,0.14)]',
      signalDotClass: 'bg-amber-400/90 dark:bg-amber-300/85',
      signalBarClass: 'bg-amber-400/75 dark:bg-amber-300/65',
      signalFrameClass: 'ring-amber-200/70 dark:ring-amber-400/30',
    },
    'line-profit-per': {
      headerClass: 'border-emerald-100/80 dark:border-emerald-500/20 bg-gradient-to-r from-slate-50 via-emerald-50/70 to-teal-50/75 dark:from-slate-900/85 dark:via-emerald-950/25 dark:to-slate-900/70',
      glowLeftClass: 'bg-emerald-300/20 dark:bg-emerald-400/15',
      glowRightClass: 'bg-teal-300/20 dark:bg-teal-400/15',
      energyLineClass: 'via-emerald-400/70 dark:via-emerald-300/60',
      iconFrameClass: 'ring-emerald-300/35 dark:ring-emerald-400/25 shadow-[0_0_14px_rgba(52,211,153,0.2)] dark:shadow-[0_0_18px_rgba(16,185,129,0.14)]',
      signalDotClass: 'bg-emerald-400/90 dark:bg-emerald-300/85',
      signalBarClass: 'bg-emerald-400/75 dark:bg-emerald-300/65',
      signalFrameClass: 'ring-emerald-200/70 dark:ring-emerald-400/30',
    },
    'line-headcount': {
      headerClass: 'border-indigo-100/80 dark:border-indigo-500/20 bg-gradient-to-r from-slate-50 via-indigo-50/70 to-blue-50/75 dark:from-slate-900/85 dark:via-indigo-950/25 dark:to-slate-900/70',
      glowLeftClass: 'bg-indigo-300/20 dark:bg-indigo-400/15',
      glowRightClass: 'bg-blue-300/20 dark:bg-blue-400/15',
      energyLineClass: 'via-indigo-400/70 dark:via-indigo-300/60',
      iconFrameClass: 'ring-indigo-300/35 dark:ring-indigo-400/25 shadow-[0_0_14px_rgba(129,140,248,0.2)] dark:shadow-[0_0_18px_rgba(99,102,241,0.14)]',
      signalDotClass: 'bg-indigo-400/90 dark:bg-indigo-300/85',
      signalBarClass: 'bg-indigo-400/75 dark:bg-indigo-300/65',
      signalFrameClass: 'ring-indigo-200/70 dark:ring-indigo-400/30',
    },
  }

  return themes[props.metricType] || themes['line-charge-per']
})

const renderChart = () => {
  const canvasEl = canvasRef.value
  if (!canvasEl || !canvasEl.isConnected) {
    destroyChart()
    return
  }
  if (isEmpty.value) {
    destroyChart()
    return
  }

  const labels = props.rows.map((r) => r.org_name)
  const values = props.rows.map((r) => toNum(r[props.metricKey]))
  const secondaryValues = props.secondaryMetricKey
    ? props.rows.map((r) => toNum(r[props.secondaryMetricKey]))
    : []

  const ctx = canvasEl.getContext('2d')
  if (!ctx) return

  const datasets = [
    {
      label: props.primaryLabel || props.title,
      data: values,
      borderColor: props.primaryColor,
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: false,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: props.primaryColor,
      pointBorderColor: props.primaryColor,
      pointHoverBackgroundColor: props.primaryColor,
      pointHoverBorderColor: props.primaryColor,
      pointBorderWidth: 0,
      tension: 0,
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
            pointHoverRadius: 6,
            pointBackgroundColor: props.secondaryColor,
            pointBorderColor: props.secondaryColor,
            pointHoverBackgroundColor: props.secondaryColor,
            pointHoverBorderColor: props.secondaryColor,
            pointBorderWidth: 0,
            tension: 0,
          },
        ]
      : []),
  ]

  const chartOptions = {
    maintainAspectRatio: false,
    animation: {
      duration: 520,
      easing: 'easeOutCubic',
    },
    plugins: {
      legend: { display: false },
      zeroBaselinePlugin: {
        enabled: props.metricType === 'line-profit-per',
        color: 'rgba(16, 185, 129, 0.78)',
        dash: [8, 6],
        lineWidth: 1.6,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (!props.secondaryMetricKey) {
              return `${context.dataset.label}: ${formatMetricValue(context.parsed.y)}`
            }

            if (context.datasetIndex !== 0) return null

            const idx = context.dataIndex
            const primaryText = `${props.primaryLabel || props.title}: ${formatMetricValue(values[idx])}`
            const secondaryText = `${props.secondaryLabel || '第二指标'}: ${formatMetricValue(secondaryValues[idx])}`
            return `${primaryText} | ${secondaryText}`
          },
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#eef2f7' },
        title: {
          display: !!props.unitLabel,
          text: props.unitLabel,
          color: '#64748b',
          font: {
            size: 12,
            weight: '600',
          },
        },
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
  }

  if (chart) {
    chart.data.labels = labels
    chart.data.datasets = datasets
    chart.options = chartOptions
    chart.update('none')  // 屏外组件跳过渲染动画节省 CPU
    return
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: chartOptions,
  })
}

watch(() => [props.rows, props.metricKey, props.secondaryMetricKey], () => renderChart(), { deep: false })

onMounted(() => renderChart())
onBeforeUnmount(() => destroyChart())
</script>
