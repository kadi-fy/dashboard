<template>
  <div class="flex items-center justify-center space-x-4 sm:space-x-6 h-full overflow-hidden relative">
    <div class="flex items-center flex-1 min-w-0 group" @mouseenter="pauseMarquee('decline')" @mouseleave="resumeMarquee('decline')">
      <div class="flex flex-col items-center flex-shrink-0 hidden xl:flex mr-3">
        <span class="text-[10px] font-bold text-orange-500 uppercase tracking-wide">同比下滑</span>
        <span v-if="declineIssues.length > 0" class="mt-0.5 px-2 py-0.5 text-[10px] font-bold leading-none rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50 shadow-sm">
          {{ declineIssues.length }}
        </span>
      </div>
      <div class="marquee-container relative h-8 overflow-hidden w-full">
        <div class="marquee-content absolute whitespace-nowrap flex items-center" :style="{ animationDuration: declineDuration + 's', animationPlayState: declinePaused ? 'paused' : 'running' }">
          <span class="inline-flex items-center space-x-4 pr-4">
            <template v-if="declineIssues.length > 0">
              <span v-for="(issue, index) in declineIssues" :key="'dec-' + index" ref="declineRefs" class="group/item cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" @mouseenter="handleEnter('decline', issue, $event)" @mouseleave="handleLeave" @click="handleClick(issue)">
                <span class="text-xs text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center">
                  <span class="font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                  <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                  <span class="truncate mr-1 hidden sm:inline">{{ issue.metric }}</span>
                  <span class="text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-[10px] border border-orange-100 dark:border-orange-900/30">{{ issue.decline_percent }}</span>
                </span>
              </span>
            </template>
            <span v-else class="text-xs text-gray-400 pl-2">暂无下滑数据</span>
          </span>
          <span class="inline-flex items-center space-x-4 pr-4" aria-hidden="true">
            <template v-if="declineIssues.length > 0">
              <span v-for="(issue, index) in declineIssues" :key="'dec-dup-' + index" class="inline-flex items-center px-1.5 py-0.5 rounded">
                <span class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                <span class="text-xs text-gray-500 truncate mr-1 hidden sm:inline">{{ issue.metric }}</span>
                <span class="text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-[10px] border border-orange-100 dark:border-orange-900/30">{{ issue.decline_percent }}</span>
              </span>
            </template>
          </span>
        </div>
      </div>
    </div>

    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

    <div class="flex items-center flex-1 min-w-0 group" @mouseenter="pauseMarquee('behind')" @mouseleave="resumeMarquee('behind')">
      <div class="flex flex-col items-center flex-shrink-0 hidden xl:flex mr-3">
        <span class="text-[10px] font-bold text-red-500 uppercase tracking-wide">进度滞后</span>
        <span v-if="behindIssues.length > 0" class="mt-0.5 px-2 py-0.5 text-[10px] font-bold leading-none rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50 shadow-sm">
          {{ behindIssues.length }}
        </span>
      </div>
      <div class="marquee-container relative h-8 overflow-hidden w-full">
        <div class="marquee-content absolute whitespace-nowrap flex items-center" :style="{ animationDuration: behindDuration + 's', animationPlayState: behindPaused ? 'paused' : 'running' }">
          <span class="inline-flex items-center space-x-4 pr-4">
            <template v-if="behindIssues.length > 0">
              <span v-for="(issue, index) in behindIssues" :key="'beh-' + index" ref="behindRefs" class="group/item cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" @mouseenter="handleEnter('behind', issue, $event)" @mouseleave="handleLeave" @click="handleClick(issue)">
                <span class="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center">
                  <span class="font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                  <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                  <span class="truncate mr-1 hidden sm:inline">{{ issue.metric }}</span>
                  <span class="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded text-[10px] border border-red-100 dark:border-red-900/30">{{ issue.completion_rate }}</span>
                </span>
              </span>
            </template>
            <span v-else class="text-xs text-gray-400 pl-2">无滞后数据</span>
          </span>
          <span class="inline-flex items-center space-x-4 pr-4" aria-hidden="true">
            <template v-if="behindIssues.length > 0">
              <span v-for="(issue, index) in behindIssues" :key="'beh-dup-' + index" class="inline-flex items-center px-1.5 py-0.5 rounded">
                <span class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                <span class="text-xs text-gray-500 truncate mr-1 hidden sm:inline">{{ issue.metric }}</span>
                <span class="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded text-[10px] border border-red-100 dark:border-red-900/30">{{ issue.completion_rate }}</span>
              </span>
            </template>
          </span>
        </div>
      </div>
    </div>

    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

    <div class="flex items-center flex-1 min-w-0 group" @mouseenter="pauseMarquee('negative')" @mouseleave="resumeMarquee('negative')">
      <div class="flex flex-col items-center flex-shrink-0 hidden xl:flex mr-3">
        <span class="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">利润亏损</span>
        <span v-if="negativeIssues.length > 0" class="mt-0.5 px-2 py-0.5 text-[10px] font-bold leading-none rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 shadow-sm">
          {{ negativeIssues.length }}
        </span>
      </div>
      <div class="marquee-container relative h-8 overflow-hidden w-full">
        <div class="marquee-content absolute whitespace-nowrap flex items-center" :style="{ animationDuration: negativeDuration + 's', animationPlayState: negativePaused ? 'paused' : 'running' }">
          <span class="inline-flex items-center space-x-4 pr-4">
            <template v-if="negativeIssues.length > 0">
              <span v-for="(issue, index) in negativeIssues" :key="'neg-' + index" ref="negativeRefs" class="group/item cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" @mouseenter="handleEnter('negative', issue, $event)" @mouseleave="handleLeave" @click="handleClick(issue)">
                <span class="text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center">
                  <span class="font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                  <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                  <span class="truncate mr-1 hidden sm:inline font-medium text-purple-700 dark:text-purple-300">
                    {{ issue.org_type === 'department' ? '部门利润' : '企业利润总额' }}
                  </span>
                  <span class="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded text-[10px] border border-purple-100 dark:border-purple-900/30">
                    {{ issue.profit_formatted }}
                  </span>
                </span>
              </span>
            </template>
            <span v-else class="text-xs text-gray-400 pl-2">无亏损数据</span>
          </span>

          <span class="inline-flex items-center space-x-4 pr-4" aria-hidden="true">
            <template v-if="negativeIssues.length > 0">
              <span v-for="(issue, index) in negativeIssues" :key="'neg-dup-' + index" class="inline-flex items-center px-1.5 py-0.5 rounded">
                <span class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                <span class="text-xs truncate mr-1 hidden sm:inline font-medium text-purple-700 dark:text-purple-300">
                   {{ issue.org_type === 'department' ? '部门利润' : '企业利润总额' }}
                </span>
                <span class="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded text-[10px] border border-purple-100 dark:border-purple-900/30">{{ issue.profit_formatted }}</span>
              </span>
            </template>
          </span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="tooltip.visible" class="fixed z-[100] w-80 pointer-events-none transition-opacity duration-200" :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }" style="transform: translate(-50%, 0);">
        <div class="mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border p-4 relative" :class="getTooltipBorderClass(tooltip.type)">
          <div class="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-white/95 dark:bg-gray-800/95 rotate-45" :class="getTooltipBorderClass(tooltip.type, true)" style="border-left: 1px solid; border-top: 1px solid;"></div>

          <div class="relative z-10">
            <div class="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <h4 class="text-sm font-bold text-gray-800 dark:text-white truncate pr-2">{{ tooltip.data?.org_name }}</h4>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" :class="getTooltipBadgeClass(tooltip.type)">
                {{ getTooltipLabel(tooltip.type) }}
              </span>
            </div>

            <div class="space-y-2.5">
              <div class="flex justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">指标</span>
                <span class="font-medium text-gray-700 dark:text-gray-200 text-right">{{ tooltip.data?.metric }}</span>
              </div>

              <template v-if="tooltip.type === 'decline'">
                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg text-center">
                    <div class="text-[10px] text-gray-400 mb-1">去年同期</div>
                    <div class="text-xs font-semibold text-gray-600 dark:text-gray-300">{{ formatNumber(tooltip.data?.last_year_value) }}</div>
                  </div>
                  <div class="bg-orange-50 dark:bg-orange-900/10 p-2 rounded-lg text-center border border-orange-100 dark:border-orange-900/20">
                    <div class="text-[10px] text-orange-500 mb-1">本期数值</div>
                    <div class="text-xs font-bold text-orange-600 dark:text-orange-400">{{ formatNumber(tooltip.data?.current_value) }}</div>
                  </div>
                </div>
                <div class="flex justify-between items-center pt-2 mt-1 border-t border-gray-100 dark:border-gray-700">
                  <span class="text-[10px] text-gray-400">下降幅度</span>
                  <span class="text-base font-bold text-orange-600 dark:text-orange-400">{{ tooltip.data?.decline_percent }}</span>
                </div>
              </template>

              <template v-if="tooltip.type === 'behind'">
                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg text-center">
                    <div class="text-[10px] text-gray-400 mb-1">目标值</div>
                    <div class="text-xs font-semibold text-gray-600 dark:text-gray-300">{{ formatNumber(tooltip.data?.expected_min) }}</div>
                  </div>
                  <div class="bg-red-50 dark:bg-red-900/10 p-2 rounded-lg text-center border border-red-100 dark:border-red-900/20">
                    <div class="text-[10px] text-red-500 mb-1">完成值</div>
                    <div class="text-xs font-bold text-red-600 dark:text-red-400">{{ formatNumber(tooltip.data?.current_value) }}</div>
                  </div>
                </div>
                <div class="flex justify-between items-center pt-2 mt-1 border-t border-gray-100 dark:border-gray-700">
                  <span class="text-[10px] text-gray-400">缺口 / 完成率</span>
                  <div class="flex items-center space-x-1.5">
                    <span class="text-xs font-bold text-red-600 dark:text-red-400">{{ formatNumber(tooltip.data?.gap_amount) }}</span>
                    <span class="text-[10px] text-gray-300 dark:text-gray-600 font-medium">/</span>
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{{ tooltip.data?.completion_rate }}</span>
                  </div>
                </div>
              </template>

              <template v-if="tooltip.type === 'negative'">
                <div class="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg text-center border border-purple-100 dark:border-purple-900/20">
                  <div class="text-[10px] text-purple-600 dark:text-purple-400 mb-1 font-bold uppercase">
                    {{ tooltip.data?.org_type === 'department' ? '当前部门利润' : '当前企业利润总额' }}
                  </div>
                  <div class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ formatNumber(tooltip.data?.profit_value) }}</div>
                  <div class="text-[10px] text-purple-500/80 mt-1">低于盈亏平衡点</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-pop">
        <div
          v-if="detailModal.visible"
          class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
          @click.self="closeIssueModal"
        >
          <div class="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-white/20 dark:border-gray-700">
            <div class="px-6 py-4 bg-gradient-to-r text-white" :class="getModalHeaderClass(detailModal.type)">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h3 class="text-lg font-bold tracking-wide">{{ getTooltipLabel(detailModal.type) }}详情</h3>
                  <p class="text-xs text-white/85 mt-1">共 {{ modalIssues.length }} 条，列表直出全部告警明细</p>
                </div>
                <button
                  type="button"
                  class="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  @click="closeIssueModal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="p-4 md:p-5 bg-gray-50/60 dark:bg-gray-900/20">
              <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm h-[70vh] overflow-y-auto p-3 md:p-4 space-y-3">
                <template v-if="modalIssues.length">
                  <div
                    v-for="(item, idx) in modalIssues"
                    :key="`issue-${detailModal.type}-${idx}`"
                    class="rounded-xl border bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm"
                    :class="getMetricChipClass(detailModal.type)"
                  >
                    <div class="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] px-2 py-0.5 rounded-full border border-current/20">#{{ idx + 1 }}</span>
                          <h4 class="text-base font-bold text-gray-800 dark:text-gray-100">{{ item.org_name }}</h4>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ item.metric }}</p>
                      </div>
                      <span class="text-xs px-2.5 py-1 rounded-full border bg-white/70 dark:bg-gray-900/40" :class="getMetricChipClass(detailModal.type)">
                        {{ getIssueMainValue(item, detailModal.type) }}
                      </span>
                    </div>

                    <div v-if="detailModal.type === 'decline'" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">去年同期</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ formatNumber(item.last_year_value) }}</div>
                      </div>
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">本期数值</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ formatNumber(item.current_value) }}</div>
                      </div>
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">下降幅度</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ item.decline_percent }}</div>
                      </div>
                    </div>

                    <div v-else-if="detailModal.type === 'behind'" class="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">目标值</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ formatNumber(item.expected_min) }}</div>
                      </div>
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">完成值</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ formatNumber(item.current_value) }}</div>
                      </div>
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">缺口</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ formatNumber(item.gap_amount) }}</div>
                      </div>
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">完成率</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ item.completion_rate }}</div>
                      </div>
                    </div>

                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">利润类型</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ item.org_type === 'department' ? '当前部门利润' : '当前企业利润总额' }}</div>
                      </div>
                      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
                        <div class="text-[11px] text-gray-500">利润值</div>
                        <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mt-1">{{ formatNumber(item.profit_value) }}</div>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-else class="h-full flex items-center justify-center text-sm text-gray-400">暂无可展示的预警详情</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { GLOBAL_CONFIG } from '../utils/Utils.js'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL

