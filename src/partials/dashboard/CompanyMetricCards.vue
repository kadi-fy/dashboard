<template>
  <div class="col-span-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
    <div
      v-for="metric in metrics"
      :key="metric.field"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-md px-4 py-4 flex flex-col gap-2 cursor-pointer hover:shadow-lg transition-shadow"
      @click="openModal(metric)"
    >
      <!-- 标题 + 图标 -->
      <div class="flex items-start justify-between">
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ metric.label }}</span>
        <div
          class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
          :style="{ background: metric.bgGradient }"
        >
          <component :is="metric.icon" class="w-6 h-6 text-white" />
        </div>
      </div>

      <!-- 数值 -->
      <div class="text-2xl font-bold text-gray-900 dark:text-white leading-none">
        {{ formatDisplay(currentData?.[metric.field], metric) }}
      </div>

      <!-- 同比变化 -->
      <div class="flex flex-wrap items-center gap-1 text-xs">
        <span
          v-if="yoyChange(metric.field) !== null"
          :class="isGood(metric) ? 'text-red-500' : 'text-green-500'"
          class="font-semibold"
        >
          {{ yoyChange(metric.field) >= 0 ? '↑' : '↓' }}
          {{ formatYoyChange(metric) }}{{ metric.isPercent ? ' %' : '万元' }}
        </span>
        <span class="text-gray-400 dark:text-gray-500">
          较上年同期:
          {{ prevData?.[metric.field] != null
            ? formatDisplay(prevData[metric.field], metric)
            : '--' }}
        </span>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <!-- 弹框主体 -->
        <div
          class="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl"
          @click.stop
        >
          <!-- 标题栏 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <component :is="activeMetric?.icon" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ activeMetric?.label }}</h3>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ props.selectedYear }}年 1-{{ props.selectedMonth }}月</span>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="closeModal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 图表区域 -->
          <div class="px-6 pt-4 pb-6">
            <!-- 图例 -->
            <div class="flex items-center gap-6 mb-3">
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-8 h-0.5 bg-blue-500 rounded"></span>
                <span class="text-xs text-gray-600 dark:text-gray-300">{{ props.selectedYear }}年</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-8 border-t-2 border-dashed border-gray-400"></span>
                <span class="text-xs text-gray-600 dark:text-gray-300">{{ props.selectedYear - 1 }}年</span>
              </div>
            </div>
            <!-- 折线图 -->
            <div class="h-72 md:h-80">
              <MetricLineChart
                v-if="modalChartReady"
                :current-values="modalCurrentValues"
                :lastyear-values="modalLastYearValues"
                :unit="activeMetric?.unit ?? ''"
                width="100%"
                height="320"
              />
              <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">加载中...</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch, h, nextTick } from 'vue'
import { GLOBAL_CONFIG } from '../../utils/Utils'
import MetricLineChart from '../../charts/MetricLineChart.vue'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL

// ---------- Props ----------
const props = defineProps({
  selectedYear: { type: Number, required: true },
  selectedMonth: { type: Number, required: true },
})

// ---------- 内联 SVG 图标 (函数式组件) ----------
const IconAsset = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }),
])

const IconROE = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' }),
])

const IconLabor = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5' }),
])

const IconResearch = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }),
])

const IconCashRatio = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }),
])

const IconCash = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' }),
])

// ---------- 指标配置 ----------
const metrics = [
  {
    field: 'asset',
    label: '资产负债率',
    isPercent: true,
    unit: '%',
    higherIsBetter: false,
    bgGradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    icon: IconAsset,
  },
  {
    field: 'roe',
    label: '净资产收益率',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    bgGradient: 'linear-gradient(135deg, #16a34a, #22c55e)',
    icon: IconROE,
  },
  {
    field: 'labor',
    label: '全员劳动生产率',
    isPercent: false,
    unit: '万元/人',
    higherIsBetter: true,
    bgGradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    icon: IconLabor,
  },
  {
    field: 'research',
    label: '研发投入强度',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    bgGradient: 'linear-gradient(135deg, #ea580c, #f97316)',
    icon: IconResearch,
  },
  {
    field: 'cash_ratio',
    label: '营业收现率',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    bgGradient: 'linear-gradient(135deg, #9333ea, #c026d3)',
    icon: IconCashRatio,
  },
  {
    field: 'cash',
    label: '经营性净现金流',
    isPercent: false,
    unit: '万元',
    higherIsBetter: true,
    bgGradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    icon: IconCash,
  },
]

