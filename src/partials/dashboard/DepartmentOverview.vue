<template>
  <div class="col-span-full grid grid-cols-12 gap-6">
    <DepartmentCompletionCard
      title="部门净收费"
      subtitle="DEPARTMENT NET CHARGE"
      metric-type="charge"
      :selected-month="selectedMonth"
      :rows="departmentRows"
      actual-key="net_charge"
      plan-key="annual_plan_charge"
      :clickable="true"
      @bar-click="(row) => handleDepartmentBarClick(row, 'charge')"
    />

    <DepartmentCompletionCard
      title="部门净合同"
      subtitle="DEPARTMENT SIGNED CONTRACTS"
      metric-type="contract"
      :selected-month="selectedMonth"
      :rows="contractDepartmentRows"
      actual-key="net_contract"
      plan-key="annual_plan_contract"
      :clickable="true"
      @bar-click="(row) => handleDepartmentBarClick(row, 'contract')"
    />

    <DepartmentCostCard :rows="costRows" @bar-click="(row) => handleCostProfitBarClick(row, 'cost')" />
    <DepartmentProfitCard :rows="costRows" @bar-click="(row) => handleCostProfitBarClick(row, 'profit')" />

    <DepartmentLineMetricCard
      title="部门人均收费/合同"
      subtitle="DEPARTMENT PER CAPITA CHARGE"
      metric-key="charge_per"
      secondary-metric-key="contract_per"
      primary-label="人均收费"
      secondary-label="人均合同"
      metric-type="line-charge-per"
      :rows="costRows"
      accent-class="bg-cyan-400"
      icon-class="bg-cyan-100 text-cyan-600"
      subtitle-class="text-cyan-500"
      primary-color="#0ea5e9"
      secondary-color="#14b8a6"
      unit-label="万元/人"
      @point-click="handleLineMetricPointClick"
    />

    <DepartmentLineMetricCard
      title="部门人均成本"
      subtitle="DEPARTMENT PER CAPITA COST"
      metric-key="cost_per"
      metric-type="line-cost-per"
      :rows="costRows"
      accent-class="bg-amber-400"
      icon-class="bg-amber-100 text-amber-600"
      subtitle-class="text-amber-500"
      primary-label="人均成本"
      primary-color="#f59e0b"
      unit-label="万元/人"
      @point-click="handleLineMetricPointClick"
    />

    <DepartmentLineMetricCard
      title="部门人均利润"
      subtitle="DEPARTMENT PER CAPITA PROFIT"
      metric-key="profit_per"
      metric-type="line-profit-per"
      :rows="costRows"
      accent-class="bg-emerald-400"
      icon-class="bg-emerald-100 text-emerald-600"
      subtitle-class="text-emerald-500"
      primary-label="人均利润"
      primary-color="#10b981"
      unit-label="万元/人"
      @point-click="handleLineMetricPointClick"
    />

    <DepartmentLineMetricCard
      title="部门人数"
      subtitle="DEPARTMENT HEADCOUNT"
      metric-key="headcount"
      metric-type="line-headcount"
      :rows="costRows"
      accent-class="bg-indigo-400"
      icon-class="bg-indigo-100 text-indigo-600"
      subtitle-class="text-indigo-500"
      primary-label="部门人数"
      primary-color="#6366f1"
      unit-label="人"
      @point-click="handleLineMetricPointClick"
    />

    <DepartmentMetricModal
      v-model="showMetricModal"
      :metric-type="activeMetricType"
      :metric-name="activeMetricName"
      :department-detail="departmentDetailRows"
      :selected-year="selectedYear"
    />

    <DepartmentLineMetricModal
      v-model="showLineMetricModal"
      :metric-name="activeLineMetricName"
      :metric-key="activeLineMetricKey"
      :unit-label="activeLineMetricUnit"
      :detail-rows="lineMetricDetailRows"
      :selected-year="selectedYear"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import DepartmentCompletionCard from './DepartmentCompletionCard.vue'
import DepartmentCostCard from './DepartmentCostCard.vue'
import DepartmentProfitCard from './DepartmentProfitCard.vue'
import DepartmentLineMetricCard from './DepartmentLineMetricCard.vue'
import DepartmentMetricModal from '../../components/DepartmentMetricModal.vue'
import DepartmentLineMetricModal from '../../components/DepartmentLineMetricModal.vue'
import { GLOBAL_CONFIG } from '../../utils/Utils'

