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
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {{ departmentName || '部门详情' }}
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
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">月度净收费趋势（万元）</h4>
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
import { ref, watch, onUnmounted, computed } from 'vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// Props & Emits
const props = defineProps({
  modelValue: Boolean,
  departmentDetail: {
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

// === 响应式计算数据 ===
const currentYearData = computed(() =>
  props.departmentDetail.filter(item => Math.floor(item.time_id / 100) === props.selectedYear)
)

const lastYearData = computed(() =>
  props.departmentDetail.filter(item => Math.floor(item.time_id / 100) === props.selectedYear - 1)
)

// const months = computed(() =>
//   currentYearData.value.map(item => `${item.time_id % 100}月`)
// )
const months = computed(() => {
  return Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
})

const charges = computed(() =>
  currentYearData.value.map(item => (item.net_charge )) // 万元，保留2位
)

const lastYearCharges = computed(() => {
  const map = new Map(lastYearData.value.map(item => [item.time_id % 100, item.net_charge ]))
  return months.value.map(month => {
    const num = parseInt(month) // "1月" -> 1
    return map.has(num) ? map.get(num) : null
  })
})

const annualPlan = computed(() =>
  currentYearData.value.length > 0 ? currentYearData.value[0].annual_plan_charge  : 0
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

const departmentName = computed(() =>
  props.departmentDetail.length > 0 ? props.departmentDetail[0].org_name : ''
)

const summary = computed(() => {
  if (currentYearData.value.length === 0) return null
  const last = currentYearData.value[currentYearData.value.length - 1]
  return {
    annualPlan: last.annual_plan_charge,
    totalNetCharge: last.net_charge,
    completionRate: (last.net_charge / last.annual_plan_charge) * 100
  }
})


// === 工具函数 ===
const close = () => {
  emit('update:modelValue', false)
}

const formatNumber = (num) => {
  if (num == null || isNaN(num)) return '—'
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(num)
}

const completionCal = (completion, month) => {
      const expected = month / 12;
      
      // 绿色系 (达标)
      if (completion >= expected) {
        return ['rgba(76, 175, 80, 0.8)', 'rgba(230, 255, 235, 1.0)']; // Tailwind green-400 -> green-700
      } 
      // 黄色系 (预警)
      else if (completion >= expected * 0.8) {
        return ['rgba(255, 193, 7, 0.8)', 'rgba(255, 250, 200, 1.0)']; // Tailwind yellow-300 -> yellow-700
      } 
      // 红色系 (未达标)
      else {
        return ['rgba(244, 67, 54, 0.8)', 'rgba(255, 210, 210, 1.0)']; // Tailwind red-400 -> red-700
      }
    };

// === 自定义插件 ===
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
          const currentItem = currentYearData.value[index]
          const percentage = plan ? ((currentItem?.net_charge || 0) / plan) * 100 : 0

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

// === 初始化图表 ===
const initChart = () => {
  if (!chartCanvas.value || currentYearData.value.length === 0) return

  const ctx = chartCanvas.value.getContext('2d')

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.value,
      datasets: [
        {
          type: 'line',
          label: '年度目标(收费)',
          data: monthlyChargeTarget.value,
          borderColor: 'rgba(212, 175, 55, 1)',
          backgroundColor: 'rgba(212, 175, 55, 0.3)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0
        },
        {
          type: 'bar',
          label: '实际完成(收费)',
          data: charges.value,
          backgroundColor: function(context) {
          if (!context.chart) return 'rgba(0,0,0,0.5)';
          const ctx = context.chart.ctx;
          const value = context.parsed.y;
          const chartHeight = context.chart.height;
          const completion = context.parsed.y/annualPlan.value;
          const [colorBottom, colorTop] = completionCal(completion, context.parsed.x + 1);
          const gradient = ctx.createLinearGradient(0, chartHeight, 0, 0);
          gradient.addColorStop(0, colorBottom); // 底部：深色
          gradient.addColorStop(1, colorTop);    // 顶部：浅色        
          return gradient;
          },
          borderWidth: 1
        },
        {
          type: 'bar',
          label: '上一年同期完成(收费)',
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
                const currentItem = currentYearData.value[context.dataIndex]
                const pct = plan ? ((currentItem?.net_charge || 0) / plan) * 100 : 0
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
      // 等待数据也准备好
      if (props.departmentDetail.length > 0) {
        initChart()
      }
    }
  },
  { immediate: true }
)

// 同时监听数据变化，重新绘图
watch(
  () => [props.departmentDetail, props.selectedYear],
  () => {
    if (chartCanvas.value) {
      initChart()
    }
  }
)

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
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