<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="relative w-full max-w-[95vw] max-h-[95vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ modalTitle }}</h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[80vh]">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{{ chartTitle }}</h4>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 h-[560px]">
              <canvas ref="chartCanvas" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
)

const props = defineProps({
  modelValue: Boolean,
  metricType: {
    type: String,
    default: 'charge',
  },
  metricName: {
    type: String,
    default: '指标',
  },
  departmentDetail: {
    type: Array,
    default: () => [],
  },
  selectedYear: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const chartCanvas = ref(null)
let chartInstance = null

const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

const close = () => emit('update:modelValue', false)

const currentYearData = computed(() =>
  props.departmentDetail.filter((item) => Math.floor(item.time_id / 100) === props.selectedYear)
)

const lastYearData = computed(() =>
  props.departmentDetail.filter((item) => Math.floor(item.time_id / 100) === props.selectedYear - 1)
)

const months = computed(() => Array.from({ length: 12 }, (_, i) => `${i + 1}月`))

const departmentName = computed(() => props.departmentDetail[0]?.org_name || '部门详情')

const modalTitle = computed(() => `${departmentName.value} - ${props.metricName}`)

const chartTitle = computed(() => {
  if (props.metricType === 'cost') return '月度部门成本趋势（万元）'
  if (props.metricType === 'profit') return '月度部门利润趋势（万元）'
  if (props.metricType === 'contract') return '月度净合同趋势（万元）'
  return '月度净收费趋势（万元）'
})

const mapByMonth = (rows, field) => {
  const m = new Map(rows.map((item) => [item.time_id % 100, toNum(item[field])]))
  return months.value.map((month) => {
    const num = parseInt(month, 10)
    return m.has(num) ? m.get(num) : null
  })
}

const completionColor = (completion, month) => {
  const expected = month / 12
  if (completion >= expected) return ['rgba(76, 175, 80, 0.8)', 'rgba(230, 255, 235, 1.0)']
  if (completion >= expected * 0.8) return ['rgba(255, 193, 7, 0.8)', 'rgba(255, 250, 200, 1.0)']
  return ['rgba(244, 67, 54, 0.8)', 'rgba(255, 210, 210, 1.0)']
}

const chargeContractLabelPlugin = {
  id: 'chargeContractLabelPlugin',
  afterDatasetsDraw(chart) {
    const actualIdx = chart.data.datasets.findIndex((d) => d.label === '实际完成')
    const lastIdx = chart.data.datasets.findIndex((d) => d.label === '上一年同期')
    if (actualIdx < 0 || lastIdx < 0) return

    const actualDs = chart.data.datasets[actualIdx]
    const lastDs = chart.data.datasets[lastIdx]
    const actualMeta = chart.getDatasetMeta(actualIdx)
    const lastMeta = chart.getDatasetMeta(lastIdx)
    const { ctx } = chart

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    actualMeta.data.forEach((bar, index) => {
      const actualVal = toNum(actualDs.data[index])
      const lastVal = toNum(lastDs.data[index])
      const completion = actualDs.completionRates?.[index]
      const yoy = actualDs.yoyRates?.[index]

      // 实际完成柱中金额
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(`${Math.round(actualVal)}`, bar.x, bar.y + bar.height / 2 - 5)
      ctx.fillText('万元', bar.x, bar.y + bar.height / 2 + 9)

      // 上一年同期柱中金额
      const lastBar = lastMeta.data[index]
      if (lastBar) {
        ctx.fillText(`${Math.round(lastVal)}`, lastBar.x, lastBar.y + lastBar.height / 2 - 5)
        ctx.fillText('万元', lastBar.x, lastBar.y + lastBar.height / 2 + 9)
      }

      // 柱顶：完成率
      if (Number.isFinite(completion)) {
        const completionText = `${completion.toFixed(0)}%`
        ctx.fillStyle = '#1f2937'
        ctx.font = 'bold 12px sans-serif'
        ctx.fillText(completionText, bar.x, bar.y - 6)
      }

      // 完成率上方：同比变化
      if (Number.isFinite(yoy)) {
        const positive = yoy >= 0
        const symbol = positive ? '↑' : '↓'
        ctx.fillStyle = positive ? '#ef4444' : '#16a34a'
        ctx.font = 'bold 12px sans-serif'
        ctx.fillText(`${symbol}${Math.abs(yoy).toFixed(1)}%`, bar.x, bar.y - 22)
      }
    })

    ctx.restore()
  },
}

const costValueLabelPlugin = {
  id: 'costValueLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#ffffff'

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)
      meta.data.forEach((bar, i) => {
        const value = toNum(dataset.data[i])
        if (value <= 0) return
        ctx.fillText(`${Math.round(value)}`, bar.x, bar.y + bar.height / 2 - 5)
        ctx.fillText('万元', bar.x, bar.y + bar.height / 2 + 9)
      })
    })

    ctx.restore()
  },
}