// ---------- 数据 ----------
const currentData = ref(null)      // 当月快照（用于卡片显示）
const prevData = ref(null)         // 上年同期快照
const allCurrentYear = ref([])     // 今年全月数据（用于折线图）
const allLastYear = ref([])        // 去年全月数据（用于折线图）

const loadData = async () => {
  try {
    const params = new URLSearchParams({
      year: props.selectedYear,
      month: props.selectedMonth,
    })
    // 使用 /company-lastyear 同时获取今年与去年全部月度数据
    const res = await fetch(`${API_BASE_URL}/company-lastyear?${params}`)
    if (!res.ok) return
    const json = await res.json()
    const allData = json.data ?? []

    const currYear = props.selectedYear
    const prevYear = props.selectedYear - 1

    const curr = allData
      .filter(r => Math.floor(r.time_id / 100) === currYear)
      .sort((a, b) => a.time_id - b.time_id)
    const prev = allData
      .filter(r => Math.floor(r.time_id / 100) === prevYear)
      .sort((a, b) => a.time_id - b.time_id)

    allCurrentYear.value = curr
    allLastYear.value = prev

    // 当月快照（卡片显示）
    const targetTimeId = currYear * 100 + props.selectedMonth
    currentData.value = curr.find(r => r.time_id === targetTimeId)
      ?? (curr.length ? curr[curr.length - 1] : null)

    // 上年同期快照
    const prevTargetId = prevYear * 100 + props.selectedMonth
    prevData.value = prev.find(r => r.time_id === prevTargetId)
      ?? (prev.length ? prev[0] : null)
  } catch (e) {
    console.error('CompanyMetricCards load failed', e)
  }
}

// ---------- Modal ----------
const modalOpen = ref(false)
const activeMetric = ref(null)
const modalChartReady = ref(false)

const modalCurrentValues = computed(() => {
  if (!activeMetric.value) return []
  const field = activeMetric.value.field
  return allCurrentYear.value.map(r => {
    const v = Number(r[field] ?? 0)
    return activeMetric.value.isPercent ? (Math.abs(v) <= 1 ? v * 100 : v) : v
  })
})

const modalLastYearValues = computed(() => {
  if (!activeMetric.value) return []
  const field = activeMetric.value.field
  return allLastYear.value.map(r => {
    const v = Number(r[field] ?? 0)
    return activeMetric.value.isPercent ? (Math.abs(v) <= 1 ? v * 100 : v) : v
  })
})

const openModal = async (metric) => {
  activeMetric.value = metric
  modalChartReady.value = false
  modalOpen.value = true
  await nextTick()
  modalChartReady.value = true
}

const closeModal = () => {
  modalOpen.value = false
  activeMetric.value = null
  modalChartReady.value = false
}

// ---------- 计算 ----------
const yoyChange = (field) => {
  const curr = currentData.value?.[field]
  const prev = prevData.value?.[field]
  if (curr == null || prev == null) return null
  return Number(curr) - Number(prev)
}

// 判断同比变化是否为"好"（红色=好，绿色=差）
const isGood = (metric) => {
  const diff = yoyChange(metric.field)
  if (diff == null) return false
  return metric.higherIsBetter ? diff > 0 : diff < 0
}

const normalizePercentValue = (val) => {
  const n = Number(val)
  if (Number.isNaN(n)) return null
  // API returns ratio values like 0.4838; display as 48.38%
  return Math.abs(n) <= 1 ? n * 100 : n
}

const formatYoyChange = (metric) => {
  const diff = yoyChange(metric.field)
  if (diff == null) return '--'
  const n = metric.isPercent ? normalizePercentValue(diff) : Number(diff)
  if (n == null || Number.isNaN(n)) return '--'
  return Math.abs(n).toFixed(2)
}

const formatDisplay = (val, metric) => {
  if (val == null || val === '') return '--'
  const raw = Number(val)
  const n = metric.isPercent ? normalizePercentValue(raw) : raw
  if (Number.isNaN(n)) return '--'
  if (metric.isPercent) return `${n.toFixed(2)}%`
  if (metric.unit === '万元/人') return `${n.toFixed(1)}万元/人`
  // 万元：整数
  return `${Math.round(n)}万元`
}

// ---------- 生命周期 ----------
onMounted(loadData)
watch([() => props.selectedYear, () => props.selectedMonth], loadData)
</script>
