<template>
  <div class="col-span-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
    <div
      v-for="metric in metrics"
      :key="metric.field"
      class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-100/90 dark:border-gray-700/80 shadow-md px-4 py-4 flex flex-col gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      @click="openModal(metric)"
    >
      <span class="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-40" :class="metric.cardGlowClass"></span>
      <span class="pointer-events-none absolute inset-0 metric-grid-overlay"></span>

      <div class="relative z-10 flex flex-col gap-2">
      <!-- 标题 + 图标 -->
      <div class="flex items-start justify-between gap-2">
        <span class="text-sm font-semibold leading-5 text-gray-700 dark:text-gray-200">{{ metric.label }}</span>
        <div
          class="relative w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
          :class="metric.iconShellClass"
        >
          <span class="absolute inset-[3px] rounded-[12px] metric-orb-animate" :class="metric.iconOrbClass"></span>
          <span class="absolute top-1 left-1 h-3.5 w-5.5 rounded-full bg-white/35 blur-[1px]"></span>
          <component :is="metric.icon" class="w-6 h-6" :class="metric.iconClass" />
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
              <component :is="activeMetric?.icon" class="w-5 h-5" :class="activeMetric?.modalIconClass || 'text-gray-600 dark:text-gray-300'" />
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
const IconAsset = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 7h16M6 7v10m12-10v10M3 17h18M9.5 11.5h5M12 9v5' }),
])

const IconROE = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 16l5-5 3 3 7-7M16 7h3v3M4 20h16' }),
])

const IconLabor = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 19h16M6 19V9l3 2 3-4 3 3 3-2v11' }),
  h('circle', { cx: '9', cy: '7', r: '1.2' }),
  h('circle', { cx: '15', cy: '6', r: '1.2' }),
])

const IconResearch = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M10 4v5l-4 7a2 2 0 001.7 3h8.6a2 2 0 001.7-3l-4-7V4' }),
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M9 12h6M8.5 15h7' }),
])

const IconCashRatio = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 17V7m6 10V4m6 13v-6m4 6V9' }),
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M3 20h18' }),
])

const IconCash = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, ...attrs }, [
  h('rect', { x: '3', y: '6', width: '18', height: '12', rx: '2.5' }),
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M7 12h10M9 9.5h6M9 14.5h6' }),
])

// ---------- 指标配置 ----------
const metrics = [
  {
    field: 'asset',
    label: '资产负债率',
    isPercent: true,
    unit: '%',
    higherIsBetter: false,
    cardGlowClass: 'bg-violet-400/60 dark:bg-violet-500/40',
    iconShellClass: 'border-violet-200/80 dark:border-violet-700/60 bg-violet-50/60 dark:bg-violet-900/20',
    iconOrbClass: 'bg-gradient-to-br from-violet-500 to-indigo-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-violet-600 dark:text-violet-300',
    icon: IconAsset,
  },
  {
    field: 'roe',
    label: '净资产收益率',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    cardGlowClass: 'bg-emerald-400/60 dark:bg-emerald-500/40',
    iconShellClass: 'border-emerald-200/80 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-900/20',
    iconOrbClass: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-emerald-600 dark:text-emerald-300',
    icon: IconROE,
  },
  {
    field: 'labor',
    label: '全员劳动生产率',
    isPercent: false,
    unit: '万元/人',
    higherIsBetter: true,
    cardGlowClass: 'bg-blue-400/60 dark:bg-blue-500/40',
    iconShellClass: 'border-blue-200/80 dark:border-blue-700/60 bg-blue-50/60 dark:bg-blue-900/20',
    iconOrbClass: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-blue-600 dark:text-blue-300',
    icon: IconLabor,
  },
  {
    field: 'research',
    label: '研发投入强度',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    cardGlowClass: 'bg-orange-400/60 dark:bg-orange-500/40',
    iconShellClass: 'border-orange-200/80 dark:border-orange-700/60 bg-orange-50/60 dark:bg-orange-900/20',
    iconOrbClass: 'bg-gradient-to-br from-orange-500 to-amber-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-orange-600 dark:text-orange-300',
    icon: IconResearch,
  },
  {
    field: 'cash_ratio',
    label: '营业收现率',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    cardGlowClass: 'bg-fuchsia-400/60 dark:bg-fuchsia-500/40',
    iconShellClass: 'border-fuchsia-200/80 dark:border-fuchsia-700/60 bg-fuchsia-50/60 dark:bg-fuchsia-900/20',
    iconOrbClass: 'bg-gradient-to-br from-fuchsia-500 to-purple-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-fuchsia-600 dark:text-fuchsia-300',
    icon: IconCashRatio,
  },
  {
    field: 'cash',
    label: '经营性净现金流',
    isPercent: false,
    unit: '万元',
    higherIsBetter: true,
    cardGlowClass: 'bg-cyan-400/60 dark:bg-cyan-500/40',
    iconShellClass: 'border-cyan-200/80 dark:border-cyan-700/60 bg-cyan-50/60 dark:bg-cyan-900/20',
    iconOrbClass: 'bg-gradient-to-br from-cyan-500 to-sky-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-cyan-600 dark:text-cyan-300',
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

<style scoped>
.metric-grid-overlay {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 14px 14px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent 70%);
}

.metric-orb-animate {
  animation: orbPulse 3.2s ease-in-out infinite;
}

@keyframes orbPulse {
  0%,
  100% {
    transform: scale(1);
    filter: saturate(1);
  }
  50% {
    transform: scale(1.05);
    filter: saturate(1.15);
  }
}
</style>
