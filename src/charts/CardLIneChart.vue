<template>
  <canvas ref="canvas" class="w-full h-full" :width="width" :height="height"></canvas>
</template>

<script>
import { computed, ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useDark } from '@vueuse/core'
import { getChartColors } from './ChartjsConfig'

import {
  Chart, LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend,
} from 'chart.js'
import 'chartjs-adapter-moment'

Chart.register(LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend)

export default {
  name: 'CardLIneChart',
  props: {
    data: {
      type: Object,
      default: null,
    },
    currentValues: {
      type: Array,
      default: () => [],
    },
    lastyearValues: {
      type: Array,
      default: () => [],
    },
    targetValues: {
      type: Array,
      default: () => [],
    },
    width: {
      type: [Number, String],
      default: null,
    },
    height: {
      type: [Number, String],
      default: null,
    },
    layoutPadding: {
      type: Number,
      default: 20,
    },
  },
  setup(props) {

    const formatChineseAmount = (value) => {
      const numericValue = Number(value) || 0
      return `${new Intl.NumberFormat('zh-CN', { useGrouping: false }).format(numericValue)}万元`
    }

    const formatTooltipMonth = (items) => {
      const firstItem = items?.[0]
      if (!firstItem) return false

      if (firstItem.label) return String(firstItem.label)

      if (typeof firstItem.dataIndex === 'number') {
        return `${firstItem.dataIndex + 1}月`
      }

      const rawX = firstItem.raw?.x
      if (typeof rawX === 'string') {
        const match = rawX.match(/^(\d{2})-(\d{2})-(\d{4})$/)
        if (match) return `${Number(match[1])}月`
      }

      const parsedX = firstItem.parsed?.x
      if (Number.isFinite(parsedX)) {
        const date = new Date(parsedX)
        if (!Number.isNaN(date.getTime())) return `${date.getMonth() + 1}月`
      }

      return false
    }

    const canvas = ref(null)
    let chart = null
        const destroyChart = () => {
          if (chart) {
            chart.destroy()
            chart = null
          }
        }

    const darkMode = useDark()
  const { tooltipTitleColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = getChartColors()

    const dataFromSeries = computed(() => {
      const len = Math.max(
        props.currentValues.length,
        props.lastyearValues.length,
        props.targetValues.length,
      )
      if (!len) return null

      const labels = Array.from({ length: len }, (_, idx) => `${idx + 1}月`)
      const datasets = []

      if (props.targetValues.length) {
        datasets.push({
          label: '目标',
          data: props.targetValues,
          borderColor: '#eab308',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#eab308',
          pointBorderColor: '#eab308',
          pointHoverBackgroundColor: '#eab308',
          pointHoverBorderColor: '#eab308',
          pointBorderWidth: 0,
          pointStyle: 'circle',
          tension: 0.25,
        })
      }

      if (props.currentValues.length) {
        datasets.push({
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
          pointStyle: 'circle',
          tension: 0.25,
        })
      }

      if (props.lastyearValues.length) {
        datasets.push({
          label: '去年',
          data: props.lastyearValues,
          borderColor: 'rgba(148, 163, 184, 0.5)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(148, 163, 184, 0.9)',
          pointBorderColor: 'rgba(148, 163, 184, 0.9)',
          pointHoverBackgroundColor: 'rgba(148, 163, 184, 0.9)',
          pointHoverBorderColor: 'rgba(148, 163, 184, 0.9)',
          pointBorderWidth: 0,
          pointStyle: 'circle',
          borderDash: [3, 3],
          tension: 0.25,
        })
      }

      return {
        labels,
        datasets,
      }
    })

    const chartData = computed(() => props.data || dataFromSeries.value)

    const isLegacyDataMode = computed(() => !!props.data)

    const buildOptions = () => ({
      layout: {
        padding: props.layoutPadding,
      },
      scales: {
        y: {
          display: false,
          beginAtZero: true,
        },
        x: isLegacyDataMode.value ? {
          type: 'time',
          time: {
            parser: 'MM-DD-YYYY',
            unit: 'month',
          },
          display: false,
          grid: {
            display: false,
          },
        } : {
          type: 'category',
          display: false,
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          displayColors: true,
          callbacks: {
            title: (items) => formatTooltipMonth(items),
            label: (context) => `${context.dataset.label}: ${formatChineseAmount(context.parsed.y)}`,
          },
          titleColor: darkMode.value ? tooltipTitleColor.dark : tooltipTitleColor.light,
          titleFont: {
            size: 12,
            weight: 600,
          },
          titleMarginBottom: 6,
          bodyColor: darkMode.value ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode.value ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode.value ? tooltipBorderColor.dark : tooltipBorderColor.light,
        },
        legend: {
          display: true,
          position: 'top',
          align: 'start',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
        axis: 'x',
      },
      animation: {
        duration: 450,
        easing: 'easeOutCubic',
      },
      maintainAspectRatio: false,
      resizeDelay: 200,
    })

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
        chart.update()
        return
      }

      chart = new Chart(canvasEl, {
        type: 'line',
        data: chartData.value,
        options: buildOptions(),
      })
    }

    onMounted(() => {
      renderChart()
    })

    onBeforeUnmount(() => destroyChart())

    watch(
      () => chartData.value,
      () => {
        renderChart()
      },
      { deep: false },
    )

    watch(
      () => darkMode.value,
      () => {
        if (!chart) return
        if (!canvas.value || !canvas.value.isConnected) {
          destroyChart()
          return
        }
        if (darkMode.value) {
          chart.options.plugins.tooltip.titleColor = tooltipTitleColor.dark
          chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark
          chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark
          chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark
        } else {
          chart.options.plugins.tooltip.titleColor = tooltipTitleColor.light
          chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light
          chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light
          chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light
        }
        chart.update('none')
      },
    )

    return {
      canvas,
    }
  }
}
</script>