const props = defineProps({
  selectedYear: { type: Number, required: true },
  selectedMonth: { type: Number, required: true },
})

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL

const departmentRows = ref([])
const costRows = ref([])

const contractDepartmentRows = computed(() => {
  const list = Array.isArray(departmentRows.value) ? departmentRows.value : []
  return list.filter((row) => Number(row?.org_id) !== 16)
})

const showMetricModal = ref(false)
const departmentDetailRows = ref([])
const activeMetricType = ref('charge')
const activeMetricName = ref('部门净收费')

const showLineMetricModal = ref(false)
const lineMetricDetailRows = ref([])
const activeLineMetricName = ref('部门人均收费/合同')
const activeLineMetricKey = ref('charge_per')
const activeLineMetricUnit = ref('万元/人')

const sanitizeRows = (rows) => {
  const list = Array.isArray(rows) ? rows : []
  return list.filter((r) => r && r.org_name)
}

const fetchDepartmentRows = async () => {
  const currentUrl = `${API_BASE_URL}/department-performance?year=${props.selectedYear}&month=${props.selectedMonth}`
  const currentRes = await fetch(currentUrl)
  if (!currentRes.ok) throw new Error('department-performance current api error')

  const currentPayload = await currentRes.json()
  departmentRows.value = sanitizeRows(currentPayload.data)
}

const fetchCostRows = async () => {
  const url = `${API_BASE_URL}/department-cost-stack?year=${props.selectedYear}&month=${props.selectedMonth}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('department-cost-stack api error')
  const payload = await res.json()
  costRows.value = sanitizeRows(payload.data)
}

const reload = async () => {
  await Promise.all([fetchDepartmentRows(), fetchCostRows()])
}

const metricNameMap = {
  charge: '部门净收费',
  contract: '部门净合同',
  cost: '部门成本',
  profit: '部门利润',
}

const lineMetricMap = {
  charge_contract_per: { name: '部门人均收费/合同', unit: '万元/人' },
  contract_per: { name: '部门人均收费/合同', unit: '万元/人' },
  cost_per: { name: '部门人均成本', unit: '万元/人' },
  profit_per: { name: '部门人均利润', unit: '万元/人' },
  headcount: { name: '部门人数', unit: '人' },
}

const handleDepartmentBarClick = async (row, metricType = 'charge') => {
  if (!row || row.org_id == null) return
  const detailUrl = `${API_BASE_URL}/department-performance?org_id=${row.org_id}&year=${props.selectedYear}&month=${props.selectedMonth}`
  const res = await fetch(detailUrl)
  if (!res.ok) return
  const payload = await res.json()
  departmentDetailRows.value = Array.isArray(payload.data) ? payload.data : []
  activeMetricType.value = metricType
  activeMetricName.value = metricNameMap[metricType] || '指标'
  showMetricModal.value = true
}

const handleCostProfitBarClick = async (row, metricType) => {
  if (!row || row.org_id == null) return
  const detailUrl = `${API_BASE_URL}/department-cost-stack?org_id=${row.org_id}&year=${props.selectedYear}&month=${props.selectedMonth}`
  const res = await fetch(detailUrl)
  if (!res.ok) return
  const payload = await res.json()
  departmentDetailRows.value = Array.isArray(payload.data) ? payload.data : []
  activeMetricType.value = metricType
  activeMetricName.value = metricNameMap[metricType] || '指标'
  showMetricModal.value = true
}

const handleLineMetricPointClick = async ({ row, metricKey }) => {
  if (!row || row.org_id == null) return
  const detailUrl = `${API_BASE_URL}/department-cost-stack?org_id=${row.org_id}&year=${props.selectedYear}&month=${props.selectedMonth}`
  const res = await fetch(detailUrl)
  if (!res.ok) return

  const payload = await res.json()
  lineMetricDetailRows.value = Array.isArray(payload.data) ? payload.data : []

  const config = lineMetricMap[metricKey] || { name: '指标趋势', unit: '' }
  activeLineMetricKey.value = metricKey
  activeLineMetricName.value = config.name
  activeLineMetricUnit.value = config.unit
  showLineMetricModal.value = true
}

watch(
  () => [props.selectedYear, props.selectedMonth],
  () => {
    reload().catch((err) => {
      console.error('department overview reload failed:', err)
    })
  },
)

onMounted(() => {
  reload().catch((err) => {
    console.error('department overview init failed:', err)
  })
})
</script>
