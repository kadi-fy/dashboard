<template>
  <Teleport to="body">
    <Transition name="modal">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      @click.self="close"
    >
      <div
        class="relative w-full max-w-[95vw] max-h-[95vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {{ unitName || '部门详情' }}
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
          <!-- Canvas Placeholder for Bar Chart -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">净收费总计趋势（万元）</h4>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
              <canvas ref="chartCanvas" class="w-full h-150"></canvas>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, computed, nextTick } from 'vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// === 1. 修改 Props: 移除 unitDetail，改为接收拆分好的数组 ===
const props = defineProps({
  modelValue: Boolean,
  currentYearData: {
    type: Array,
    default: () => []
  },
  lastYearData: {
    type: Array,
    default: () => []
  },
  selectedYear: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// Refs
const chartCanvas = ref(null)
let chartInstance = null

const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

// === 2. 修改计算属性: 直接使用传入的数组，不再进行 filter 过滤 ===

// 月份直接从今年数据提取
// const months = computed(() =>
//   currentYearData.value.map(item => `${item.time_id % 100}月`)
// )
const months = computed(() => {
  return Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
})

// 今年数据直接映射
const charges = computed(() =>
  props.currentYearData.map(item => (item.charge_total)) 
)

// 去年数据通过 Map 对齐到今年的月份
const lastYearCharges = computed(() => {
  const map = new Map(props.lastYearData.map(item => [item.time_id % 100, item.charge_total]))
  return months.value.map(month => {
    const num = parseInt(month) // "1月" -> 1
    return map.has(num) ? map.get(num) : null
  })
})

const annualPlan = computed(() =>
  props.currentYearData.length > 0 ? props.currentYearData[0].charge_plan : 0
)

const monthlyChargeTarget = computed(() => {
  if (annualPlan.value <= 0) return []
  const monthly = (annualPlan.value / 12).toFixed(0)
  return months.value.map((_, i) => (monthly * (i + 1)))
})

const growthRates = computed(() => {
  return charges.value.map((current, index) => {
    const last = lastYearCharges.value[index]
    if (last == null || parseFloat(last) === 0) return null
    const rate = ((parseFloat(current) - parseFloat(last)) / parseFloat(last)) * 100
    return rate.toFixed(1)
  })
})

// 单位名称取第一条数据的 org_name
const unitName = computed(() =>
  props.currentYearData.length > 0 ? props.currentYearData[0].org_name : ''
)

const summary = computed(() => {
  if (props.currentYearData.value.length === 0) return null
  const last = props.currentYearData.value[props.currentYearData.value.length - 1]
  return {
    annualPlan: last.charge_plan,
    totalNetCharge: last.charge_total,
    completionRate: (last.charge_total / last.charge_plan) * 100
  }
})


// === 工具函数 (保持不变) ===
const close = () => {
  emit('update:modelValue', false)
}

const formatNumber = (num) => {
  if (num == null || isNaN(num)) return '—'
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(num)
}

const completionCal = (completion, month) => {
  const expected = month / 12
  if (completion >= expected) return 'rgba(76, 175, 80, 0.8)' // green
  else if (completion >= expected * 0.8) return 'rgba(255, 193, 7, 0.8)' // yellow
  else return 'rgba(244, 67, 54, 0.8)' // red
}

// === 自定义插件 (保持不变) ===
const valueAndPercentagePlugin = {
  id: 'valueAndPercentageLabels',
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart
    ctx.save()

    data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.type !== 'bar') return
      const meta = chart.getDatasetMeta(datasetIndex)
      meta.data.forEach((element, index) => {
        if (!element?.x || !element?.y) return

        const value = dataset.data[index]
        if (value == null) return

        const { x, y, width, height } = element;

        // 数值标签
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#fff'
        const centerY = y + height / 2;
        ctx.fillText(`${value}`, x, centerY)
        ctx.fillText('万元', x, centerY + 12)

        // 完成率 & 增长率（仅实际完成）
        if (dataset.label?.includes('实际完成')) {
          const plan = annualPlan.value  
          // 注意：这里直接访问 props.currentYearData，因为不再经过 computed 包装
          const currentItem = props.currentYearData[index]
          const percentage = plan ? ((currentItem?.charge_total || 0) / plan) * 100 : 0

          ctx.fillStyle = '#333'
          ctx.fillText(`${percentage.toFixed(0)}%`, x, y - 4)

          const growth = growthRates.value[index]
          if (growth != null) {
            const color = parseFloat(growth) >= 0 ? '#e74c3c' : '#27ae60'
            const symbol = parseFloat(growth) >= 0 ? '↑' : '↓'
            ctx.fillStyle = color
            ctx.fillText(`${symbol}${Math.abs(parseFloat(growth))}%`, x, y - 20)
          }
        }
      })
    })

    ctx.restore()
  }
}