export default {
  name: 'WarningBroadcast',
  setup() {
    const rawData = ref(null)

    const declineRefs = ref([])
    const behindRefs = ref([])
    const negativeRefs = ref([])

    const tooltip = ref({ visible: false, type: null, data: null, x: 0, y: 0 })
    const detailModal = ref({ visible: false, type: null, issue: null })

    const declinePaused = ref(false)
    const behindPaused = ref(false)
    const negativePaused = ref(false)

    const declineDuration = ref(20)
    const behindDuration = ref(20)
    const negativeDuration = ref(20)

    const formatNumber = (val) => {
      if (val === undefined || val === null) return '-'
      if (typeof val === 'string' && val.includes('%')) return val
      const num = parseFloat(val)
      if (isNaN(num)) return val
      const prefix = num < 0 ? '-' : ''
      const absNum = Math.abs(num)
      const formatted = absNum.toFixed(1)
      return `${prefix}${formatted}万元`
    }

    const calculatePosition = (element) => {
      if (!element) return { x: 0, y: 0 }
      const rect = element.getBoundingClientRect()
      const tooltipWidth = 320
      const offset = 12
      let x = rect.left + (rect.width / 2)
      if (x - (tooltipWidth / 2) < 10) x = 10 + (tooltipWidth / 2)
      else if (x + (tooltipWidth / 2) > window.innerWidth - 10) x = window.innerWidth - 10 - (tooltipWidth / 2)
      const y = rect.bottom + offset
      return { x, y }
    }

    const handleEnter = (type, data, event) => {
      if (type === 'decline') declinePaused.value = true
      else if (type === 'behind') behindPaused.value = true
      else if (type === 'negative') negativePaused.value = true

      const target = event.currentTarget
      const { x, y } = calculatePosition(target)
      tooltip.value = { visible: true, type, data, x, y }
    }

    const handleLeave = () => {
      tooltip.value.visible = false
      if (tooltip.value.type === 'decline') declinePaused.value = false
      else if (tooltip.value.type === 'behind') behindPaused.value = false
      else if (tooltip.value.type === 'negative') negativePaused.value = false

      tooltip.value.type = null
      tooltip.value.data = null
    }

    const closeIssueModal = () => {
      detailModal.value = { visible: false, type: null, issue: null }
    }

    const handleClick = (issue) => {
      handleLeave()
      detailModal.value = {
        visible: true,
        type: issue.type,
        issue,
      }
    }

    const getTooltipLabel = (type) => {
      if (type === 'decline') return '同比下滑'
      if (type === 'behind') return '进度滞后'
      if (type === 'negative') return '利润亏损'
      return ''
    }

    const getTooltipBadgeClass = (type) => {
      const base = 'text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap '
      if (type === 'decline') return base + 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
      if (type === 'behind') return base + 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      if (type === 'negative') return base + 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
      return base
    }

    const getTooltipBorderClass = (type, isArrow = false) => {
      if (isArrow) {
        if (type === 'decline') return 'border-orange-200 dark:border-orange-800/50 bg-orange-50/95 dark:bg-orange-900/95'
        if (type === 'behind') return 'border-red-200 dark:border-red-800/50 bg-red-50/95 dark:bg-red-900/95'
        if (type === 'negative') return 'border-purple-200 dark:border-purple-800/50 bg-purple-50/95 dark:bg-purple-900/95'
      } else {
        if (type === 'decline') return 'border-orange-200 dark:border-orange-700'
        if (type === 'behind') return 'border-red-200 dark:border-red-700'
        if (type === 'negative') return 'border-purple-200 dark:border-purple-700'
      }
      return 'border-gray-200 dark:border-gray-600'
    }

    const getIssuesByType = (type) => {
      if (type === 'decline') return declineIssues.value
      if (type === 'behind') return behindIssues.value
      if (type === 'negative') return negativeIssues.value
      return []
    }

    const modalIssues = computed(() => getIssuesByType(detailModal.value.type))

    const getModalHeaderClass = (type) => {
      if (type === 'decline') return 'from-orange-500 to-amber-500'
      if (type === 'behind') return 'from-red-500 to-rose-500'
      if (type === 'negative') return 'from-purple-600 to-fuchsia-500'
      return 'from-gray-600 to-gray-500'
    }

    const getMetricChipClass = (type) => {
      if (type === 'decline') return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/40'
      if (type === 'behind') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40'
      if (type === 'negative') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/40'
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
    }

    const getIssueMainValue = (issue, type) => {
      if (!issue) return '--'
      if (type === 'decline') return issue.decline_percent || '--'
      if (type === 'behind') return issue.completion_rate || '--'
      if (type === 'negative') return issue.profit_formatted || formatNumber(issue.profit_value)
      return '--'
    }

    const declineIssues = computed(() => {
      if (!rawData.value?.issues?.yoy_decline) return []
      const issues = []
      const levels = ['company', 'department_total', 'department', 'unit']
      const typeOrder = { company: 0, department_total: 1, department: 2, unit: 3 }
      for (const level of levels) {
        const list = rawData.value.issues.yoy_decline[level] || []
        list.forEach((item) => {
          issues.push({ ...item, type: 'decline', org_type: item.org_type })
        })
      }
      return issues.sort((a, b) => {
        if (typeOrder[a.org_type] !== typeOrder[b.org_type]) return typeOrder[a.org_type] - typeOrder[b.org_type]
        if (a.org_name !== b.org_name) return a.org_name.localeCompare(b.org_name, 'zh-CN')
        return a.metric.localeCompare(b.metric, 'zh-CN')
      })
    })

    const behindIssues = computed(() => {
      if (!rawData.value?.issues?.behind_schedule) return []
      const issues = []
      const levels = ['company', 'department_total', 'department', 'unit']
      const typeOrder = { company: 0, department_total: 1, department: 2, unit: 3 }
      for (const level of levels) {
        const list = rawData.value.issues.behind_schedule[level] || []
        list.forEach((item) => {
          issues.push({ ...item, type: 'behind', org_type: item.org_type })
        })
      }
      return issues.sort((a, b) => {
        if (typeOrder[a.org_type] !== typeOrder[b.org_type]) return typeOrder[a.org_type] - typeOrder[b.org_type]
        if (a.org_name !== b.org_name) return a.org_name.localeCompare(b.org_name, 'zh-CN')
        return a.metric.localeCompare(b.metric, 'zh-CN')
      })
    })

    const negativeIssues = computed(() => {
      if (!rawData.value?.issues?.negative_profit) return []
      const issues = []
      const levels = ['company', 'department_total', 'department', 'unit']
      const typeOrder = { company: 0, department_total: 1, department: 2, unit: 3 }
      for (const level of levels) {
        const list = rawData.value.issues.negative_profit[level] || []
        list.forEach((item) => {
          issues.push({ ...item, type: 'negative', org_type: item.org_type })
        })
      }
      return issues.sort((a, b) => {
        if (typeOrder[a.org_type] !== typeOrder[b.org_type]) return typeOrder[a.org_type] - typeOrder[b.org_type]
        if (a.profit_value !== b.profit_value) return a.profit_value - b.profit_value
        if (a.org_name !== b.org_name) return a.org_name.localeCompare(b.org_name, 'zh-CN')
        return a.metric.localeCompare(b.metric, 'zh-CN')
      })
    })

    const updateScrollSpeed = () => {
      const baseTime = 15
      const charWidth = 8
      const containerWidth = 400
      const calcWidth = (list) => list.reduce((acc, item) => acc + ((item.org_name || '').length + (item.metric || '').length + 10) * charWidth, 0)

      if (declineIssues.value.length > 0) declineDuration.value = Math.max(10, (calcWidth(declineIssues.value) / containerWidth) * baseTime)
      if (behindIssues.value.length > 0) behindDuration.value = Math.max(10, (calcWidth(behindIssues.value) / containerWidth) * baseTime)
      if (negativeIssues.value.length > 0) negativeDuration.value = Math.max(10, (calcWidth(negativeIssues.value) / containerWidth) * baseTime)
    }

    const pauseMarquee = (type) => {
      if (type === 'decline') declinePaused.value = true
      else if (type === 'behind') behindPaused.value = true
      else if (type === 'negative') negativePaused.value = true
    }

    const resumeMarquee = (type) => {
      if (type === 'decline') declinePaused.value = false
      else if (type === 'behind') behindPaused.value = false
      else if (type === 'negative') negativePaused.value = false
    }

    const initData = async () => {
      const candidates = [
        `${API_BASE_URL}/performance-analysis/issues`,
        `${API_BASE_URL}/detailed-performance-issues`,
      ]

      let lastError = null
      for (const url of candidates) {
        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const result = await response.json()
          rawData.value = result?.data || null
          setTimeout(updateScrollSpeed, 100)
          return
        } catch (error) {
          lastError = error
        }
      }

      console.error('获取预警信息失败:', lastError)
    }

    const handleResize = () => {
      if (tooltip.value.visible) handleLeave()
    }

    const handleGlobalKeydown = (event) => {
      if (event.key === 'Escape' && detailModal.value.visible) closeIssueModal()
    }

    onMounted(() => {
      initData()
      window.addEventListener('resize', handleResize)
      window.addEventListener('keydown', handleGlobalKeydown)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleGlobalKeydown)
    })

    return {
      declineIssues,
      behindIssues,
      negativeIssues,
      declinePaused,
      behindPaused,
      negativePaused,
      declineDuration,
      behindDuration,
      negativeDuration,
      pauseMarquee,
      resumeMarquee,
      handleClick,
      formatNumber,
      tooltip,
      detailModal,
      modalIssues,
      closeIssueModal,
      getModalHeaderClass,
      getMetricChipClass,
      getIssueMainValue,
      handleEnter,
      handleLeave,
      getTooltipLabel,
      getTooltipBadgeClass,
      getTooltipBorderClass,
      declineRefs,
      behindRefs,
      negativeRefs,
    }
  },
}
</script>

<style scoped>
@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.marquee-content {
  animation-name: scroll-left;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-play-state: running;
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.marquee-container {
  overflow: hidden;
  contain: paint;
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: opacity 0.22s ease;
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
}
</style>