const profitValueLabelPlugin = {
  id: 'profitValueLabelPlugin',
  afterDatasetsDraw(chart) {
    const dsIndex = chart.data.datasets.findIndex((d) => d.label === '利润')
    if (dsIndex < 0) return

    const meta = chart.getDatasetMeta(dsIndex)
    const ds = chart.data.datasets[dsIndex]
    const { ctx } = chart

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 12px sans-serif'

    meta.data.forEach((bar, i) => {
      const value = toNum(ds.data[i])
      const y = value >= 0 ? bar.y - 10 : bar.y + 12
      ctx.fillStyle = value >= 0 ? '#16a34a' : '#ef4444'
      ctx.fillText(`${Math.round(value)}万元`, bar.x, y)
    })

    ctx.restore()
  },
}

const buildChartConfig = () => {
  const currentRows = currentYearData.value
  const lastRows = lastYearData.value

  if (!currentRows.length) return null

  if (props.metricType === 'cost') {
    const direct = mapByMonth(currentRows, 'direct_cost_adjusted')
    const shared = mapByMonth(currentRows, 'allocated_cost')

    return {
      type: 'bar',
      data: {
        labels: months.value,
        datasets: [
          {
            label: '直接成本',
            data: direct,
            stack: 'cost',
            backgroundColor: 'rgba(54, 162, 235, 0.65)',
          },
          {
            label: '共摊成本',
            data: shared,
            stack: 'cost',
            backgroundColor: 'rgba(245, 176, 65, 0.65)',
          },
        ],
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '金额 (万元)' } },
          x: { grid: { display: false } },
        },
      },
      plugins: [costValueLabelPlugin],
    }
  }

  if (props.metricType === 'profit') {
    const profits = mapByMonth(currentRows, 'department_profit')

    return {
      type: 'bar',
      data: {
        labels: months.value,
        datasets: [
          {
            label: '利润',
            data: profits,
            backgroundColor: (context) => {
              const value = toNum(context.parsed?.y)
              return value >= 0 ? 'rgba(76, 175, 80, 0.75)' : 'rgba(244, 67, 54, 0.75)'
            },
          },
        ],
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '金额 (万元)' } },
          x: { grid: { display: false } },
        },
      },
      plugins: [profitValueLabelPlugin],
    }
  }

  const isContract = props.metricType === 'contract'
  const valueField = isContract ? 'net_contract' : 'net_charge'
  const planField = isContract ? 'annual_plan_contract' : 'annual_plan_charge'

  const values = mapByMonth(currentRows, valueField)
  const lastValues = mapByMonth(lastRows, valueField)

  const plan = toNum(currentRows[0]?.[planField])
  const monthlyTarget = plan > 0 ? months.value.map((_, i) => (plan / 12) * (i + 1)) : []
  const completionRates = values.map((v) => (plan > 0 ? (toNum(v) / plan) * 100 : 0))
  const yoyRates = values.map((v, i) => {
    const prev = toNum(lastValues[i])
    if (prev === 0) return null
    return ((toNum(v) - prev) / prev) * 100
  })

  return {
    type: 'bar',
    data: {
      labels: months.value,
      datasets: [
        {
          type: 'line',
          label: '年度目标',
          data: monthlyTarget,
          borderColor: 'rgba(212, 175, 55, 1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
        },
        {
          type: 'bar',
          label: '实际完成',
          data: values,
          completionRates,
          yoyRates,
          backgroundColor: (context) => {
            if (!context.chart) return 'rgba(0,0,0,0.4)'
            const value = toNum(context.parsed?.y)
            const c = plan > 0 ? value / plan : 0
            const [bottom, top] = completionColor(c, context.dataIndex + 1)
            const gradient = context.chart.ctx.createLinearGradient(0, context.chart.height, 0, 0)
            gradient.addColorStop(0, bottom)
            gradient.addColorStop(1, top)
            return gradient
          },
        },
        {
          type: 'bar',
          label: '上一年同期',
          data: lastValues,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    },
    options: {
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '金额 (万元)' } },
        x: { grid: { display: false } },
      },
    },
    plugins: [chargeContractLabelPlugin],
  }
}

const initChart = () => {
  if (!chartCanvas.value) return
  const cfg = buildChartConfig()
  if (!cfg) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: cfg.type,
    data: cfg.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label || ''}: ${toNum(context.parsed?.y)} 万元`,
          },
        },
      },
      ...cfg.options,
    },
    plugins: cfg.plugins || [],
  })
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick()
      initChart()
      return
    }

    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
  },
)

watch(
  () => [props.metricType, props.metricName, props.departmentDetail, props.selectedYear],
  async () => {
    if (!props.modelValue) return
    await nextTick()
    initChart()
  },
  { deep: true },
)

onUnmounted(() => {
  if (chartInstance) chartInstance.destroy()
})
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.3s ease-out;
}

.modal-leave-active {
  transition: all 0.3s ease-in;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
