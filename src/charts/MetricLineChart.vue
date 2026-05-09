<template>
  <canvas ref="canvas" :width="width" :height="height" class="metric-line-enter"></canvas>
</template>

<script>
import { computed, ref, watch, onBeforeUnmount, onMounted } from 'vue'
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
    metricName: {
      type: String,
      default: '指标',
    },
    currentYear: {
      type: Number,
      default: new Date().getFullYear(),
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

    const destroyChart = () => {
      if (chart) {
        chart.destroy()
        chart = null
      }
    }

    const chartData = computed(() => {
      // const len = Math.max(props.currentValues.length, props.lastyearValues.length)
      // if (!len) return null

      const labels = Array.from({ length: 12 }, (_, idx) => `${idx + 1}月`)
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
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#2563eb',
            pointHoverBackgroundColor: '#2563eb',
            pointHoverBorderColor: '#2563eb',
            pointBorderWidth: 0,
            tension: 0.25,
          },
          {
            label: '去年',
            data: props.lastyearValues,
            borderColor: 'rgba(148, 163, 184, 0.7)',
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(148, 163, 184, 0.9)',
            pointBorderColor: 'rgba(148, 163, 184, 0.9)',
            pointHoverBackgroundColor: 'rgba(148, 163, 184, 0.9)',
            pointHoverBorderColor: 'rgba(148, 163, 184, 0.9)',
            pointBorderWidth: 0,
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
      return `${new Intl.NumberFormat('zh-CN', {
        maximumFractionDigits: 2,
        useGrouping: false,
      }).format(n)}${unit || ''}`
    }

    const resolveCurrentYear = () => {
      const parsed = Number.parseInt(String(props.currentYear), 10)
      return Number.isFinite(parsed) ? parsed : new Date().getFullYear()
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
            title: (items) => {
              const monthLabel = items?.[0]?.label || ''
              if (!monthLabel) return props.metricName
              return `${props.metricName}`
            },
            label: (ctx) => {
              const monthLabel = ctx.label || ''
              const currentYear = resolveCurrentYear()
              const year = ctx.datasetIndex === 0 ? currentYear : currentYear - 1
              return `${year}年${monthLabel}: ${formatByUnit(ctx.parsed.y, props.unit)}`
            },
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
        mode: 'index',
      },
      maintainAspectRatio: false,
      resizeDelay: 0,
    }))

    const renderChart = () => {
      if (!chartData.value) {
        destroyChart()
        return
      }
      const canvasEl = canvas.value
      if (!canvasEl || !canvasEl.isConnected) {
        destroyChart()
        return
      }
      // 如果图表实例已存在，原地更新数据，避免销毁重建带来的卡顿
      if (chart) {
        chart.data = chartData.value
        // 避免保留上一次悬停态导致点半径异常放大
        chart.setActiveElements([])
        chart.update('none')
        return
      }
      chart = new Chart(canvasEl, {
        type: 'line',
        data: chartData.value,
        options: {
          ...options.value,
          animation: {
            duration: 550,
            easing: 'easeOutCubic',
          },
        },
      })
    }

    onMounted(() => {
      renderChart()
    })

    onBeforeUnmount(() => destroyChart())

    // 数据变化时原地更新
    watch(
      () => chartData.value,
      () => {
        renderChart()
      },
      { deep: true },
    )

    // 暗色模式或 options 变化时重建（颜色需要同步）
    watch(
      () => [options.value, darkMode.value],
      () => {
        if (!chart || !canvas.value?.isConnected) {
          renderChart()
          return
        }
        chart.options = options.value
        chart.update('none')
      },
    )

    return {
      canvas,
    }
  },
}
</script>

<style scoped>
.metric-line-enter {
  animation: metricFadeUp 0.38s ease-out both;
}
@keyframes metricFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