// === 初始化图表 (保持不变) ===
const initChart = () => {
  const canvasEl = chartCanvas.value
  if (!canvasEl || !canvasEl.isConnected || props.currentYearData.length === 0) {
    destroyChart()
    return
  }

  const ctx = canvasEl.getContext('2d')
  if (!ctx) {
    destroyChart()
    return
  }

  destroyChart()

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.value,
      datasets: [
        {
          type: 'line',
          label: '年度目标 (净收费合计)',
          data: monthlyChargeTarget.value,
          borderColor: '#FCD34D',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#FCD34D',
          pointBorderColor: '#FCD34D',
          pointBorderWidth: 1
        },
        {
          type: 'bar',
          label: '实际完成 (净收费合计)',
          data: charges.value,
          backgroundColor: function(context) {
            const completion = context.parsed.y/annualPlan.value;
            return completionCal(completion, context.parsed.x + 1);
          },
          borderWidth: 1
        },
        {
          type: 'bar',
          label: '上一年同期完成 (净收费合计)',
          data: lastYearCharges.value,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || ''
              let value = context.parsed.y
              if (label.includes('实际完成')) {
                const plan = annualPlan.value 
                const currentItem = props.currentYearData[context.dataIndex]
                const pct = plan ? ((currentItem?.charge_total || 0) / plan) * 100 : 0
                const growth = growthRates.value[context.dataIndex]
                let lines = [`${label}: ${value} 万元`, `完成率: ${pct.toFixed(1)}%`]
                if (growth != null) {
                  lines.push(`同比增长: ${growth >= 0 ? '↑' : '↓'}${Math.abs(growth)}%`)
                }
                return lines
              }
              return `${label}: ${value} 万元`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '金额 (万元)' }
        },
        x: {
          grid: { display: false }
        }
      }
    },
    plugins: [valueAndPercentagePlugin]
  })
}

// === Watch & Cleanup ===
watch(
  () => chartCanvas.value,
  (newCanvas) => {
    if (newCanvas) {
      if (props.currentYearData.length > 0) {
        initChart()
      }
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick()
      if (chartCanvas.value && chartCanvas.value.isConnected && props.currentYearData.length > 0) {
        initChart()
      }
      return
    }
    destroyChart()
  },
)

// 监听数据变化，重新绘图
watch(
  () => [props.currentYearData, props.lastYearData, props.selectedYear],
  () => {
    if (chartCanvas.value && chartCanvas.value.isConnected) {
      initChart()
    } else {
      destroyChart()
    }
  }
)

onBeforeUnmount(() => destroyChart())
</script>
<style scoped>
/* 
  过渡名称对应 <Transition name="modal"> 
  进入动画 (Opening)
*/
.modal-enter-active {
  transition: all 0.3s ease-out;
}

/* 离开动画 (Closing) */
.modal-leave-active {
  transition: all 0.3s ease-in;
}

/* 进入前的状态：透明 + 缩小 */
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* 离开后的状态：透明 + 缩小 */
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>