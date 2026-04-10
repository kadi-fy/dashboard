<template>
  <div class="chart-wrap">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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
    backgroundColor: 'rgba(34, 197, 94, 0.45)',
    borderColor: 'rgba(34, 197, 94, 0.9)',
    borderWidth: 1,
  })

  if (props.chartConfig.showLastYear) {
    ds.push({
      type: 'bar',
      label: props.chartConfig.lastYearLabel || '上一年同期完成',
      data: normalized(lastYearValues.value),
      backgroundColor: 'rgba(59, 130, 246, 0.45)',
      borderColor: 'rgba(59, 130, 246, 0.9)',
      borderWidth: 1,
    })
  }

  return ds
}

const renderChart = () => {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')

  if (chart) {
    chart.destroy()
    chart = null
  }

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
  })
}

watch(
  () => [props.dataConfig, props.chartConfig, props.allowMissingData],
  () => renderChart(),
  { deep: true },
)

onMounted(() => renderChart())
onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<style scoped>
.chart-wrap {
  width: 100%;
  height: 520px;
}
</style>
