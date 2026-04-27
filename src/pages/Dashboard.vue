<template>
  <div class="flex h-screen overflow-hidden">

    <transition name="boot-fade">
      <div v-if="bootLoading" class="fixed inset-0 z-[120] overflow-hidden" :class="{ 'boot-performance': performanceFirstMode }">
        <div class="absolute inset-0 boot-bg"></div>
        <div class="absolute inset-0 boot-grid"></div>
        <div v-if="!performanceFirstMode" class="absolute inset-0 boot-noise opacity-30"></div>
        <div v-if="!performanceFirstMode" class="absolute inset-0 boot-circuit"></div>
        <div v-if="!performanceFirstMode" class="absolute -left-24 top-1/4 h-64 w-64 rounded-full boot-orb boot-orb-cyan"></div>
        <div v-if="!performanceFirstMode" class="absolute -right-16 top-16 h-56 w-56 rounded-full boot-orb boot-orb-emerald"></div>
        <div v-if="!performanceFirstMode" class="absolute left-1/2 bottom-[-5.5rem] h-72 w-72 -translate-x-1/2 rounded-full boot-orb boot-orb-sky"></div>
        <div class="relative h-full w-full flex items-center justify-center p-6">
          <div class="boot-shell relative w-full max-w-lg">
            <div v-if="!performanceFirstMode" class="boot-halo absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
            <div v-if="!performanceFirstMode" class="boot-ring absolute inset-[-36px] rounded-[2rem]"></div>
            <div v-if="!performanceFirstMode" class="boot-ring boot-ring-delay absolute inset-[-56px] rounded-[2.3rem]"></div>
            <div class="relative rounded-3xl border border-white/30 bg-white/72 dark:bg-slate-900/72 backdrop-blur-xl shadow-[0_30px_70px_rgba(15,23,42,0.35)] px-7 py-8 sm:px-8 sm:py-9 overflow-hidden">
              <div class="boot-scanline absolute inset-x-0 top-0 h-20"></div>
              <div class="boot-corner boot-corner-tl"></div>
              <div class="boot-corner boot-corner-tr"></div>
              <div class="boot-corner boot-corner-bl"></div>
              <div class="boot-corner boot-corner-br"></div>

              <div class="relative z-10 mb-4">
                <div>
                  <div class="text-[11px] tracking-[0.22em] font-semibold text-slate-500 dark:text-slate-300 mb-2">电力规划设计总院</div>
                  <div class="boot-title text-2xl sm:text-[1.72rem] font-bold text-slate-800 dark:text-slate-100 mb-2">正在初始化经营看板</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">{{ bootStatusText }}</div>
                </div>
              </div>

              <div class="relative h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden">
                <div class="absolute inset-y-0 left-0 rounded-full boot-progress" :style="{ width: `${bootProgress}%` }"></div>
              </div>

              <div class="mt-3 flex items-center justify-between text-sm">
                <span class="text-slate-500 dark:text-slate-400">加载进度</span>
                <span class="font-semibold text-slate-700 dark:text-slate-200">{{ bootProgress }}%</span>
              </div>

              <div class="relative z-10 mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div
                  v-for="(stage, idx) in bootStages"
                  :key="stage"
                  class="rounded-xl border px-2.5 py-2 text-center text-[11px] tracking-[0.08em] transition-all duration-300"
                  :class="idx <= bootStageIndex
                    ? 'border-sky-300/70 bg-sky-100/70 dark:border-sky-300/45 dark:bg-sky-500/15 text-sky-800 dark:text-sky-200 shadow-[0_8px_20px_rgba(14,165,233,0.18)]'
                    : 'border-slate-200/70 bg-white/60 dark:border-slate-700/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'"
                >
                  {{ stage }}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </transition>

    <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      <Header :sidebarOpen="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="grow">
        <div class="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-9xl mx-auto">

          <!-- 顶部标题行 -->
          <div class="mb-3 flex items-center justify-between">
            <SectionDividerTitle
              title="公司整体经营指标"
              subtitle="COMPANY OVERVIEW"
              tone="blue"
            />
            <div class="flex items-center gap-2">
                <Datepicker :model-value="monthPickerValue" @update:model-value="onMonthPickedStr" />
            </div>
          </div>

          <div class="grid grid-cols-12 gap-6">
            <CompanyProfits
              :company-data="companySnapshot"
              :currentyear-data="companyCurrentYearData"
              :lastyear-data="companyLastYearData"
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />
            <CompanyRevenue
              :company-data="companySnapshot"
              :currentyear-data="companyCurrentYearData"
              :lastyear-data="companyLastYearData"
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />
            <CompanyContracts
              :company-data="companySnapshot"
              :currentyear-data="companyCurrentYearData"
              :lastyear-data="companyLastYearData"
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />

            <!-- 6个财务指标小卡片 -->
            <CompanyMetricCards
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />

            <div class="col-span-full mt-1">
              <SectionDividerTitle
                title="公司本部经营指标"
                subtitle="HEADQUARTERS"
                tone="emerald"
                :compact="true"
              />
            </div>
            
            <BaseCard
              v-if="companyUnitOrgId"
              metric-type="charge"
              :org-id="companyUnitOrgId"
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />
            <BaseCard
              v-if="companyUnitOrgId"
              metric-type="contract"
              :org-id="companyUnitOrgId"
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />
            <BaseCard
              v-if="companyUnitOrgId"
              metric-type="earning"
              :org-id="companyUnitOrgId"
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />
            <BaseCard
              v-if="companyUnitOrgId"
              metric-type="cash"
              :org-id="companyUnitOrgId"
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
              modal-chart-type="line"
            />

            <div class="col-span-full mt-1">
              <SectionDividerTitle
                title="生产部门经营指标"
                subtitle="PRODUCTION DEPARTMENTS"
                tone="violet"
                :compact="true"
              />
            </div>

            <DepartmentOverview
              :selected-year="deferredYear"
              :selected-month="deferredMonth"
            />

            <div class="col-span-full mt-2">
              <SectionDividerTitle
                title="中能智新公司"
                subtitle="ZHONGNENG ZHIXIN"
                tone="blue"
                :compact="true"
              />
              <div class="grid grid-cols-12 gap-6">
                <BaseCard
                  metric-type="profit_total"
                  :org-id="3"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="revenue"
                  :org-id="3"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="new_contract"
                  :org-id="3"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="cash"
                  :org-id="3"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                  modal-chart-type="line"
                />
              </div>
            </div>

            <div class="col-span-full mt-2">
              <SectionDividerTitle
                title="能建时代研究院"
                subtitle="ERA RESEARCH INSTITUTE"
                tone="violet"
                :compact="true"
              />
              <div class="grid grid-cols-12 gap-6">
                <BaseCard
                  metric-type="profit_total"
                  :org-id="4"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="revenue"
                  :org-id="4"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="new_contract"
                  :org-id="4"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="cash"
                  :org-id="4"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                  modal-chart-type="line"
                />
              </div>
            </div>

            <div class="col-span-full mt-2">
              <SectionDividerTitle
                title="苏尼特公司"
                subtitle="SUNITE COMPANY"
                tone="emerald"
                :compact="true"
              />
              <div class="grid grid-cols-12 gap-6">
                <BaseCard
                  metric-type="profit_total"
                  :org-id="5"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="revenue"
                  :org-id="5"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                />
                <BaseCard
                  metric-type="cash"
                  :org-id="5"
                  :selected-year="deferredYear"
                  :selected-month="deferredMonth"
                  modal-chart-type="line"
                />
              </div>
            </div>
          </div>

        </div>
      </main>

      <ChatBot :current-year="selectedYear" :current-month="selectedMonth" />

    </div>

  </div>
