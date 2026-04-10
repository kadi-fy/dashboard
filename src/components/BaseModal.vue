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
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ unitName || '指标详情' }}</h3>
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
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{{ modalConfig.title || '月度趋势（万元）' }}</h4>
            <BarChart
              v-if="chartType === 'bar'"
              :data-config="dataConfig"
              :chart-config="chartOptions"
              :allow-missing-data="false"
            />
            <div v-else class="h-[560px] bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
              <CashModalLineChart
                :current-values="currentValues"
                :last-year-values="lastYearValues"
                :target-values="targetValues"
                :show-target="showTarget"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import BarChart from '../charts/BarModel.vue'
import CashModalLineChart from '../charts/CashModalLineChart.vue'

const props = defineProps({
  modelValue: Boolean,
  currentYearData: { type: Array, default: () => [] },
  lastYearData: { type: Array, default: () => [] },
  selectedYear: { type: Number, required: true },
  modalConfig: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

const unitName = computed(() => props.currentYearData[0]?.org_name || '')
const showTarget = computed(() => props.modalConfig.showTarget !== false)

const months = computed(() => Array.from({ length: 12 }, (_, i) => `${i + 1}月`))

const annualPlan = computed(() => {
  if (!showTarget.value) return 0
  const f = props.modalConfig.planField || 'charge_plan'
  return Number(props.currentYearData[0]?.[f]) || 0
})

const currentMap = computed(() => {
  const f = props.modalConfig.dataField || 'charge_total'
  const m = new Map()
  for (const item of props.currentYearData) {
    m.set(item.time_id % 100, Number(item[f] || 0))
  }
  return m
})

const lastMap = computed(() => {
  const f = props.modalConfig.dataField || 'charge_total'
  const m = new Map()
  for (const item of props.lastYearData) {
    m.set(item.time_id % 100, Number(item[f] || 0))
  }
  return m
})

const dataConfig = computed(() => ({
  months: months.value,
  annualPlan: annualPlan.value,
  getActualValue: (month) => currentMap.value.get(month) ?? 0,
  getLastYearValue: (month) => lastMap.value.get(month) ?? 0,
}))

const chartType = computed(() => props.modalConfig.chartType || 'bar')

const currentValues = computed(() =>
  Array.from({ length: 12 }, (_, i) => currentMap.value.get(i + 1) ?? 0),
)

const lastYearValues = computed(() =>
  Array.from({ length: 12 }, (_, i) => lastMap.value.get(i + 1) ?? 0),
)

const targetValues = computed(() =>
  showTarget.value
    ? Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      return Number(((annualPlan.value * month) / 12).toFixed(2))
    })
    : [],
)

const chartOptions = computed(() => ({
  title: '金额 (万元)',
  valueUnit: '万元',
  showTarget: showTarget.value,
  showLastYear: true,
  targetLabel: props.modalConfig.targetLabel || '年度目标',
  actualLabel: props.modalConfig.actualLabel || '实际完成',
  lastYearLabel: props.modalConfig.lastYearLabel || '上一年同期完成',
}))

const close = () => emit('update:modelValue', false)
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.25s ease-out;
}

.modal-leave-active {
  transition: all 0.2s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
