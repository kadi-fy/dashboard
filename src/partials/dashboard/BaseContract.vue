<template>
  <div class="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-xs rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer" @click="handleBarClick">
    
    <!-- 头部：使用加载后的 unitData (当前月快照) -->
    <div class="px-5 pt-5 pb-2 flex justify-between items-start">
      <div class="flex-1">
        <header class="mb-2">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">净合同</h2>
        </header>
        <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">{{currentSnapshot?.org_name}}</div>
        <div class="flex items-start">
          <div class="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
            {{ currentSnapshot?.contract_total}}万元
          </div>
        </div>
      </div>

      <!-- 圆环图：使用当前月的完成率 -->
      <div class="flex space-x-2 ml-4">
        <DoughnutChart 
          :value="completionRate"
          :target-value="currentSnapshot.contract_plan"
          :target="100"
          :selected-month="selectedMonth"
          :color="colors"
          width="100" height="100" label="确保计划"
        />
      </div>
    </div>

    <!-- 折线图：使用加载后的序列数据 -->
    <div class="grow max-sm:max-h-[128px] xl:max-h-[128px]">
      <CardLIneChart 
        :current-values="chartCurrentValues" 
        :lastyear-values="chartLastYearValues" 
        :target-values="chartTargetValues" 
        width="389" height="128" 
      />
    </div>

    <!-- 弹窗：直接传入完整的原始数据数组 -->
    <BaseContractModal
      v-model="showModal"
      :current-year-data="fullCurrentYearData" 
      :last-year-data="fullLastYearData"
      :selected-year="selectedYear" 
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import CardLIneChart from '../../charts/CardLIneChart.vue'
import DoughnutChart from '../../charts/DoughnutChart.vue'
import BaseContractModal from '../../components/BaseContractModal.vue' 

import { GLOBAL_CONFIG } from '../../utils/Utils'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL;
const colors = ['rgba(76, 175, 80, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)'];

export default {
  name: 'CompanyTotalProfit',
  components: { CardLIneChart, DoughnutChart, BaseContractModal },
  props: {
    // 不再需要外部传入复杂的数组，只需要标识符
    orgId: { type: [Number, String], required: true }, 
    selectedYear: { type: Number, required: true },
    selectedMonth: { type: Number, required: true }
  },
  setup(props) {
    const showModal = ref(false);
    
    // 原始完整数据 (用于弹窗)
    const fullCurrentYearData = ref([]);
    const fullLastYearData = ref([]);
    
    // 加载状态
    const isLoading = ref(false);

    // 加载数据的核心函数
    const loadData = async () => {
      if (!props.orgId) return;
      isLoading.value = true;
      
      try {
        const params = new URLSearchParams({
          org_id: props.orgId,
          year: props.selectedYear,
          month: props.selectedMonth
        });

        const response = await fetch(`${API_BASE_URL}/unit-performance?${params.toString()}`);
        if (!response.ok) throw new Error('Fetch failed');
        
        const res = await response.json();
        const allData = res.data || [];

        // 【关键步骤】数据清洗与分发
        fullCurrentYearData.value = allData.filter(item => Math.floor(item.time_id / 100) === props.selectedYear);
        fullLastYearData.value = allData.filter(item => Math.floor(item.time_id / 100) === props.selectedYear - 1);
        
        // 按月份排序（确保数据按时间顺序）
        fullCurrentYearData.value.sort((a, b) => a.time_id - b.time_id);
        fullLastYearData.value.sort((a, b) => a.time_id - b.time_id);
        
      } catch (e) {
        console.error("加载数据失败", e);
        fullCurrentYearData.value = [];
        fullLastYearData.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    // 监听年份/月份变化，自动重新加载
    watch([() => props.selectedYear, () => props.selectedMonth], () => {
      loadData();
    }, { immediate: true });

    // --- 辅助函数 ---

    // 计算完成率（核心逻辑）
    const calculateCompletionRate = (currentValue, targetValue) => {
      if (!targetValue || targetValue === 0) return 0;
      const current = parseFloat(currentValue) || 0;
      const target = parseFloat(targetValue);
      const rate = (current / target) * 100;
      // 限制完成率在0-200之间，避免显示异常
      return Math.min(Math.max(rate, 0), 200);
    };

    // 获取当前月份的数据
    const getCurrentMonthData = () => {
      if (!fullCurrentYearData.value.length) return null;
      // 找到选中月份的数据
      const currentMonthData = fullCurrentYearData.value.find(item => {
        const month = item.time_id % 100;
        return month === props.selectedMonth;
      });
      // 如果找不到精确月份，返回最后一条数据
      return currentMonthData || fullCurrentYearData.value[fullCurrentYearData.value.length - 1];
    };

    // --- 计算属性：供模板使用 ---

    // 1. 当前快照 (用于显示大字数字) -> 取选中月份的数据
    const currentSnapshot = computed(() => {
      return getCurrentMonthData() || {};
    });

    // 2. 圆环图数据 - 计算完成率
    const completionRate = computed(() => {
      const snapshot = currentSnapshot.value;
      if (!snapshot) return 0;
      
      // 使用净收费合计（charge_total）与净收费计划（charge_plan）对比
      const currentValue = snapshot.contract_total || 0;
      const targetValue = snapshot.contract_plan || 0;
      
      return calculateCompletionRate(currentValue, targetValue);
    });

    // 3. 折线图数据 (提取 charge_total 数组，因为显示的是净收费合计)
    const chartCurrentValues = computed(() => 
      fullCurrentYearData.value.map(i => parseFloat(i.contract_total) || 0)
    );
    
    const chartLastYearValues = computed(() => 
      fullLastYearData.value.map(i => parseFloat(i.contract_total) || 0)
    );

    // 4. 折线图目标线（根据 charge_plan 按月累计）
    const chartTargetValues = computed(() => {
      if (fullCurrentYearData.value.length === 0) return [];
      
      // 获取当前月份的 charge_plan（净收费计划）
      const snapshot = currentSnapshot.value;
      const annualPlan = snapshot.contract_plan || 0;
      
      if (annualPlan === 0) return new Array(fullCurrentYearData.value.length).fill(0);
      
      // 按月累计计算目标值
      return fullCurrentYearData.value.map((_, idx) => {
        // 按月平均分配年度计划
        const monthlyTarget = annualPlan / 12;
        // 累计到当前月份的目标值
        const cumulativeTarget = monthlyTarget * (idx + 1);
        return Math.round(cumulativeTarget * 100) / 100; // 保留两位小数
      });
    });

    // 5. 新增：月度完成率数据（用于可能的其他展示）
    const monthlyCompletionRates = computed(() => {
      return fullCurrentYearData.value.map(item => {
        const currentValue = item.contract_total || 0;
        const targetValue = item.contract_plan || 0;
        return calculateCompletionRate(currentValue, targetValue);
      });
    });

    const handleBarClick = () => {
      // 数据已加载，直接打开弹窗
      showModal.value = true;
    };

    return {
      showModal,
      currentSnapshot,
      fullCurrentYearData,
      fullLastYearData,
      completionRate,
      chartCurrentValues,
      chartLastYearValues,
      chartTargetValues,
      monthlyCompletionRates,
      colors,
      handleBarClick,
    };
  }
};
</script>

<style scoped>
/* 添加一些样式优化 */
</style>