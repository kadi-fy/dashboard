<template>
  <div class="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-md rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"  @click="handleBarClick">
    <!-- 头部区域：标题 + 两个圆环图 -->
    <div class="px-5 pt-5 pb-3 flex justify-between items-start gap-3">
      <div class="flex-1 min-w-0">
        <header class="mb-2">
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">营业收入</h2>
        </header>
        <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">公司整体</div>
        <div class="flex items-baseline gap-1.5">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ companyData?.revenue_total ? `${companyData.revenue_total}` : '--' }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">万元</div>
        </div>
      </div>

      <!-- 右侧：两个圆环图 -->
      <div class="flex gap-3 flex-shrink-0">
        <DoughnutChart 
          :value= "groupCompletionRate"
          :target-value="annualGroupTarget"
          :target="100"
          :selected-month="selectedMonth"
          :color="['rgba(76, 175, 80, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)']"
          width="100"
          height="100"
          label="集团"
        />
        <DoughnutChart 
          :value="internalCompletionRate"
          :target-value="annualInternalTarget"
          :target="100"
          :selected-month="selectedMonth"
          :color="['rgba(76, 175, 80, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)']"
          width="100"
          height="100"
          label="内部"
        />
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="h-[130px] overflow-hidden">
      <LineChart :current-values="currentValues" :lastyear-values="lastYearValues" :target-values="targetValues" :layout-padding="0" />
    </div>
    <CompanyRevenueModal
    v-model="showModal"
    :company-detail="companyDetail" :selected-year="selectedYear" 
    />
  </div>
</template>

<script>
import { ref,computed } from 'vue'
import { chartAreaGradient } from '../../charts/ChartjsConfig'
import LineChart from '../../charts/LineChart01.vue'
import DoughnutChart from '../../charts/DoughnutChart.vue'
import CompanyRevenueModal from '../../components/CompanyRevenueModal.vue' 
// Import utilities
import { adjustColorOpacity, getCssVariable,GLOBAL_CONFIG } from '../../utils/Utils'
const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL;

export default {
  name: '公司营业收入',
  components: {
    LineChart,
    DoughnutChart,
    CompanyRevenueModal
  },
  // 1. 定义 props
  props: {
    companyData: {
      type: Object,
      default: () => ({}) // 默认值设为空对象，防止报错
    },
    currentyearData: { type: Array, default: () => [] }, 
    lastyearData: { type: Array, default: () => [] },
    selectedYear: { // 👈 接收月份
      type: Number,
      required: true
    },
    selectedMonth: { // 👈 接收月份
      type: Number,
      required: true
    }

  },
  setup(props) { // 2. 接收 props 参数
    const showModal = ref(false);
    const companyDetail = ref([]); 
    const currentValues = computed(() => {
      return Array.isArray(props.currentyearData)
        ? props.currentyearData.map(item => item?.revenue_total ?? 0)
        : []
    })

    const lastYearValues = computed(() => {
      return Array.isArray(props.lastyearData)
        ? props.lastyearData.map(item => item?.revenue_total ?? 0)
        : []
    })

    const annualInternalTarget = computed(() => {
      if (!props.currentyearData || props.currentyearData.length === 0) return 0;
      return props.currentyearData[0]?.annual_plan_internal_revenue || 0;
    });
    const annualGroupTarget = computed(() => {
      if (!props.currentyearData || props.currentyearData.length === 0) return 0;
      return props.currentyearData[0]?.annual_plan_group_revenue || 0;
    });

    const targetValues = computed(() => {
      const count = props.currentyearData ? props.currentyearData.length : 0;
      if (count === 0) return [];

      const total = annualGroupTarget.value; // 或者你可以传两个数组，分别给集团和内部
      
      return Array.from({ length: count }, (_, index) => {
        const monthIndex = index + 1; // 1 到 12
        // 计算累计目标：总额 * (当前月份 / 12)
        // 保留两位小数
        return Number((total * (monthIndex / 12)).toFixed(0));
      });
    });

    const groupCompletionRate = computed(() => {
      return Number(props.companyData?.revenue_group_completion)*100 || 0
    })

    const internalCompletionRate = computed(() => {
      return Number(props.companyData?.revenue_internal_completion)*100 || 0 // 假设字段名
    })
    const handleBarClick = async () => {
      try {
        const params = `year=${props.selectedYear}&month=${props.selectedMonth}`;
        const response = await fetch(`${API_BASE_URL}/company-lastyear?${params}`);
        if (!response.ok) throw new Error('请求失败');
        const data = await response.json();
        companyDetail.value = data.data; // ✅ 赋值给 ref
        showModal.value = true;            // ✅ 打开弹窗
      } catch (error) {
        console.error('获取公司详情失败:', error);
        // 可选：显示错误提示
      }
    };
    return {
      currentValues,
      lastYearValues,
      targetValues,
      annualInternalTarget,
      annualGroupTarget,
      groupCompletionRate,
      internalCompletionRate,
      showModal,          // ✅ 4. 必须返回给模板使用
      companyDetail,      // ✅ 4. 必须返回
      handleBarClick      // ✅ 4. 必须返回，否则 @click 无效
    } 
  }
}
</script>