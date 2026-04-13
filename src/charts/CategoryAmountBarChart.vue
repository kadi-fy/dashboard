<template>
  <!-- ✅ 使用单个根元素包装 -->
  <div class="bar-chart-container">
    <div class="px-5 py-3">
      <ul ref="legend" class="flex flex-wrap gap-x-4"></ul>
    </div>
    <div class="grow">
      <canvas ref="canvas" :width="width" :height="height"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, onMounted, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { getChartColors } from './ChartjsConfig'
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { formatValue, getCssVariable } from '../utils/Utils'

// 注册必要组件
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  data: { type: Object, required: true },
  width: { type: [Number, String], default: null },
  height: { type: [Number, String], default: null },
  plugins: { type: Array, default: () => [] },
  options: { type: Object, default: () => ({}) },
  // ✅ 显式声明可能传入的属性，避免非 prop 警告
  selectedYear: { type: Number, default: null },
  selectedMonth: { type: Number, default: null }
})

const emit = defineEmits(['barClick'])

const canvas = ref(null)
const legend = ref(null)
let chart = null
const destroyChart = () => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

const darkMode = useDark()
const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = getChartColors()

// ✅ 创建深拷贝的数据，避免直接修改 computed 对象
const chartDataCopy = computed(() => {
  if (!props.data) return { labels: [], datasets: [] }
  
  // 深拷贝数据，确保是可修改的普通对象
  return {
    labels: [...(props.data.labels || [])],
    datasets: (props.data.datasets || []).map(dataset => ({
      ...dataset,
      data: [...(dataset.data || [])]
    }))
  }
})


// 生成自定义工具提示
const customTooltip = {
  id: 'customTooltip',
  afterDraw(chart) {
    // 可以添加自定义工具提示逻辑
  }
}

onMounted(() => {
  if (!canvas.value || !canvas.value.isConnected) return
  const ctx = canvas.value.getContext('2d')
  
  const baseOptions = {
    layout: {
      padding: {
        top: 12,
        bottom: 16,
        left: 20,
        right: 20,
      },
    },
    indexAxis: 'x',
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          maxTicksLimit: 5,
          callback: (value) => `${value.toFixed(0)}万元`,
        },
        grid: {
          color: darkMode.value ? gridColor.dark : gridColor.light,
        },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: getCssVariable('--color-gray-600'),
          autoSkip: false,
        },
      },
    },
    plugins: {
      legend: { 
        display: false, // 禁用默认图例，使用自定义 HTML 图例
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: '#1f2937',
        titleColor: '#000' ,
        bodyColor: '#d1d5db' ,
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
            const dataset = context.dataset;
            const value = context.parsed.y;
            return `${dataset.label}: ${value >= 0 ? '+' : ''}${value}万元`;
          }
        },
        bodyColor: darkMode.value ? tooltipBodyColor.dark : tooltipBodyColor.light,
        backgroundColor: darkMode.value ? tooltipBgColor.dark : tooltipBgColor.light,
        borderColor: darkMode.value ? tooltipBorderColor.dark : tooltipBorderColor.light,
      },
    },
    interaction: {
      intersect: false,
      mode: 'nearest',
    },
    animation: { duration: 500 },
    maintainAspectRatio: false,
    resizeDelay: 200,
    onClick: (e, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        emit('barClick', { index });
      }
    }
  };

  const mergedOptions = { ...baseOptions, ...props.options };
  
  // ✅ 使用深拷贝后的数据创建图表
  chart = new Chart(ctx, {
    type: 'bar',
    data: chartDataCopy.value,  // 使用深拷贝的数据
    options: mergedOptions,
    plugins: [
      customTooltip,
      {
        id: 'htmlLegend',
      },
      ...(props.plugins || []),
    ],
  });
});

onBeforeUnmount(() => {
  destroyChart()
})

// ✅ 监听数据变化，安全更新图表
watch(
  () => props.data,
  (newData) => {
    if (chart && newData) {
      if (!canvas.value || !canvas.value.isConnected) {
        destroyChart()
        return
      }
      // ✅ 不直接赋值，而是更新数据集
      const newDatasets = newData.datasets.map(dataset => ({
        ...dataset,
        data: [...dataset.data]
      }))
      
      chart.data.datasets = newDatasets
      chart.data.labels = [...newData.labels]
      chart.update()
    }
  },
  { deep: true }
)

// ✅ 监听暗色模式变化
watch(
  () => darkMode.value,
  () => {
    if (chart) {
      if (!canvas.value || !canvas.value.isConnected) {
        destroyChart()
        return
      }
      // 更新颜色配置
      chart.options.scales.y.grid.color = darkMode.value ? gridColor.dark : gridColor.light
      chart.update()
    }
  }
)
</script>

<style scoped>
.bar-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>