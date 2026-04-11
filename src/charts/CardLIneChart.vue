<template>
  <canvas ref="canvas" class="w-full h-full" :width="width" :height="height"></canvas>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
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
      return `${numericValue.toLocaleString('zh-CN')}万元`
    }

    const canvas = ref(null)
    let chart = null
    const darkMode = useDark()
    const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = getChartColors()

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
          pointRadius: 0,
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
          pointRadius: 1,
          tension: 0.25,
        })
      }

      if (props.lastyearValues.length) {
        datasets.push({
          label: '去年',
          data: props.lastyearValues,
          borderColor: 'rgba(148, 163, 184, 0.5)',
          borderWidth: 2,
          pointRadius: 0,
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
            title: (items) => items[0]?.label || false,
            label: (context) => `${context.dataset.label}: ${formatChineseAmount(context.parsed.y)}`,
          },
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
      maintainAspectRatio: false,
      resizeDelay: 200,
    })

    const renderChart = () => {
      if (!canvas.value || !chartData.value) return

      if (chart) {
        chart.destroy()
        chart = null
      }

      chart = new Chart(canvas.value, {
        type: 'line',
        data: chartData.value,
        options: buildOptions(),
      })
    }

    onMounted(() => {
      renderChart()
    })

    onUnmounted(() => {
      if (chart) chart.destroy()
    })

    watch(
      () => chartData.value,
      () => {
        renderChart()
      },
      { deep: true },
    )

    watch(
      () => darkMode.value,
      () => {
        if (!chart) return
        if (darkMode.value) {
          chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark
          chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark
          chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark
        } else {
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