</template>

<script>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Header from '../partials/Header.vue'
import BaseCard from '../partials/dashboard/BaseCard.vue'
import CompanyRevenue from '../partials/dashboard/CompanyRevenue.vue'
import CompanyProfits from '../partials/dashboard/CompanyProfits.vue'
import CompanyContracts from '../partials/dashboard/CompanyContracts.vue'
import CompanyMetricCards from '../partials/dashboard/CompanyMetricCards.vue'
import DepartmentOverview from '../partials/dashboard/DepartmentOverview.vue'
import ChatBot from '../components/ChatBot.vue'
import Datepicker from '../components/Datepicker.vue'
import SectionDividerTitle from '../components/SectionDividerTitle.vue'
import { GLOBAL_CONFIG, formatValue } from '../utils/Utils'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL

export default {
  name: 'Dashboard',
  components: {
    Header,
    BaseCard,
    CompanyRevenue,
    CompanyProfits,
    CompanyContracts,
    CompanyMetricCards,
    DepartmentOverview,
    ChatBot,
    Datepicker,
    SectionDividerTitle,
  },
  setup() {
    const sidebarOpen = ref(false)
    const now = new Date()
    const selectedYear = ref(now.getFullYear())
    const selectedMonth = ref(now.getMonth())

    const companyCurrentYearData = ref([])
    const companyLastYearData = ref([])
    const companySnapshot = ref({})
    const companyUnitOrgId = ref(null)
    const isLoading = ref(false)
    const loadError = ref('')
    const bootLoading = ref(true)
    const bootProgress = ref(0)
    const bootStatusText = ref('准备初始化...')
    const hasBooted = ref(false)
    const performanceFirstMode = ref(false)
    const bootStages = ['数据源连接', '组织识别', '指标计算', '界面渲染']
    const bootStageIndex = computed(() => {
      if (bootProgress.value >= 100) return bootStages.length - 1
      if (bootProgress.value >= 75) return 3
      if (bootProgress.value >= 50) return 2
      if (bootProgress.value >= 25) return 1
      return 0
    })

    // 首屏外组件延迟更新所用 refs
    const deferredYear = ref(now.getFullYear())
    const deferredMonth = ref(now.getMonth() + 1)
    let deferTimer = null

    const setBootProgress = (progress, status) => {
      bootProgress.value = Math.min(100, Math.max(0, progress))
      if (status) bootStatusText.value = status
    }

    const detectPerformanceFirstMode = () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const lowCpu = Number(navigator.hardwareConcurrency || 0) > 0 && Number(navigator.hardwareConcurrency) <= 4
      const lowMemory = Number(navigator.deviceMemory || 0) > 0 && Number(navigator.deviceMemory) <= 4
      performanceFirstMode.value = Boolean(prefersReducedMotion || lowCpu || lowMemory)
    }

    const monthPickerValue = computed(() => {
      const y = String(selectedYear.value)
      const m = String(selectedMonth.value).padStart(2, '0')
      return `${y}-${m}`
    })

    const attachCompanyCompletion = (row) => {
      const safe = { ...row }
      safe.profit_group_completion = safe.annual_plan_group_profit ? safe.profit_total / safe.annual_plan_group_profit : 0
      safe.profit_internal_completion = safe.annual_plan_internal_profit ? safe.profit_total / safe.annual_plan_internal_profit : 0
      safe.revenue_group_completion = safe.annual_plan_group_revenue ? safe.revenue_total / safe.annual_plan_group_revenue : 0
      safe.revenue_internal_completion = safe.annual_plan_internal_revenue ? safe.revenue_total / safe.annual_plan_internal_revenue : 0
      safe.contract_group_completion = safe.annual_plan_group_contract ? safe.new_contract_amount / safe.annual_plan_group_contract : 0
      safe.contract_internal_completion = safe.annual_plan_internal_contract ? safe.new_contract_amount / safe.annual_plan_internal_contract : 0
      return safe
    }

    const loadCompanyData = async () => {
      const url = `${API_BASE_URL}/company-lastyear?year=${selectedYear.value}&month=${selectedMonth.value}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('company-lastyear api error')
      const payload = await res.json()
      const raw = Array.isArray(payload.data) ? payload.data : []
      const sortedRaw = [...raw].sort((a, b) => a.time_id - b.time_id)

      const currentRows = sortedRaw.filter((r) => Math.floor(r.time_id / 100) === selectedYear.value)
      if (!currentRows.length && sortedRaw.length) {
        const latest = sortedRaw[sortedRaw.length - 1]
        const latestYear = Math.floor(latest.time_id / 100)
        const latestMonth = latest.time_id % 100

        if (selectedYear.value !== latestYear || selectedMonth.value !== latestMonth) {
          selectedYear.value = latestYear
          selectedMonth.value = latestMonth
          return
        }
      }

      companyCurrentYearData.value = currentRows

      companyLastYearData.value = sortedRaw
        .filter((r) => Math.floor(r.time_id / 100) === selectedYear.value - 1)

      const targetId = selectedYear.value * 100 + selectedMonth.value
      const snapshot = companyCurrentYearData.value.find((r) => r.time_id === targetId)
        || companyCurrentYearData.value[companyCurrentYearData.value.length - 1]
        || {}

      companySnapshot.value = attachCompanyCompletion(snapshot)
    }

    const loadCompanyUnitOrgId = async () => {
      const res = await fetch(`${API_BASE_URL}/organizations`)
      if (!res.ok) {
        companyUnitOrgId.value = 14
        return
      }
      const payload = await res.json()
      const rows = Array.isArray(payload.data) ? payload.data : []
      const matched = rows.find((r) => String(r.org_name || '').includes('公司本部'))
        || rows.find((r) => String(r.org_name || '').includes('公司'))
        || rows[0]
      companyUnitOrgId.value = matched ? matched.org_id : 14
    }

    const loadLatestAvailableMonth = async () => {
      const res = await fetch(`${API_BASE_URL}/dates`)
      if (!res.ok) return
      const payload = await res.json()
      const rows = Array.isArray(payload.data) ? payload.data : []
      if (!rows.length) return
      const latest = [...rows].sort((a, b) => Number(a.date_id) - Number(b.date_id)).pop()
      if (!latest) return
      selectedYear.value = Number(latest.year)
      selectedMonth.value = Number(latest.month_number)
    }

    const reload = async () => {
      isLoading.value = true
      loadError.value = ''

      const [companyResult] = await Promise.allSettled([
        loadCompanyData(),
      ])

      const failed = []
      if (companyResult.status === 'rejected') failed.push('公司指标')

      if (failed.length) {
        loadError.value = `${failed.join('、')}加载失败，请确认后端接口状态`
      }

      isLoading.value = false
    }

    const onMonthPickedStr = (val) => {
      const [y, m] = (val || '').split('-')
      const nextY = Number(y)
      const nextM = Number(m)
      if (!nextY || !nextM) return
      selectedYear.value = nextY
      selectedMonth.value = nextM
      // 首屏外组件延迟 300ms 更新，避免全页同时重绘卡顿
      if (deferTimer) clearTimeout(deferTimer)
      deferTimer = setTimeout(() => {
        deferredYear.value = nextY
        deferredMonth.value = nextM
      }, 300)
    }

    watch([selectedYear, selectedMonth], () => {
      if (!hasBooted.value) return
      reload().catch((err) => {
        console.error('dashboard reload failed:', err)
      })
    })

    const waitFrame = () => new Promise((resolve) => {
      requestAnimationFrame(() => resolve())
    })

    const finishBootWhenRendered = async () => {
      setBootProgress(86, '正在渲染图表与卡片...')
      await nextTick()
      await waitFrame()
      await waitFrame()
      setBootProgress(96, '正在完成视觉初始化...')
      await new Promise((resolve) => setTimeout(resolve, 260))
      setBootProgress(100, '加载完成')
      await new Promise((resolve) => setTimeout(resolve, 180))
      bootLoading.value = false
    }

    onMounted(async () => {
      detectPerformanceFirstMode()
      setBootProgress(8, '正在连接数据源...')
      try {
        await loadLatestAvailableMonth()
        setBootProgress(26, '已获取最新日期')
      } catch (err) {
        console.error('load latest month failed:', err)
      }

      setBootProgress(36, '正在识别公司本部...')
      try {
        await loadCompanyUnitOrgId()
        setBootProgress(52, '组织信息已就绪')
      } catch (err) {
        console.error('load company org failed:', err)
      }

      setBootProgress(64, '正在加载经营数据...')
      await reload()

      await finishBootWhenRendered()
      hasBooted.value = true
      // 启动完成后同步 deferred refs，确保首次渲染正确
      deferredYear.value = selectedYear.value
      deferredMonth.value = selectedMonth.value
    })

    return {
      sidebarOpen,
      selectedYear,
      selectedMonth,
      deferredYear,
      deferredMonth,
      monthPickerValue,
      companyCurrentYearData,
      companyLastYearData,
      companySnapshot,
      companyUnitOrgId,
      isLoading,
      loadError,
      bootLoading,
      bootProgress,
      bootStatusText,
      performanceFirstMode,
      bootStages,
      bootStageIndex,
      onMonthPickedStr,
      formatValue,
    }
  }
}
</script>

<style scoped>
.boot-bg {
  background:
    radial-gradient(1200px 700px at 10% -10%, rgba(14, 165, 233, 0.22), transparent 60%),
    radial-gradient(1000px 650px at 110% 10%, rgba(16, 185, 129, 0.2), transparent 62%),
    linear-gradient(145deg, #eaf2ff 0%, #f5fbff 44%, #eefaf3 100%);
}

:global(.dark) .boot-bg {
  background:
    radial-gradient(1200px 700px at 10% -10%, rgba(14, 165, 233, 0.2), transparent 60%),
    radial-gradient(1000px 650px at 110% 10%, rgba(52, 211, 153, 0.17), transparent 62%),
    linear-gradient(145deg, #0b1220 0%, #10192e 45%, #0d1b1a 100%);
}

.boot-grid {
  background-image: linear-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.14) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(circle at center, black 35%, transparent 100%);
}

.boot-noise {
  background-image: radial-gradient(rgba(15, 23, 42, 0.13) 0.5px, transparent 0.5px);
  background-size: 3px 3px;
  mix-blend-mode: soft-light;
}

.boot-circuit {
  background:
    linear-gradient(90deg, transparent 20%, rgba(56, 189, 248, 0.2) 20.6%, transparent 21.2%),
    linear-gradient(180deg, transparent 32%, rgba(52, 211, 153, 0.17) 32.8%, transparent 33.6%),
    linear-gradient(90deg, transparent 66%, rgba(6, 182, 212, 0.18) 66.7%, transparent 67.3%);
  background-size: 120% 120%;
  animation: bootCircuitPan 18s linear infinite;
  opacity: 0.5;
}

.boot-halo {
  background: conic-gradient(from 0deg, rgba(34, 211, 238, 0.18), rgba(16, 185, 129, 0.14), rgba(14, 165, 233, 0.18));
  filter: blur(22px);
  opacity: 0.58;
  animation: bootSpin 16s linear infinite;
}

.boot-orb {
  filter: blur(4px);
  animation: bootFloat 10s ease-in-out infinite;
}

.boot-orb-cyan {
  background: radial-gradient(circle at 30% 35%, rgba(125, 211, 252, 0.72), rgba(56, 189, 248, 0.04) 70%);
}

.boot-orb-emerald {
  background: radial-gradient(circle at 60% 45%, rgba(110, 231, 183, 0.58), rgba(16, 185, 129, 0.03) 72%);
  animation-delay: 1.2s;
}

.boot-orb-sky {
  background: radial-gradient(circle at center, rgba(34, 211, 238, 0.4), rgba(14, 165, 233, 0.02) 75%);
  animation-delay: 2.4s;
}

.boot-shell {
  font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
}

.boot-title {
  letter-spacing: 0.01em;
  text-wrap: balance;
}

.boot-ring {
  border: 1px solid rgba(125, 211, 252, 0.45);
  opacity: 0.48;
  animation: bootPulseRing 4.8s ease-in-out infinite;
}

.boot-ring-delay {
  opacity: 0.24;
  animation-delay: 1.5s;
}

.boot-scanline {
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.2) 0%, rgba(56, 189, 248, 0.02) 65%, transparent 100%);
  pointer-events: none;
}

.boot-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(56, 189, 248, 0.55);
  pointer-events: none;
}

.boot-corner-tl {
  left: 14px;
  top: 14px;
  border-left-width: 1.5px;
  border-top-width: 1.5px;
}

.boot-corner-tr {
  right: 14px;
  top: 14px;
  border-right-width: 1.5px;
  border-top-width: 1.5px;
}

.boot-corner-bl {
  left: 14px;
  bottom: 14px;
  border-left-width: 1.5px;
  border-bottom-width: 1.5px;
}

.boot-corner-br {
  right: 14px;
  bottom: 14px;
  border-right-width: 1.5px;
  border-bottom-width: 1.5px;
}

.boot-pulse-dot {
  background: linear-gradient(180deg, #22d3ee 0%, #06b6d4 100%);
  box-shadow: 0 0 0 rgba(34, 211, 238, 0.5);
  animation: bootPulseDot 1.8s ease-in-out infinite;
}

.boot-ticker {
  animation: bootTicker 12s linear infinite;
}

.boot-performance .boot-scanline {
  opacity: 0.35;
}

.boot-performance .boot-corner {
  border-color: rgba(56, 189, 248, 0.35);
}

.boot-progress {
  background: linear-gradient(90deg, #06b6d4 0%, #38bdf8 45%, #34d399 100%);
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.45);
  transition: width 260ms ease;
}

@keyframes bootFloat {
  0%,
  100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-18px) scale(1.03);
  }
}

@keyframes bootPulseRing {
  0%,
  100% {
    transform: scale(1);
    border-color: rgba(125, 211, 252, 0.4);
  }
  50% {
    transform: scale(1.02);
    border-color: rgba(52, 211, 153, 0.35);
  }
}

@keyframes bootPulseDot {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.5);
    transform: scale(1);
  }
  60% {
    box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.02);
    transform: scale(1.12);
  }
}

@keyframes bootSpin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes bootCircuitPan {
  from {
    background-position: 0 0, 0 0, 0 0;
  }
  to {
    background-position: 120% 0, 0 120%, 120% 120%;
  }
}

@keyframes bootTicker {
  from {
    transform: translateX(0%);
  }
  to {
    transform: translateX(-50%);
  }
}

.boot-fade-enter-active,
.boot-fade-leave-active {
  transition: opacity 280ms ease;
}

.boot-fade-enter-from,
.boot-fade-leave-to {
  opacity: 0;
}
</style>