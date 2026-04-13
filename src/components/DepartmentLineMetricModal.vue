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
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
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
  modelValue: Boolean,
  metricName: { type: String, default: '指标' },
  metricKey: { type: String, default: 'charge_per' },
  unitLabel: { type: String, default: '' },
  detailRows: { type: Array, default: () => [] },
  selectedYear: { type: Number, required: true },
})

const emit = defineEmits(['update:modelValue'])

const chartCanvas = ref(null)
let chartInstance = null

const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
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

const close = () => emit('update:modelValue', false)

const currentRows = computed(() => {
  const rows = Array.isArray(props.detailRows) ? props.detailRows : []
  return rows
    .filter((item) => Math.floor(item.time_id / 100) === props.selectedYear)
    .sort((a, b) => (a.time_id || 0) - (b.time_id || 0))
})

const modalTitle = computed(() => {
  const name = currentRows.value[0]?.org_name || '部门详情'
  return `${name} - ${props.metricName}`
})

const chartTitle = computed(() => `月度${props.metricName}趋势`)

const initChart = () => {
  const canvasEl = chartCanvas.value
  if (!canvasEl || !canvasEl.isConnected || !currentRows.value.length) {
    destroyChart()
    return
  }

  const labels = currentRows.value.map((row) => `${row.time_id % 100}月`)
  const values = currentRows.value.map((row) => toNum(row[props.metricKey]))
  const isChargeContractPer = props.metricKey === 'charge_contract_per'
  const chargePerValues = currentRows.value.map((row) => toNum(row.charge_per))
  const contractPerValues = currentRows.value.map((row) => toNum(row.contract_per))

  const ctx = canvasEl.getContext('2d')
  if (!ctx) {
    destroyChart()
    return
  }

  destroyChart()

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        ...(isChargeContractPer
          ? [
              {
                label: '人均收费',
                data: chargePerValues,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0,
              },
              {
                label: '人均合同',
                data: contractPerValues,
                borderColor: '#14b8a6',
                backgroundColor: 'rgba(20, 184, 166, 0.08)',
                fill: false,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0,
              },
            ]
          : [
              {
                label: props.metricName,
                data: values,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0,
              },
            ]),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatMetricValue(context.parsed.y)}`,
          },
        },
      },
      scales: {
        y: { beginAtZero: true },
        x: { grid: { display: false } },
      },
    },
  })
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick()
      if (chartCanvas.value && chartCanvas.value.isConnected) {
        initChart()
      } else {
        destroyChart()
      }
      return
    }

    destroyChart()
  },
)

watch(
  () => [props.metricName, props.metricKey, props.detailRows, props.selectedYear],
  async () => {
    if (!props.modelValue) return
    await nextTick()
    if (chartCanvas.value && chartCanvas.value.isConnected) {
      initChart()
    } else {
      destroyChart()
    }
  },
  { deep: true },
)

onBeforeUnmount(() => destroyChart())
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
