<template>
  <div class="dynamic-chart">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
)

const props = defineProps({
  chartConfig: { type: Object, default: () => null },
})

const canvasRef = ref(null)
let chart = null

const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6']

const normalize = (cfg) => {
  if (!cfg) return null

  const labels = cfg.labels || []
  const series = Array.isArray(cfg.series) ? cfg.series : []
  const type = cfg.type || 'bar'

  if (series.length === 0 && Array.isArray(cfg.data)) {
    return {
      type,
      labels,
      datasets: [
        {
          label: cfg.metric || '数值',
          data: cfg.data,
          backgroundColor: palette[0],
          borderColor: palette[0],
        },
      ],
    }
  }

  return {
    type,
    labels,
    datasets: series.map((s, i) => ({
      label: s.name || `系列${i + 1}`,
      data: s.data || [],
      backgroundColor: type === 'line' ? 'transparent' : palette[i % palette.length],
      borderColor: palette[i % palette.length],
      borderWidth: 2,
      tension: 0.25,
      fill: false,
    })),
  }
}

const renderChart = () => {
  if (!canvasRef.value || !props.chartConfig) return
  const data = normalize(props.chartConfig)
  if (!data) return

  const type = data.type === 'area' ? 'line' : data.type

  if (chart) {
    chart.destroy()
    chart = null
  }

  chart = new Chart(canvasRef.value.getContext('2d'), {
    type,
    data: {
      labels: data.labels,
      datasets: data.datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: data.datasets.length > 1 },
      },
    },
  })
}

watch(() => props.chartConfig, () => renderChart(), { deep: true })
onMounted(() => renderChart())
onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<style scoped>
.dynamic-chart {
  width: 100%;
  height: 260px;
}
</style>
