<template>
  <canvas ref="canvas" :width="width" :height="height"></canvas>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useDark } from '@vueuse/core'
import {
  Chart, LineController, LineElement, Filler, PointElement, LinearScale, CategoryScale, Tooltip,
} from 'chart.js'

Chart.register(LineController, LineElement, Filler, PointElement, LinearScale, CategoryScale, Tooltip)

export default {
  name: 'MetricLineChart',
  props: {
    currentValues: {
      type: Array,
      default: () => [],
    },
    lastyearValues: {
      type: Array,
      default: () => [],
    },
    unit: {
      type: String,
      default: '',
    },
    width: {
      type: [Number, String],
      default: null,
    },
    height: {
      type: [Number, String],
      default: null,
    },
  },
  setup(props) {
    const canvas = ref(null)
    let chart = null
    const darkMode = useDark()

    const chartData = computed(() => {
      const len = Math.max(props.currentValues.length, props.lastyearValues.length)
      if (!len) return null

      const labels = Array.from({ length: len }, (_, idx) => `${idx + 1}月`)
      return {
        labels,
        datasets: [
          {
            label: '今年',
            data: props.currentValues,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            fill: true,
            borderWidth: 2,
            pointRadius: 1,
            tension: 0.25,
          },
          {
            label: '去年',
            data: props.lastyearValues,
            borderColor: 'rgba(148, 163, 184, 0.7)',
            borderWidth: 2,
            pointRadius: 0,
            borderDash: [4, 4],
            tension: 0.25,
          },
        ],
      }
    })

    const formatByUnit = (value, unit) => {
      if (!Number.isFinite(Number(value))) return '--'
      const n = Number(value)
      if (unit === '%') return `${n.toFixed(2)}%`
      return `${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}${unit || ''}`
    }

    const options = computed(() => ({
      layout: {
        padding: {
          left: 8,
          right: 8,
          top: 8,
          bottom: 4,
        },
      },
      scales: {
        y: {
          display: true,
          beginAtZero: false,
          grid: {
            color: darkMode.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
          ticks: {
            maxTicksLimit: 5,
            color: darkMode.value ? '#94a3b8' : '#6b7280',
            font: { size: 11 },
            callback: (value) => {
              const unit = props.unit
              if (!unit) return Number(value)
              if (unit === '%') return `${Number(value).toFixed(1)}%`
              return `${Number(value).toFixed(0)}${unit}`
            },
          },
        },
        x: {
          type: 'category',
          grid: {
            display: false,
          },
          ticks: {
            color: darkMode.value ? '#94a3b8' : '#6b7280',
            font: { size: 11 },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (items) => (items?.[0]?.label ? `${items[0].label}` : ''),
            label: (ctx) => `${ctx.dataset.label}: ${formatByUnit(ctx.parsed.y, props.unit)}`,
          },
          backgroundColor: darkMode.value ? '#0f172a' : '#111827',
          borderColor: darkMode.value ? '#334155' : '#1f2937',
          borderWidth: 1,
          bodyColor: '#f8fafc',
          titleColor: '#e2e8f0',
        },
      },
      interaction: {
        intersect: false,
        mode: 'nearest',
      },
      maintainAspectRatio: false,
      resizeDelay: 200,
    }))

    const renderChart = () => {
      if (!canvas.value || !chartData.value) return
      if (chart) {
        chart.destroy()
        chart = null
      }
      chart = new Chart(canvas.value, {
        type: 'line',
        data: chartData.value,
        options: options.value,
      })
    }

    onMounted(() => {
      renderChart()
    })

    onUnmounted(() => {
      if (chart) chart.destroy()
    })

    watch(
      () => [chartData.value, options.value, darkMode.value],
      () => {
        renderChart()
      },
      { deep: true },
    )

    return {
      canvas,
    }
  },
}
</script>
