<template>
  <div class="flex items-center justify-center space-x-4 sm:space-x-6 h-full overflow-hidden relative">
    <div class="flex items-center flex-1 min-w-0 group" @mouseenter="pauseMarquee('decline')" @mouseleave="resumeMarquee('decline')">
      <div class="flex flex-col items-center flex-shrink-0 hidden xl:flex mr-3 cursor-pointer select-none" @click="openIssueModalByType('decline')">
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
      <div class="flex flex-col items-center flex-shrink-0 hidden xl:flex mr-3 cursor-pointer select-none" @click="openIssueModalByType('behind')">
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
      <div class="flex flex-col items-center flex-shrink-0 hidden xl:flex mr-3 cursor-pointer select-none" @click="openIssueModalByType('negative')">
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
          <div class="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_24px_70px_rgba(15,23,42,0.4)] border border-white/40 dark:border-slate-700/70">
            <div class="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-30" :class="getModalHeaderClass(detailModal.type)"></div>
            <div class="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-slate-300/20 dark:bg-slate-500/20 blur-3xl"></div>

            <div class="relative px-6 py-3.5 bg-gradient-to-r text-white" :class="getModalHeaderClass(detailModal.type)">
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex items-center gap-2.5">
                    <span class="h-7 w-7 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M3 3v18h18" />
                        <path d="m19 9-5 5-4-4-3 3" />
                      </svg>
                    </span>
                    <h3 class="text-base font-bold tracking-wide truncate">{{ getTooltipLabel(detailModal.type) }}详情</h3>
                    <span class="px-2.5 py-1 rounded-full bg-white/18 border border-white/25 text-xs text-white/90 whitespace-nowrap flex items-center gap-1.5">
                      <span>共 {{ modalIssues.length }} 条</span>
                      <template v-if="rawData?.meta?.current_month">
                        <span class="opacity-40">·</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-75" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>截至 {{ rawData.meta.current_month }}</span>
                      </template>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  class="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center border border-white/30"
                  @click="closeIssueModal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="relative p-4 md:p-5 bg-gradient-to-b from-slate-50/70 to-white/80 dark:from-slate-900/55 dark:to-slate-900/75">
              <div class="rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-white/70 dark:border-slate-700/70 shadow-inner h-[70vh] overflow-y-auto p-3 md:p-4 space-y-3">
                <template v-if="modalIssues.length">
                  <div
                    v-for="(item, idx) in modalIssues"
                    :key="`issue-${detailModal.type}-${idx}`"
                    class="relative overflow-hidden rounded-2xl border bg-white/95 dark:bg-slate-800/75 p-4 md:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    :class="getMetricChipClass(detailModal.type)"
                  >
                    <div class="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-55"></div>
                    <div class="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-current/10 blur-2xl"></div>

                    <div class="flex items-start justify-between gap-3 mb-3">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 mb-1.5">
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/50 border border-current/25 text-current/70 tracking-widest uppercase select-none">#{{ idx + 1 }}</span>
                          <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide border" :class="getOrgTypeBadgeClass(item.org_type, detailModal.type)">{{ getOrgTypeLabel(item.org_type) }}</span>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <h4 class="text-base font-extrabold bg-clip-text text-transparent leading-snug shrink-0" :class="getOrgNameGradient(detailModal.type)">{{ item.org_name }}</h4>
                          <div class="flex items-center gap-1 min-w-0">
                            <span class="inline-block w-1 h-3 rounded-full opacity-60 shrink-0" :class="getOrgNameAccent(detailModal.type)"></span>
                            <p class="text-[12px] text-gray-500 dark:text-gray-400 truncate">{{ item.metric }}</p>
                          </div>
                        </div>
                      </div>
                      <span class="text-xs px-2.5 py-1 rounded-full border bg-white/85 dark:bg-slate-900/45 shadow-sm whitespace-nowrap" :class="getMetricChipClass(detailModal.type)">
                        {{ getIssueMainValue(item, detailModal.type) }}
                      </span>
                    </div>

                    <div v-if="detailModal.type === 'decline'" class="space-y-2.5">
                      <div class="rounded-xl border border-orange-200/70 dark:border-orange-900/35 bg-gradient-to-r from-orange-50/75 via-white to-amber-50/75 dark:from-orange-950/30 dark:via-slate-900/50 dark:to-amber-950/30 p-3.5 space-y-2.5">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-500 dark:text-gray-400">同一标尺对比（去年 vs 今年）</span>
                          <span class="font-semibold text-orange-600 dark:text-orange-300">今年 / 去年: {{ getDeclineCurrentPercent(item) }}%</span>
                        </div>

                        <div class="h-5 rounded-full bg-orange-100/90 dark:bg-orange-950/45 overflow-hidden relative">
                          <div
                            class="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400/95"
                            :style="{ width: getDeclineBaselinePercent(item) + '%' }"
                          ></div>
                          <div
                            class="absolute left-0 top-[3px] h-[calc(100%-6px)] rounded-full bg-gradient-to-r from-orange-500 to-rose-500"
                            :style="{ width: getDeclineCurrentPercent(item) + '%' }"
                          ></div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div class="rounded-lg border border-orange-100/80 dark:border-orange-900/40 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 flex items-center justify-between">
                            <span class="text-gray-500 dark:text-gray-400">去年基准</span>
                            <span class="font-semibold text-amber-600 dark:text-amber-300">{{ formatNumber(item.last_year_value) }} / 100%</span>
                          </div>
                          <div class="rounded-lg border border-orange-100/80 dark:border-orange-900/40 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 flex items-center justify-between">
                            <span class="text-gray-500 dark:text-gray-400">今年完成</span>
                            <span class="font-semibold text-orange-600 dark:text-orange-300">{{ formatNumber(item.current_value) }} / {{ getDeclineCurrentPercent(item) }}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else-if="detailModal.type === 'behind'" class="space-y-2.5">
                      <div class="rounded-xl border border-red-200/70 dark:border-red-900/35 bg-gradient-to-r from-red-50/70 via-white to-rose-50/70 dark:from-red-950/30 dark:via-slate-900/50 dark:to-rose-950/30 p-3.5 space-y-3">
                        <!-- 图例行 -->
                        <div class="flex items-center justify-between text-[11px]">
                          <span class="text-gray-500 dark:text-gray-400 font-medium">年度计划完成进度</span>
                          <div class="flex items-center gap-3">
                            <span class="flex items-center gap-1.5">
                              <span class="inline-block w-4 h-2 rounded-sm" :class="getBehindCurrentPercent(item) >= getBehindSeqPercent() ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-red-500 to-rose-500'"></span>
                              <span class="text-gray-500 dark:text-gray-400">当前 {{ getBehindCurrentPercent(item) }}%</span>
                            </span>
                            <span class="flex items-center gap-1">
                              <span class="inline-block w-0.5 h-3 rounded bg-amber-500"></span>
                              <span class="text-gray-500 dark:text-gray-400">时序目标 {{ getBehindSeqPercent() }}%</span>
                            </span>
                          </div>
                        </div>

                        <!-- 进度条（整体 = 年度计划）-->
                        <div class="relative pt-5">
                          <div class="h-5 rounded-full bg-red-100/90 dark:bg-red-950/45 relative">
                            <!-- 当前完成段 -->
                            <div
                              class="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                              :class="getBehindCurrentPercent(item) >= getBehindSeqPercent() ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500'"
                              :style="{ width: Math.min(getBehindCurrentPercent(item), 100) + '%' }"
                            >
                              <span v-if="getBehindCurrentPercent(item) >= 22" class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/95 font-semibold">{{ getBehindCurrentPercent(item) }}%</span>
                            </div>
                            <!-- 时序计划目标标记线 -->
                            <div
                              class="absolute top-0 h-full w-0.5 bg-amber-500 dark:bg-amber-400 z-10 rounded-full"
                              :style="{ left: 'calc(' + getBehindSeqPercent() + '% - 1px)' }"
                            >
                              <div class="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 px-1 rounded">时序目标</div>
                            </div>
                          </div>
                          <div class="flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                            <span>0</span>
                            <span>年度计划 100%</span>
                          </div>
                        </div>

                        <!-- 三列数值 -->
                        <div class="grid grid-cols-3 gap-2 text-[11px]">
                          <div class="rounded-lg border border-gray-100/80 dark:border-gray-700/50 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 text-center">
                            <div class="text-gray-400 dark:text-gray-500 mb-0.5">年度计划</div>
                            <div class="font-semibold text-gray-700 dark:text-gray-200">{{ formatNumber(getBehindAnnualTarget(item)) }}</div>
                          </div>
                          <div class="rounded-lg border border-amber-100/80 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 px-2.5 py-1.5 text-center">
                            <div class="text-amber-500 dark:text-amber-400 mb-0.5">时序目标</div>
                            <div class="font-semibold text-amber-600 dark:text-amber-300">{{ formatNumber(item.expected_min) }}</div>
                          </div>
                          <div class="rounded-lg border border-red-100/80 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/20 px-2.5 py-1.5 text-center">
                            <div class="text-red-500 dark:text-red-400 mb-0.5">当前完成</div>
                            <div class="font-semibold text-red-600 dark:text-red-300">{{ formatNumber(item.current_value) }}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else class="space-y-2.5">
                      <div class="rounded-xl border border-purple-200/70 dark:border-purple-900/35 bg-gradient-to-r from-purple-50/75 via-white to-fuchsia-50/75 dark:from-purple-950/35 dark:via-slate-900/50 dark:to-fuchsia-950/30 p-3.5 space-y-2.5">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-500 dark:text-gray-400">亏损强度（同类相对）</span>
                          <span class="font-semibold text-purple-600 dark:text-purple-300">{{ getNegativeLossSeverityPercent(item) }}%</span>
                        </div>

                        <div class="h-5 rounded-full bg-purple-100/90 dark:bg-purple-950/45 overflow-hidden relative">
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-500"
                            :style="{ width: getNegativeLossSeverityPercent(item) + '%' }"
                          ></div>
                          <div class="absolute inset-0 flex items-center justify-between px-2.5 text-[10px] text-purple-700/80 dark:text-purple-200/85 font-semibold pointer-events-none">
                            <span>盈亏线 0</span>
                            <span>较重亏损</span>
                          </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div class="rounded-lg border border-purple-100/80 dark:border-purple-900/40 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 flex items-center justify-between">
                            <span class="text-gray-500 dark:text-gray-400">当前亏损值</span>
                            <span class="font-semibold text-purple-600 dark:text-purple-300">{{ formatNumber(item.profit_value) }}</span>
                          </div>
                          <div class="rounded-lg border border-purple-100/80 dark:border-purple-900/40 bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 flex items-center justify-between">
                            <span class="text-gray-500 dark:text-gray-400">同类最重亏损</span>
                            <span class="font-semibold text-fuchsia-600 dark:text-fuchsia-300">{{ formatNumber(getNegativeWorstLossValue(item.org_type)) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-else class="h-full flex flex-col items-center justify-center text-sm text-gray-400">
                  <div class="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-2 text-gray-300 dark:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                  </div>
                  暂无可展示的预警详情
                </div>
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

    const openIssueModalByType = (type) => {
      handleLeave()
      detailModal.value = {
        visible: true,
        type,
        issue: null,
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

    const getOrgTypeLabel = (orgType) => {
      if (orgType === 'company') return '公司整体'
      if (orgType === 'department_total') return '公司本部'
      if (orgType === 'department') return '部门'
      if (orgType === 'unit') return '所属企业'
      return orgType || ''
    }

    const getOrgTypeBadgeClass = (orgType, modalType) => {
      const colorMap = {
        decline: {
          company: 'bg-orange-100/80 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50',
          department_total: 'bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
          department: 'bg-yellow-100/80 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50',
          unit: 'bg-orange-50/80 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40',
        },
        behind: {
          company: 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
          department_total: 'bg-rose-100/80 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/50',
          department: 'bg-pink-100/80 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800/50',
          unit: 'bg-red-50/80 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40',
        },
        negative: {
          company: 'bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50',
          department_total: 'bg-fuchsia-100/80 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800/50',
          department: 'bg-violet-100/80 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/50',
          unit: 'bg-purple-50/80 text-purple-600 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40',
        },
      }
      return colorMap[modalType]?.[orgType] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }

    const getOrgNameGradient = (type) => {
      if (type === 'decline') return 'bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 dark:from-orange-300 dark:via-amber-300 dark:to-orange-200'
      if (type === 'behind') return 'bg-gradient-to-r from-red-600 via-rose-500 to-red-700 dark:from-red-300 dark:via-rose-300 dark:to-red-200'
      if (type === 'negative') return 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-purple-200'
      return 'bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400'
    }

    const getOrgNameAccent = (type) => {
      if (type === 'decline') return 'bg-amber-500'
      if (type === 'behind') return 'bg-rose-500'
      if (type === 'negative') return 'bg-fuchsia-500'
      return 'bg-gray-400'
    }

    const getIssueMainValue = (issue, type) => {
      if (!issue) return '--'
      if (type === 'decline') return "同比下降"+issue.decline_percent || '--'
      if (type === 'behind') return "完成率"+issue.completion_rate || '--'
      if (type === 'negative') return issue.profit_formatted+"万元" || formatNumber(issue.profit_value)
      return '--'
    }

    const parsePercent = (value) => {
      if (value === null || value === undefined) return 0
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0
      const text = String(value).trim()
      if (!text) return 0
      const parsed = parseFloat(text.replace('%', ''))
      return Number.isFinite(parsed) ? parsed : 0
    }

    const toNumber = (value) => {
      if (value === null || value === undefined) return 0
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0
      const parsed = parseFloat(String(value).replace(/[,%\s万元]/g, ''))
      return Number.isFinite(parsed) ? parsed : 0
    }

    const clampPercent = (value) => {
      const safe = Number.isFinite(value) ? value : 0
      return Math.max(0, Math.min(100, safe))
    }

    const getBehindProgressPercent = (issue) => {
      if (!issue) return 0
      const completionRate = parsePercent(issue.completion_rate)
      if (completionRate > 0) return clampPercent(completionRate)

      const target = parseFloat(issue.expected_min)
      const current = parseFloat(issue.current_value)
      if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(current)) return 0
      return clampPercent((current / target) * 100)
    }

    const getBehindGapPercent = (issue) => {
      const progress = getBehindProgressPercent(issue)
      return clampPercent(100 - progress)
    }

    const getBehindSeqRatio = () => {
      if (!rawData.value?.meta?.seasonal_plan_ratio) return 0
      const str = String(rawData.value.meta.seasonal_plan_ratio)
      const parsed = parseFloat(str.replace('%', '')) / 100
      return Number.isFinite(parsed) ? parsed : 0
    }

    const getBehindAnnualTarget = (issue) => {
      if (!issue) return 0
      const seqTarget = toNumber(issue.expected_min)
      const seqRatio = getBehindSeqRatio()
      if (seqRatio <= 0) return seqTarget
      return seqTarget / seqRatio
    }

    const getBehindSeqPercent = () => {
      return Math.round(getBehindSeqRatio() * 1000) / 10
    }

    const getBehindCurrentPercent = (issue) => {
      if (!issue) return 0
      const completionRate = parsePercent(issue.completion_rate)
      if (completionRate > 0) return Math.round(clampPercent(completionRate) * 10) / 10
      const annual = getBehindAnnualTarget(issue)
      if (annual <= 0) return 0
      return Math.round(clampPercent((toNumber(issue.current_value) / annual) * 100) * 10) / 10
    }

    const getDeclineCurrentPercent = (issue) => {
      if (!issue) return 0
      const lastYear = Math.max(0, toNumber(issue.last_year_value))
      const current = Math.max(0, toNumber(issue.current_value))
      const baseline = Math.max(lastYear, 1)
      return clampPercent((current / baseline) * 100).toFixed(2)
    }

    const getDeclineBaselinePercent = (issue) => {
      if (!issue) return 100
      const lastYear = Math.max(0, toNumber(issue.last_year_value))
      return lastYear > 0 ? 100 : 0
    }

    const getNegativeWorstLossValue = (orgType) => {
      if (!negativeIssues.value.length) return 0
      let worst = 0
      negativeIssues.value.forEach((issue) => {
        if (orgType && issue.org_type !== orgType) return
        const profit = toNumber(issue.profit_value)
        if (profit < worst) worst = profit
      })
      return worst
    }

    const getNegativeLossSeverityPercent = (issue) => {
      if (!issue) return '0.00'
      const currentLoss = Math.abs(Math.min(0, toNumber(issue.profit_value)))
      const worstLoss = Math.abs(Math.min(0, getNegativeWorstLossValue(issue.org_type)))
      if (worstLoss <= 0) return '0.00'
      return clampPercent((currentLoss / worstLoss) * 100).toFixed(2)
    }

    const declineIssues = computed(() => {
      if (!rawData.value?.issues?.yoy_decline) return []
      const issues = []
      const levels = ['company', 'department_total', 'department', 'unit']
      const typeOrder = { company: 0, department_total: 1, department: 2, unit: 3 }
      for (const level of levels) {
        const list = rawData.value.issues.yoy_decline[level] || []
        list.forEach((item) => {
          if (level === 'unit' && item.org_id === 2) return
          const orgType = level === 'department_total' ? 'department_total' : item.org_type
          const orgName = level === 'department_total' ? '公司本部' : item.org_name
          issues.push({ ...item, type: 'decline', org_type: orgType, org_name: orgName })
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
          if (level === 'unit' && item.org_id === 2) return
          const orgType = level === 'department_total' ? 'department_total' : item.org_type
          const orgName = level === 'department_total' ? '公司本部' : item.org_name
          issues.push({ ...item, type: 'behind', org_type: orgType, org_name: orgName })
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
          if (level === 'unit' && item.org_id === 2) return
          const orgType = level === 'department_total' ? 'department_total' : item.org_type
          const orgName = level === 'department_total' ? '公司本部' : item.org_name
          issues.push({ ...item, type: 'negative', org_type: orgType, org_name: orgName })
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
      const url =  `${API_BASE_URL}/performance-analysis/issues`
      let lastError = null
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
      rawData,
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
      openIssueModalByType,
      formatNumber,
      tooltip,
      detailModal,
      modalIssues,
      closeIssueModal,
      getModalHeaderClass,
      getMetricChipClass,
      getIssueMainValue,
      getOrgTypeLabel,
      getOrgTypeBadgeClass,
      getOrgNameGradient,
      getOrgNameAccent,
      getBehindProgressPercent,
      getBehindGapPercent,
      getBehindAnnualTarget,
      getBehindSeqPercent,
      getBehindCurrentPercent,
      getDeclineCurrentPercent,
      getDeclineBaselinePercent,
      getNegativeWorstLossValue,
      getNegativeLossSeverityPercent,
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
  transition: opacity 0.24s ease;
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
}

.modal-pop-enter-from > div,
.modal-pop-leave-to > div {
  transform: translateY(8px) scale(0.985);
  opacity: 0.96;
}

.modal-pop-enter-active > div,
.modal-pop-leave-active > div {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease;
}
</style>
