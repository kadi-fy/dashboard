<template>
  <div class="chart-wrap">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
)

const props = defineProps({
  dataConfig: { type: Object, required: true },
  chartConfig: { type: Object, required: true },
  allowMissingData: { type: Boolean, default: true },
})

const canvasRef = ref(null)
let chart = null

const destroyChart = () => {
  if (chart) {
    chart.destroy()
    chart = null
  }
}

const labels = computed(() => props.dataConfig.months || [])

const actualValues = computed(() => {
  const fn = props.dataConfig.getActualValue
  if (typeof fn !== 'function') return []
  return Array.from({ length: 12 }, (_, idx) => fn(idx + 1))
})

const lastYearValues = computed(() => {
  const fn = props.dataConfig.getLastYearValue
  if (typeof fn !== 'function') return []
  return Array.from({ length: 12 }, (_, idx) => fn(idx + 1))
})

const targetValues = computed(() => {
  if (!props.chartConfig.showTarget) return []
  const annual = Number(props.dataConfig.annualPlan) || 0
  if (!annual) return []
  const monthly = annual / 12
  return Array.from({ length: 12 }, (_, idx) => Number((monthly * (idx + 1)).toFixed(0)))
})

const normalized = (values) => {
  if (props.allowMissingData) {
    return values.map((v) => (v == null ? null : Number(v)))
  }
  return values.map((v) => Number(v || 0))
}

const completionColors = (completion, month) => {
  const expected = month / 12

  if (completion >= expected) {
    return ['rgba(76, 175, 80, 0.8)', 'rgba(230, 255, 235, 1.0)']
  }
  if (completion >= expected * 0.8) {
    return ['rgba(255, 193, 7, 0.8)', 'rgba(255, 250, 200, 1.0)']
  }
  return ['rgba(244, 67, 54, 0.8)', 'rgba(255, 210, 210, 1.0)']
}

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '-'
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(numeric)
}

const barAnnotationPlugin = {
  id: 'barAnnotationPlugin',
  afterDatasetsDraw(chartInstance) {
    if (!props.chartConfig.showBarAnnotations) return

    const actualDatasetIndex = chartInstance.data.datasets.findIndex(
      (dataset) => dataset.type === 'bar' && dataset.label === (props.chartConfig.actualLabel || '实际完成'),
    )
    if (actualDatasetIndex < 0) return

    const lastYearDatasetIndex = chartInstance.data.datasets.findIndex(
      (dataset) => dataset.type === 'bar' && dataset.label === (props.chartConfig.lastYearLabel || '上一年同期完成'),
    )

    const actualMeta = chartInstance.getDatasetMeta(actualDatasetIndex)
    const actualData = chartInstance.data.datasets[actualDatasetIndex].data || []
    const lastYearMeta = lastYearDatasetIndex >= 0 ? chartInstance.getDatasetMeta(lastYearDatasetIndex) : null
    const lastYearData = lastYearDatasetIndex >= 0 ? (chartInstance.data.datasets[lastYearDatasetIndex].data || []) : []

    const { ctx } = chartInstance
    ctx.save()

    actualMeta.data.forEach((barElement, index) => {
      const currentValue = actualData[index]
      if (currentValue == null || !Number.isFinite(Number(currentValue))) return

      const centerX = barElement.x
      const centerY = barElement.y + (barElement.base - barElement.y) / 2

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(formatNumber(currentValue), centerX, centerY)
      ctx.font = '11px sans-serif'
      ctx.fillText(props.chartConfig.valueUnit || '万元', centerX, centerY + 13)

      const lastBarElement = lastYearMeta?.data?.[index]
      const lastValue = lastYearData[index]
      if (lastBarElement && lastValue != null && Number.isFinite(Number(lastValue))) {
        const lastCenterX = lastBarElement.x
        const lastCenterY = lastBarElement.y + (lastBarElement.base - lastBarElement.y) / 2
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px sans-serif'
        ctx.fillText(formatNumber(lastValue), lastCenterX, lastCenterY)
        ctx.font = '11px sans-serif'
        ctx.fillText(props.chartConfig.valueUnit || '万元', lastCenterX, lastCenterY + 13)
      }

      if (!props.chartConfig.showYoYGrowth) return

      if (lastValue == null || Number(lastValue) === 0 || !Number.isFinite(Number(lastValue))) return

      const growth = ((Number(currentValue) - Number(lastValue)) / Math.abs(Number(lastValue))) * 100
      const isUp = growth >= 0
      ctx.font = 'bold 12px sans-serif'
      ctx.fillStyle = isUp ? '#ef4444' : '#10b981'
      ctx.fillText(`${isUp ? '↑' : '↓'}${Math.abs(growth).toFixed(1)}%`, centerX, barElement.y - 12)
    })

    ctx.restore()
  },
}

