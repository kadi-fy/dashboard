<template>
  <div class="flex h-screen overflow-hidden">

    <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      <Header :sidebarOpen="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="grow">
        <div class="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-9xl mx-auto">

          <!-- 顶部标题行 -->
          <div class="mb-3 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">公司整体经营指标</h1>
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

            <DepartmentOverview
              :selected-year="selectedYear"
              :selected-month="selectedMonth"
            />

            <div class="col-span-full mt-2">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">中能智新公司</h3>
              <div class="grid grid-cols-12 gap-6">
                <BaseCard
                  metric-type="profit_total"
                  :org-id="3"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="revenue"
                  :org-id="3"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="new_contract"
                  :org-id="3"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="cash"
                  :org-id="3"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                  modal-chart-type="line"
                />
              </div>
            </div>

            <div class="col-span-full mt-2">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">能建时代研究院</h3>
              <div class="grid grid-cols-12 gap-6">
                <BaseCard
                  metric-type="profit_total"
                  :org-id="4"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="revenue"
                  :org-id="4"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="new_contract"
                  :org-id="4"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="cash"
                  :org-id="4"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                  modal-chart-type="line"
                />
              </div>
            </div>

            <div class="col-span-full mt-2">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">苏尼特公司</h3>
              <div class="grid grid-cols-12 gap-6">
                <BaseCard
                  metric-type="profit_total"
                  :org-id="5"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="revenue"
                  :org-id="5"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
                />
                <BaseCard
                  metric-type="cash"
                  :org-id="5"
                  :selected-year="selectedYear"
                  :selected-month="selectedMonth"
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
import { computed, onMounted, ref, watch } from 'vue'
import Header from '../partials/Header.vue'
import BaseCard from '../partials/dashboard/BaseCard.vue'
import CompanyRevenue from '../partials/dashboard/CompanyRevenue.vue'
import CompanyProfits from '../partials/dashboard/CompanyProfits.vue'
import CompanyContracts from '../partials/dashboard/CompanyContracts.vue'
import CompanyMetricCards from '../partials/dashboard/CompanyMetricCards.vue'
import DepartmentOverview from '../partials/dashboard/DepartmentOverview.vue'
import ChatBot from '../components/ChatBot.vue'
import Datepicker from '../components/Datepicker.vue'
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
  },
  setup() {
    const sidebarOpen = ref(false)
    const now = new Date()
    const selectedYear = ref(now.getFullYear())
    const selectedMonth = ref(now.getMonth() + 1)

    const companyCurrentYearData = ref([])
    const companyLastYearData = ref([])
    const companySnapshot = ref({})
    const departmentData = ref([])
    const companyUnitOrgId = ref(null)
    const isLoading = ref(false)
    const loadError = ref('')

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

    const loadDepartmentData = async () => {
      const url = `${API_BASE_URL}/department-performance?year=${selectedYear.value}&month=${selectedMonth.value}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('department-performance api error')
      const payload = await res.json()
      departmentData.value = Array.isArray(payload.data) ? payload.data : []
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

      const [companyResult, departmentResult] = await Promise.allSettled([
        loadCompanyData(),
        loadDepartmentData(),
      ])

      const failed = []
      if (companyResult.status === 'rejected') failed.push('公司指标')
      if (departmentResult.status === 'rejected') failed.push('部门指标')

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
    }

    watch([selectedYear, selectedMonth], () => {
      reload().catch((err) => {
        console.error('dashboard reload failed:', err)
      })
    })

    onMounted(async () => {
      try {
        await loadLatestAvailableMonth()
      } catch (err) {
        console.error('load latest month failed:', err)
      }
      try {
        await loadCompanyUnitOrgId()
      } catch (err) {
        console.error('load company org failed:', err)
      }
      await reload()
    })

    return {
      sidebarOpen,
      selectedYear,
      selectedMonth,
      monthPickerValue,
      companyCurrentYearData,
      companyLastYearData,
      companySnapshot,
      departmentData,
      companyUnitOrgId,
      isLoading,
      loadError,
      onMonthPickedStr,
      formatValue,
    }
  }
}
</script>