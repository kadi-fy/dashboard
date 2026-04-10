<template>
  <div class="grow relative">
    <canvas ref="canvas" :width="width" :height="height"></canvas>
    
    <!-- 暂无数据提示 -->
    <div 
      v-if="isEmptyData" 
      class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
    >
      <div class="text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="1.5" 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 text-base font-medium">暂无数据</p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">当前月份暂无相关数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
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
  selectedYear: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['barClick'])

const canvas = ref(null)
let chart = null
const darkMode = useDark()
const { gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = getChartColors()

// 创建数据的深拷贝，避免直接修改 props
const chartData = computed(() => {
  if (!props.data) return null
  
  // 创建一个新的数据对象，而不是直接使用 props.data
  return {
    labels: [...(props.data.labels || [])],
    datasets: props.data.datasets.map(dataset => ({
      ...dataset,
      data: [...(dataset.data || [])],
      actualValues: dataset.actualValues ? [...dataset.actualValues] : []
    }))
  }
})

// 判定数据是否为空
const isEmptyData = computed(() => {
  if (!props.data || !props.data.datasets || props.data.datasets.length === 0) {
    return true
  }
  
  const hasValidData = props.data.datasets.some(dataset => {
    if (!dataset.data || dataset.data.length === 0) {
      return false
    }
    
    return dataset.data.some(value => {
      if (value === null || value === undefined || isNaN(value)) {
        return false
      }
      const numValue = parseFloat(value)
      return !isNaN(numValue) && numValue !== 0
    })
  })
  
  return !hasValidData
})

// 创建或更新图表的函数
const createOrUpdateChart = () => {
  if (!canvas.value) return
  
  const ctx = canvas.value.getContext('2d')
  const dataToUse = chartData.value
  
  if (!dataToUse || isEmptyData.value) {
    if (chart) {
      chart.destroy()
      chart = null
    }
    return
  }
  
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
          callback: (value) => `${(value * 100).toFixed(0)}%`,
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
        display: false,
      },
      tooltip: {
        enabled: !isEmptyData.value,
        mode: 'index',
        intersect: false,
        backgroundColor: '#1f2937',
        titleColor: '#000' ,
        bodyColor: '#d1d5db' ,
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const dataset = context.dataset;
            const actual = dataset.actualValues?.[context.dataIndex];
            const value = context.parsed.y;
            const rate = (value * 100).toFixed(1);
            
            if (actual !== undefined) {
              return [
                `${dataset.label}: ${actual}万元`,
                `完成率: ${rate}%`
              ];
            }
            return [
              `${dataset.label}: ${formatValue(value)}`,
              `完成率: ${rate}%`
            ];
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
      if (isEmptyData.value) return
      if (elements.length > 0) {
        const index = elements[0].index;
        emit('barClick', { index });
      }
    }
  };

  const mergedOptions = { ...baseOptions, ...props.options };
  
  if (chart) {
    // 更新现有图表
    chart.data = dataToUse
    chart.update()
  } else {
    // 创建新图表
    chart = new Chart(ctx, {
      type: 'bar',
      data: dataToUse,
      options: mergedOptions,
      plugins: [...(props.plugins || [])],
    });
  }
}

onMounted(() => {
  createOrUpdateChart()
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
    chart = null
  }
})

// 监听数据变化
watch(
  [chartData, () => props.selectedYear, darkMode],
  () => {
    createOrUpdateChart()
  },
  { deep: true }
)

// 监听选项变化
watch(
  () => props.options,
  () => {
    if (chart && !isEmptyData.value) {
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
              callback: (value) => `${(value * 100).toFixed(0)}%`,
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
            position: 'top' 
          },
          tooltip: {
            enabled: true,
            callbacks: {
              title: () => false,
              label: (context) => {
                const dataset = context.dataset;
                const actual = dataset.actualValues?.[context.dataIndex];
                if (actual !== undefined) {
                  return `${dataset.label}: ${actual}万元`;
                }
                return `${dataset.label}: ${formatValue(context.parsed.x)}`;
              },
              footer: (tooltipItems) => {
                const value = tooltipItems[0]?.parsed?.x;
                if (value === undefined || value === null) return []
                return [`完成率: ${(value * 100).toFixed(1)}%`];
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
      chart.options = mergedOptions
      chart.update()
    }
  },
  { deep: true }
)
</script>

<style scoped>
canvas {
  transition: opacity 0.3s ease;
}
</style>