const buildDatasets = () => {
  const ds = []

  if (props.chartConfig.showTarget) {
    ds.push({
      type: 'line',
      label: props.chartConfig.targetLabel || '年度目标',
      data: normalized(targetValues.value),
      borderColor: '#eab308',
      pointRadius: 2,
      borderWidth: 2,
      tension: 0.2,
    })
  }

  ds.push({
    type: 'bar',
    label: props.chartConfig.actualLabel || '实际完成',
    data: normalized(actualValues.value),
    backgroundColor: props.chartConfig.useDepartmentBarStyle
      ? (context) => {
          if (!context?.chart) return 'rgba(34, 197, 94, 0.45)'
          const y = Number(context.parsed?.y)
          if (!Number.isFinite(y)) return 'rgba(34, 197, 94, 0.45)'

          const annualPlan = Number(props.dataConfig.annualPlan) || 0
          if (!annualPlan) return 'rgba(34, 197, 94, 0.45)'

          const month = (context.dataIndex || 0) + 1
          const completion = y / annualPlan
          const [colorBottom, colorTop] = completionColors(completion, month)

          const gradient = context.chart.ctx.createLinearGradient(0, context.chart.height, 0, 0)
          gradient.addColorStop(0, colorBottom)
          gradient.addColorStop(1, colorTop)
          return gradient
        }
      : 'rgba(34, 197, 94, 0.45)',
    borderColor: 'rgba(34, 197, 94, 0.9)',
  })

  if (props.chartConfig.showLastYear) {
    ds.push({
      type: 'bar',
      label: props.chartConfig.lastYearLabel || '上一年同期完成',
      data: normalized(lastYearValues.value),
      backgroundColor: props.chartConfig.useDepartmentBarStyle ? 'rgba(54, 162, 235, 0.6)' : 'rgba(59, 130, 246, 0.45)',
      borderColor: props.chartConfig.useDepartmentBarStyle ? 'rgba(54, 162, 235, 0.9)' : 'rgba(59, 130, 246, 0.9)',
    })
  }

  return ds
}

const renderChart = () => {
  const canvasEl = canvasRef.value
  if (!canvasEl || !canvasEl.isConnected) {
    destroyChart()
    return
  }
  const ctx = canvasEl.getContext('2d')
  if (!ctx) {
    destroyChart()
    return
  }

  destroyChart()

  chart = new Chart(ctx, {
    data: {
      labels: labels.value,
      datasets: buildDatasets(),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y ?? 0} ${props.chartConfig.valueUnit || '万元'}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: props.chartConfig.title || '金额 (万元)',
          },
        },
      },
    },
    plugins: [barAnnotationPlugin],
  })
}

watch(
  () => [props.dataConfig, props.chartConfig, props.allowMissingData],
  () => renderChart(),
  { deep: true },
)

onMounted(() => renderChart())
onBeforeUnmount(() => destroyChart())
</script>

<style scoped>
.chart-wrap {
  width: 100%;
  height: 520px;
}
</style>
