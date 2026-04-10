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
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              公司利润总额
            </h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto max-h-[80vh]">
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">月度利润总额趋势（万元）</h4>
              <BarChart
                :data-config="dataConfig"
                :chart-config="chartConfig"
                :allow-missing-data="false"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import BarChart from '../charts/BarModel.vue'

// Props & Emits
const props = defineProps({
  modelValue: Boolean,
  companyDetail: {
    type: Array,
    default: () => []
  },
  selectedYear: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// === 计算数据 ===
const currentYearData = computed(() =>
  props.companyDetail.filter(item => Math.floor(item.time_id / 100) === props.selectedYear)
)

const lastYearData = computed(() =>
  props.companyDetail.filter(item => Math.floor(item.time_id / 100) === props.selectedYear - 1)
)

const months = computed(() => {
  return Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
})

const annualPlan = computed(() =>
  currentYearData.value.length > 0 ? currentYearData.value[0].annual_plan_internal_profit : 0
)

// 创建数据映射
const currentYearMap = computed(() => {
  const map = new Map()
  currentYearData.value.forEach(item => {
    map.set(item.time_id % 100, item.profit_total)
  })
  return map
})

const lastYearMap = computed(() => {
  const map = new Map()
  lastYearData.value.forEach(item => {
    map.set(item.time_id % 100, item.profit_total)
  })
  return map
})

// 配置数据源
const dataConfig = computed(() => ({
  currentYearData: props.companyDetail,
  selectedYear: props.selectedYear,
  months: months.value,
  annualPlan: annualPlan.value,
  getActualValue: (month) => currentYearMap.value.get(month) || 0,
  getLastYearValue: (month) => lastYearMap.value.get(month) || 0
}))

// 图表配置
const chartConfig = {
  title: '金额 (万元)',
  valueUnit: '万元',
  showTarget: true,
  showLastYear: true,
  targetLabel: '年度目标(利润总额)',
  actualLabel: '实际完成(利润总额)',
  lastYearLabel: '上一年同期完成(利润总额)'
}

// === 工具函数 ===
const close = () => {
  emit('update:modelValue', false)
}
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