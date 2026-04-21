<template>
  <div class="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-md rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer" @click="handleBarClick">
    
    <!-- 头部：使用加载后的 unitData (当前月快照) -->
    <div class="px-4 pt-4 pb-3 flex justify-between items-start gap-3">
      <div class="flex-1">
        <header class="mb-1">
          <h2 class="text-base font-bold text-gray-800 dark:text-gray-100">{{ config.title }}</h2>
        </header>
        <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{{ currentSnapshot?.org_name }}</div>
        <div class="flex items-baseline gap-1.5">
          <div class="text-2xl font-bold" :class="mainValueClass">
            {{ currentSnapshot?.[config.totalField] }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400">万元</div>
        </div>
      </div>
      <div class="flex-shrink-0">
        <div
          v-if="showValueStatusBadge"
          class="status-indicator-wrap"
        >
          <DotLottieVue
            v-if="statusTrend === 'up'"
            class="status-lottie-positive"
            autoplay
            loop
            :src="positiveLottieSrc"
          />

          <DotLottieVue
            v-else-if="statusTrend === 'down'"
            class="status-lottie-negative"
            autoplay
            loop
            :src="negativeLottieSrc"
          />

          <div v-else class="status-symbol status-symbol--flat">
            <svg
              class="relative z-10"
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5.5 12H18.5" />
              <circle cx="8.2" cy="12" r="0.95" fill="currentColor" stroke="none" />
              <circle cx="15.8" cy="12" r="0.95" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>
        <div v-else class="flex items-start">
          <CyberRingProgress
            :value="completionRate"
            :max="100"
            :selected-month="selectedMonth"
            :size="94"
            :decimals="0"
            label="确保计划"
            :show-label="false"
            :show-target="true"
            :target-value="currentSnapshot[config.planField]"
          />
        </div>
      </div>
    </div>

    <!-- 折线图：1月隐藏，2月及之后平滑显示 -->
    <transition name="line-chart-fade" mode="out-in">
      <div v-show="showLineChart" class="h-[120px] overflow-hidden">
        <CardLIneChart 
          :current-values="chartCurrentValues" 
          :lastyear-values="chartLastYearValues" 
          :target-values="chartTargetValues"
          :layout-padding="0"
        />
      </div>
    </transition>

    <!-- 弹窗：直接传入完整的原始数据数组 -->
    <BaseModal
      v-model="showModal"
      :current-year-data="fullCurrentYearData" 
      :last-year-data="fullLastYearData"
      :selected-year="selectedYear"
      :modal-config="modalConfig"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import CardLIneChart from '../../charts/CardLIneChart.vue'
import CyberRingProgress from '../../charts/CyberRingProgress.vue'
import BaseModal from '../../components/BaseModal.vue'
import { GLOBAL_CONFIG } from '../../utils/Utils'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL;
const colors = ['rgba(76, 175, 80, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)'];
const unitPerfCache = new Map();
const unitPerfInFlight = new Map();

const getUnitPerfCacheKey = (orgId, year, month) => `${orgId}-${year}-${month}`;

const fetchUnitPerformance = async (orgId, year, month) => {
  const cacheKey = getUnitPerfCacheKey(orgId, year, month);
  if (unitPerfCache.has(cacheKey)) {
    return unitPerfCache.get(cacheKey);
  }

  if (unitPerfInFlight.has(cacheKey)) {
    return unitPerfInFlight.get(cacheKey);
  }

  const params = new URLSearchParams({
    org_id: orgId,
    year,
    month,
  });

  const pending = fetch(`${API_BASE_URL}/unit-performance?${params.toString()}`)
    .then((response) => {
      if (!response.ok) throw new Error('Fetch failed');
      return response.json();
    })
    .then((res) => {
      const allData = Array.isArray(res.data) ? res.data : [];
      unitPerfCache.set(cacheKey, allData);
      return allData;
    })
    .finally(() => {
      unitPerfInFlight.delete(cacheKey);
    });

  unitPerfInFlight.set(cacheKey, pending);
  return pending;
};

export default {
  name: 'BaseCard',
  components: { 
    DotLottieVue,
    CardLIneChart, 
    CyberRingProgress,
    BaseModal 
  },
  props: {
    // 指标类型: 'charge', 'contract', 'earning', 'profit_total', 'cash', 'revenue', 'new_contract'
    metricType: {
      type: String,
      required: true,
      validator: (value) => ['charge', 'contract', 'earning', 'profit_total', 'cash', 'revenue', 'new_contract'].includes(value)
    },
    orgId: { 
      type: [Number, String], 
      required: true 
    },
    selectedYear: { 
      type: Number, 
      required: true 
    },
    selectedMonth: { 
      type: Number, 
      required: true 
    },
    modalChartType: {
      type: String,
      default: '',
      validator: (value) => ['', 'bar', 'line'].includes(value),
    }
  },
  setup(props) {
    const showModal = ref(false);
    
    // 原始完整数据 (用于弹窗)
    const fullCurrentYearData = ref([]);
    const fullLastYearData = ref([]);
    
    // 加载状态
    const isLoading = ref(false);

    // 根据指标类型获取配置
    const config = computed(() => {
      const configs = {
        charge: {
          title: '净收费',
          totalField: 'charge_total',
          planField: 'charge_plan',
          hasTarget: true,
          dataField: 'charge_total',
          modalTitle: '净收费合计趋势（万元）',
          chartLabel: '净收费合计',
          targetLabel: '年度目标 (净收费合计)',
          actualLabel: '实际完成 (净收费合计)',
          lastYearLabel: '上一年同期完成 (净收费合计)'
        },
        contract: {
          title: '净合同',
          totalField: 'contract_total',
          planField: 'contract_plan',
          hasTarget: true,
          dataField: 'contract_total',
          modalTitle: '净合同合计趋势（万元）',
          chartLabel: '净合同合计',
          targetLabel: '年度目标 (净合同合计)',
          actualLabel: '实际完成 (净合同合计)',
          lastYearLabel: '上一年同期完成 (净合同合计)'
        },
        earning: {
          title: '收费口径利润',
          totalField: 'earning',
          planField: 'earning',
          hasTarget: false,
          dataField: 'earning',
          modalTitle: '收费口径利润趋势（万元）',
          chartLabel: '收费口径利润',
          targetLabel: '年度目标 (收费口径利润)',
          actualLabel: '实际完成 (收费口径利润)',
          lastYearLabel: '上一年同期完成 (收费口径利润)'
        },
        profit_total: {
          title: '利润总额',
          totalField: 'profit_total',
          planField: 'annual_plan_ensure_profit',
          hasTarget: true,
          dataField: 'profit_total',
          modalTitle: '利润总额趋势（万元）',
          chartLabel: '利润总额',
          targetLabel: '年度目标 (利润总额)',
          actualLabel: '实际完成 (利润总额)',
          lastYearLabel: '上一年同期完成 (利润总额)'
        },
        cash: {
          title: '经营性现金流',
          totalField: 'cash',
          planField: 'cash',
          hasTarget: false,
          dataField: 'cash',
          modalTitle: '经营性现金流趋势（万元）',
          chartLabel: '经营性现金流',
          targetLabel: '年度目标 (经营性现金流)',
          actualLabel: '实际完成 (经营性现金流)',
          lastYearLabel: '上一年同期完成 (经营性现金流)'
        },
        revenue: {
          title: '营业收入',
          totalField: 'revenue_total',
          planField: 'annual_plan_ensure_revenue',
          hasTarget: true,
          dataField: 'revenue_total',
          modalTitle: '营业收入趋势（万元）',
          chartLabel: '营业收入',
          targetLabel: '年度目标 (营业收入)',
          actualLabel: '实际完成 (营业收入)',
          lastYearLabel: '上一年同期完成 (营业收入)'
        },
        new_contract: {
          title: '新签合同',
          totalField: 'new_contract_amount',
          planField: 'annual_plan_ensure_contract',
          hasTarget: true,
          dataField: 'new_contract_amount',
          modalTitle: '新签合同趋势（万元）',
          chartLabel: '新签合同',
          targetLabel: '年度目标 (新签合同)',
          actualLabel: '实际完成 (新签合同)',
          lastYearLabel: '上一年同期完成 (新签合同)'
        }
      };
      return configs[props.metricType];
    });

    // 弹窗配置
    const modalConfig = computed(() => ({
      title: config.value.modalTitle,
      targetLabel: config.value.targetLabel,
      actualLabel: config.value.actualLabel,
      lastYearLabel: config.value.lastYearLabel,
      showTarget: config.value.hasTarget !== false,
      dataField: config.value.dataField,
      planField: config.value.planField,
      chartType: props.modalChartType || (props.metricType === 'earning' ? 'line' : 'bar'),
    }));

    // 加载数据的核心函数
    const loadData = async () => {
      if (!props.orgId) return;
      isLoading.value = true;
      
      try {
        const allData = await fetchUnitPerformance(props.orgId, props.selectedYear, props.selectedMonth);

        // 数据清洗与分发
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

    const showValueStatusBadge = computed(() => ['earning', 'cash'].includes(props.metricType));

    const statusValue = computed(() => {
      const snapshot = currentSnapshot.value;
      return parseFloat(snapshot?.[config.value.totalField]) || 0;
    });

    const statusTrend = computed(() => {
      if (statusValue.value > 0) return 'up';
      if (statusValue.value < 0) return 'down';
      return 'flat';
    });

    const positiveLottieSrc = '/lottie/wired-gradient-3378-arrows-up-loop-cycle.json';
    const negativeLottieSrc = '/lottie/wired-gradient-3379-arrows-down-loop-cycle.json';

    const mainValueClass = computed(() => {
      const shouldWarnNegative = ['earning', 'cash'].includes(props.metricType) && statusValue.value < 0;
      if (shouldWarnNegative) {
        return 'text-rose-600 dark:text-rose-400';
      }
      return 'text-gray-900 dark:text-white';
    });

    // 2. 圆环图数据 - 计算完成率
    const completionRate = computed(() => {
      if (!config.value.hasTarget) return 0;
      const snapshot = currentSnapshot.value;
      if (!snapshot) return 0;
      
      const currentValue = snapshot[config.value.totalField] || 0;
      const targetValue = snapshot[config.value.planField] || 0;
      
      return calculateCompletionRate(currentValue, targetValue);
    });

    // 3. 折线图数据 (提取对应的合计数组)
    const chartCurrentValues = computed(() => 
      fullCurrentYearData.value.map(i => parseFloat(i[config.value.dataField]) || 0)
    );
    
    const chartLastYearValues = computed(() => 
      fullLastYearData.value.map(i => parseFloat(i[config.value.dataField]) || 0)
    );

    // 4. 折线图目标线（按月累计）
    const chartTargetValues = computed(() => {
      if (!config.value.hasTarget) return [];
      if (fullCurrentYearData.value.length === 0) return [];
      
      const snapshot = currentSnapshot.value;
      const annualPlan = snapshot[config.value.planField] || 0;
      
      if (annualPlan === 0) return new Array(fullCurrentYearData.value.length).fill(0);
      
      // 按月累计计算目标值
      return fullCurrentYearData.value.map((_, idx) => {
        const monthlyTarget = annualPlan / 12;
        const cumulativeTarget = monthlyTarget * (idx + 1);
        return Math.round(cumulativeTarget * 100) / 100;
      });
    });

    // 5. 月度完成率数据
    const monthlyCompletionRates = computed(() => {
      return fullCurrentYearData.value.map(item => {
        const currentValue = item[config.value.totalField] || 0;
        const targetValue = item[config.value.planField] || 0;
        return calculateCompletionRate(currentValue, targetValue);
      });
    });

    const showLineChart = computed(() => props.selectedMonth > 1);

    const handleBarClick = () => {
      showModal.value = true;
    };

    return {
      showModal,
      currentSnapshot,
      fullCurrentYearData,
      fullLastYearData,
      completionRate,
      showValueStatusBadge,
      statusTrend,
      positiveLottieSrc,
      negativeLottieSrc,
      mainValueClass,
      showLineChart,
      chartCurrentValues,
      chartLastYearValues,
      chartTargetValues,
      monthlyCompletionRates,
      config,
      modalConfig,
      colors,
      handleBarClick,
    };
  }
};
</script>

<style scoped>
.status-indicator-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 110px;
}

.status-lottie-positive {
  width: 150px;
  height: auto;
  aspect-ratio: 13 / 6;
  filter: drop-shadow(0 8px 16px rgba(8, 168, 138, 0.14));
}

.status-lottie-negative {
  width: 150px;
  height: auto;
  aspect-ratio: 13 / 6;
  filter: drop-shadow(0 8px 16px rgba(244, 63, 94, 0.14));
}

.status-symbol {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 74px;
  border-radius: 9999px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.16),
    0 12px 22px rgba(15, 23, 42, 0.14);
}

.status-symbol--down {
  color: #ffffff;
  background: linear-gradient(145deg, rgba(244,63,94,0.84), rgba(249,115,22,0.72));
}

.status-symbol--flat {
  color: rgba(255,255,255,0.92);
  background: linear-gradient(145deg, rgba(100,116,139,0.82), rgba(71,85,105,0.72));
}

@media (prefers-color-scheme: dark) {
  .status-lottie-positive {
    filter: drop-shadow(0 0 18px rgba(8, 168, 138, 0.2));
  }

  .status-lottie-negative {
    filter: drop-shadow(0 0 18px rgba(244, 63, 94, 0.22));
  }
}

.line-chart-fade-enter-active,
.line-chart-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease, max-height 0.35s ease;
  overflow: hidden;
}

.line-chart-fade-enter-from,
.line-chart-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
  max-height: 0;
}

.line-chart-fade-enter-to,
.line-chart-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 120px;
}
</style>