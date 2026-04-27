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
              <span v-for="(issue, index) in declineIssues" :key="'dec-' + index" ref="declineRefs" class="group/item relative z-10 cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" @mouseenter="handleEnter('decline', issue, $event)" @mouseleave="handleLeave" @click="handleClick(issue)">
                <span class="text-xs text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center">
                  <span class="font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                  <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                  <span class="truncate mr-1 hidden sm:inline font-medium text-orange-700 dark:text-orange-300">{{ issue.metric }}</span>
                  <span class="text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-[10px] border border-orange-100 dark:border-orange-900/30">{{ issue.decline_percent }}</span>
                </span>
              </span>
            </template>
            <span v-else class="text-xs text-gray-400 pl-2">暂无下滑数据</span>
          </span>
          <span class="inline-flex items-center space-x-4 pr-4 pointer-events-none select-none" aria-hidden="true">
            <template v-if="declineIssues.length > 0">
              <span v-for="(issue, index) in declineIssues" :key="'dec-dup-' + index" class="inline-flex items-center px-1.5 py-0.5 rounded">
                <span class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                <span class="text-xs truncate mr-1 hidden sm:inline font-medium text-orange-700 dark:text-orange-300">{{ issue.metric }}</span>
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
              <span v-for="(issue, index) in behindIssues" :key="'beh-' + index" ref="behindRefs" class="group/item relative z-10 cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" @mouseenter="handleEnter('behind', issue, $event)" @mouseleave="handleLeave" @click="handleClick(issue)">
                <span class="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center">
                  <span class="font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                  <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                  <span class="truncate mr-1 hidden sm:inline font-medium text-red-700 dark:text-red-300">{{ issue.metric }}</span>
                  <span class="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded text-[10px] border border-red-100 dark:border-red-900/30">{{ issue.completion_rate }}</span>
                </span>
              </span>
            </template>
            <span v-else class="text-xs text-gray-400 pl-2">无滞后数据</span>
          </span>
          <span class="inline-flex items-center space-x-4 pr-4 pointer-events-none select-none" aria-hidden="true">
            <template v-if="behindIssues.length > 0">
              <span v-for="(issue, index) in behindIssues" :key="'beh-dup-' + index" class="inline-flex items-center px-1.5 py-0.5 rounded">
                <span class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                <span class="text-xs truncate mr-1 hidden sm:inline font-medium text-red-700 dark:text-red-300">{{ issue.metric }}</span>
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
              <span v-for="(issue, index) in negativeIssues" :key="'neg-' + index" ref="negativeRefs" class="group/item relative z-10 cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" @mouseenter="handleEnter('negative', issue, $event)" @mouseleave="handleLeave" @click="handleClick(issue)">
                <span class="text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center">
                  <span class="font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                  <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                  <span class="truncate mr-1 hidden sm:inline font-medium text-purple-700 dark:text-purple-300">{{ issue.metric }}</span>
                  <span class="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded text-[10px] border border-purple-100 dark:border-purple-900/30">
                    {{ issue.profit_formatted }}
                  </span>
                </span>
              </span>
            </template>
            <span v-else class="text-xs text-gray-400 pl-2">无亏损数据</span>
          </span>

          <span class="inline-flex items-center space-x-4 pr-4 pointer-events-none select-none" aria-hidden="true">
            <template v-if="negativeIssues.length > 0">
              <span v-for="(issue, index) in negativeIssues" :key="'neg-dup-' + index" class="inline-flex items-center px-1.5 py-0.5 rounded">
                <span class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[80px] sm:max-w-[100px]">{{ issue.org_name }}</span>
                <span class="mx-1.5 text-gray-300 dark:text-gray-600">|</span>
                <span class="text-xs truncate mr-1 hidden sm:inline font-medium text-purple-700 dark:text-purple-300">{{ issue.metric }}</span>
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
                    当前{{ tooltip.data?.metric || '亏损指标' }}
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
                          <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide border" :class="getOrgTypeBadgeClass(item.org_type, detailModal.type)">{{ getOrgTypeLabel(item) }}</span>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <h4 class="text-base font-extrabold text-transparent bg-clip-text leading-snug shrink-0" :class="getOrgNameGradient(detailModal.type)">{{ item.org_name }}</h4>
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
                            v-if="getDeclineReductionWidth(item) > 0"
                            class="absolute inset-y-0 decline-reduction-zone bg-gradient-to-r from-orange-200/90 via-amber-200/80 to-orange-300/85 dark:from-orange-400/25 dark:via-amber-300/20 dark:to-orange-300/25 decline-reduction-shrink-sync"
                            :style="{ left: getDeclineCurrentPercent(item) + '%', width: getDeclineReductionWidth(item) + '%' }"
                          >
                            <div class="decline-reduction-sweep"></div>
                          </div>
                          <div
                            class="absolute left-0 top-0 h-full rounded-l-full bg-gradient-to-r from-orange-500 to-rose-500"
                            :style="{ width: getDeclineCurrentPercent(item) + '%' }"
                          >
                            <div
                              v-if="Number(getDeclineCurrentPercent(item)) > 0"
                              class="absolute inset-y-0 right-0 w-px bg-white/95 dark:bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.45)]"
                            ></div>
                          </div>
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
                      <div v-if="isNegativeTrendSupported(item)" class="rounded-xl border border-indigo-200/70 dark:border-indigo-900/35 bg-gradient-to-r from-indigo-50/75 via-white to-sky-50/75 dark:from-indigo-950/30 dark:via-slate-900/50 dark:to-sky-950/30 p-3.5 space-y-3">
                        <template v-if="getNegativeTrend(item)">
                          <div class="flex items-center justify-between gap-3 text-xs">
                            <span class="text-gray-500 dark:text-gray-400">当月 vs 上月亏损趋势</span>
                            <span class="px-2 py-0.5 rounded-full border bg-white/80 dark:bg-slate-900/50 font-semibold" :class="getNegativeTrendStatusClass(item)">
                              {{ getNegativeTrendStatus(item) }}
                            </span>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                            <div class="rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 px-2.5 py-2">
                              <div class="text-gray-400 dark:text-gray-500 mb-1">上月</div>
                              <div class="font-semibold text-slate-600 dark:text-slate-300">{{ getNegativeTrend(item).previousLabel }}</div>
                              <div class="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{{ formatNumber(getNegativeTrend(item).previousValue) }}</div>
                            </div>
                            <div class="rounded-lg border border-indigo-100/80 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/20 px-2.5 py-2">
                              <div class="text-indigo-500 dark:text-indigo-300 mb-1">当月</div>
                              <div class="font-semibold text-indigo-600 dark:text-indigo-300">{{ getNegativeTrend(item).currentLabel }}</div>
                              <div class="mt-1 text-sm font-bold text-indigo-700 dark:text-indigo-200">{{ formatNumber(getNegativeTrend(item).currentValue) }}</div>
                            </div>
                            <div class="rounded-lg border border-sky-100/80 dark:border-sky-900/40 bg-sky-50/70 dark:bg-sky-950/20 px-2.5 py-2">
                              <div class="text-sky-500 dark:text-sky-300 mb-1">变化</div>
                              <div class="font-semibold text-sky-600 dark:text-sky-300">趋势判断</div>
                              <div class="mt-1 text-sm font-bold text-sky-700 dark:text-sky-200">{{ getNegativeTrendDeltaLabel(item) }}</div>
                            </div>
                          </div>

                          <div class="space-y-2.5">
                            <div class="flex items-center justify-between text-[11px]">
                              <span class="text-slate-600 dark:text-slate-300">{{ getNegativeTrendLeadingLabel(item) }}：{{ formatNumber(getNegativeTrendLeadingValue(item)) }}</span>
                                <div class="flex items-center gap-2">
                                  <span v-if="getNegativeTrendExpandedPercent(item) > 0" class="text-orange-600 dark:text-orange-300 font-semibold">亏损扩大：{{ getNegativeTrendExpandedPercent(item) }}%</span>
                                  <span v-if="getNegativeTrendNarrowedPercent(item) > 0" class="text-cyan-600 dark:text-cyan-300 font-semibold">亏损收窄：{{ getNegativeTrendNarrowedPercent(item) }}%</span>
                                  <span v-else-if="isNegativeTrendCrossToLoss(item)" class="text-rose-600 dark:text-rose-300 font-semibold">由盈转亏</span>
                                  <span v-else-if="getNegativeTrendExpandedPercent(item) <= 0" class="text-slate-600 dark:text-slate-300 font-semibold">基本持平</span>
                                </div>
                            </div>

                            <div class="relative h-6 rounded-full overflow-hidden bg-slate-200/90 dark:bg-slate-700/80">
                              <div class="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-slate-400/60 to-slate-500/65 dark:from-slate-500/60 dark:to-slate-400/60"></div>
                              <template v-if="isNegativeTrendCrossToLoss(item)">
                                <div class="absolute inset-y-0 bg-indigo-500/15 dark:bg-indigo-400/20" :style="getNegativeTrendCrossProfitTrackStyle(item)"></div>
                                <div class="absolute inset-y-0 bg-rose-500/15 dark:bg-rose-500/20" :style="getNegativeTrendCrossLossTrackStyle(item)"></div>
                                <div class="absolute inset-y-0 cross-to-loss-profit-track" :style="getNegativeTrendCrossProfitTrackStyle(item)">
                                  <div class="cross-to-loss-profit-fill"></div>
                                </div>
                                <div class="absolute inset-y-0 cross-to-loss-loss-track" :style="getNegativeTrendCrossLossTrackStyle(item)">
                                  <div class="cross-to-loss-loss-fill"></div>
                                </div>
                                <div class="absolute inset-y-0 w-[2px] bg-white/90 dark:bg-white/70 z-10" :style="getNegativeTrendCrossZeroLineStyle(item)"></div>
                              </template>
                              <template v-else-if="getNegativeTrendExpandedPercent(item) > 0">
                                <div
                                  class="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                                  :style="{ width: getNegativeTrendPreviousRatioPercent(item) + '%' }"
                                ></div>
                                <div
                                  class="absolute inset-y-0 bg-gradient-to-r from-rose-500/95 to-red-500/95 dark:from-rose-500/80 dark:to-red-500/80 loss-expanded-zone loss-expanded-grow-sync"
                                  :style="getNegativeTrendExpandedStyle(item)"
                                >
                                  <div class="loss-expanded-sweep"></div>
                                </div>
                                <div class="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-white/60" :style="{ left: 'calc(' + getNegativeTrendPreviousRatioPercent(item) + '% - 1px)' }"></div>
                              </template>
                              <template v-else>
                                <div
                                  class="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-500/85 to-slate-400/90 dark:from-slate-400/80 dark:to-slate-300/75"
                                  :style="{ width: getNegativeTrendPreviousRatioPercent(item) + '%' }"
                                ></div>
                                <div
                                  class="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                                  :style="{ width: getNegativeTrendCurrentRatioPercent(item) + '%' }"
                                ></div>
                                <div
                                  v-if="getNegativeTrendNarrowedPercent(item) > 0"
                                  class="absolute inset-y-0 bg-gradient-to-r from-emerald-300/95 to-teal-400/95 dark:from-emerald-400/80 dark:to-teal-400/80 loss-narrowed-zone loss-narrowed-shrink-sync"
                                  :style="getNegativeTrendNarrowedStyle(item)"
                                >
                                  <div class="loss-narrowed-sweep"></div>
                                </div>
                                <div
                                  v-if="getNegativeTrendNarrowedPercent(item) > 0"
                                  class="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-white/60"
                                  :style="{ left: 'calc(' + getNegativeTrendCurrentRatioPercent(item) + '% - 1px)' }"
                                ></div>
                              </template>
                            </div>

                          </div>
                        </template>

                        <div v-else-if="isNegativeVisualLoading(item)" class="text-[11px] text-gray-500 dark:text-gray-400">正在加载月度对比...</div>
                        <div v-else class="text-[11px] text-gray-500 dark:text-gray-400">暂无月度对比数据</div>
                      </div>

                      <div v-if="isDepartmentProfitCompositionSupported(item)" class="rounded-xl border border-cyan-200/70 dark:border-cyan-900/35 bg-gradient-to-r from-cyan-50/75 via-white to-teal-50/75 dark:from-cyan-950/30 dark:via-slate-900/50 dark:to-teal-950/30 p-3.5 space-y-3">
                        <template v-if="getDepartmentProfitComposition(item)">
                          <div class="flex items-center justify-between gap-3 text-xs">
                            <span class="text-gray-500 dark:text-gray-400">部门利润构成关系</span>
                            <span class="px-2 py-0.5 rounded-full border border-cyan-200/80 bg-white/80 text-cyan-700 dark:border-cyan-800/70 dark:bg-slate-900/50 dark:text-cyan-200 font-semibold">
                              {{ getDepartmentProfitComposition(item).currentLabel }}
                            </span>
                          </div>

                          <div class="flex flex-wrap items-center gap-2 text-[11px]">
                            <span class="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-200 dark:border-cyan-900/40">税后净收费 {{ formatNumber(getDepartmentProfitComposition(item).afterTaxCharge) }}</span>
                            <span class="text-gray-300 dark:text-gray-600 font-semibold">-</span>
                            <span class="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/40">直接成本 {{ formatNumber(getDepartmentProfitComposition(item).directCostAdjusted) }}</span>
                            <span class="text-gray-300 dark:text-gray-600 font-semibold">-</span>
                            <span class="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40">共摊成本 {{ formatNumber(getDepartmentProfitComposition(item).allocatedCost) }}</span>
                            <span class="text-gray-300 dark:text-gray-600 font-semibold">=</span>
                            <span class="px-2 py-1 rounded-lg bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 dark:bg-fuchsia-950/30 dark:text-fuchsia-200 dark:border-fuchsia-900/40">部门利润 {{ formatNumber(getDepartmentProfitComposition(item).profitValue) }}</span>
                          </div>

                          <div class="space-y-2">
                            <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                              <span>成本构成条（成本合计 {{ formatNumber(getDepartmentProfitComposition(item).totalCost) }}）</span>
                              <div class="flex items-center gap-2.5 text-[10px]">
                                <span class="inline-flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span>直接成本</span>
                                <span class="inline-flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-amber-400"></span>共摊成本</span>
                              </div>
                            </div>
                            <div class="relative h-5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70">
                              <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-400 to-rose-500" :style="{ width: getDepartmentCompositionSegmentWidth(item, 'directCostAdjusted') }"></div>
                              <div class="absolute inset-y-0 bg-gradient-to-r from-amber-300 to-amber-400" :style="{ left: getDepartmentCompositionSegmentWidth(item, 'directCostAdjusted'), width: getDepartmentCompositionSegmentWidth(item, 'allocatedCost') }"></div>
                            </div>
                            <div class="space-y-2">
                              <div class="relative h-[44px] rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/75 dark:bg-slate-900/55 overflow-hidden shadow-inner">
                                <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(6,182,212,0.08),transparent_34%),radial-gradient(circle_at_82%_50%,rgba(139,92,246,0.1),transparent_36%),linear-gradient(90deg,rgba(148,163,184,0.08)_0%,rgba(148,163,184,0.02)_100%)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_82%_50%,rgba(196,181,253,0.14),transparent_36%),linear-gradient(90deg,rgba(148,163,184,0.12)_0%,rgba(148,163,184,0.04)_100%)]"></div>
                                <div class="absolute top-[3px] -translate-x-1/2 max-w-[46%] truncate rounded-md border border-cyan-200/80 bg-cyan-50/92 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-200" :style="{ left: getDepartmentCompositionRevenueLabelMarker(item) }">
                                  税后净收费 {{ formatNumber(getDepartmentProfitComposition(item).afterTaxCharge) }}
                                </div>
                                <div class="absolute top-[3px] -translate-x-1/2 max-w-[46%] truncate rounded-md border border-violet-200/80 bg-violet-50/92 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200" :style="{ left: getDepartmentCompositionLossLabelMarker(item) }">
                                  {{ getDepartmentCompositionResultLabel(item) }} {{ formatNumber(getDepartmentCompositionResultValue(item)) }}
                                </div>
                                <div class="absolute inset-y-[9px] left-1/4 w-px bg-slate-300/45 dark:bg-slate-600/45"></div>
                                <div class="absolute inset-y-[7px] left-1/2 w-px bg-slate-300/55 dark:bg-slate-500/55"></div>
                                <div class="absolute inset-y-[9px] left-3/4 w-px bg-slate-300/45 dark:bg-slate-600/45"></div>
                                <div class="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-px bg-slate-300/70 dark:bg-slate-600/70"></div>
                                <div class="absolute top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 dark:from-cyan-300 dark:via-cyan-400 dark:to-sky-400 shadow-[0_0_14px_rgba(6,182,212,0.35)]" :style="getDepartmentCompositionRevenueRangeStyle(item)"></div>
                                <div class="absolute top-1/2 h-0 -translate-y-1/2 border-t-[4px] border-dashed border-violet-400 dark:border-violet-400/85" :style="getDepartmentCompositionLossRangeStyle(item)"></div>

                                <div class="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-cyan-500 dark:bg-cyan-300"></div>
                                <div class="absolute top-1/2 h-5 w-px -translate-y-1/2 bg-cyan-500 dark:bg-cyan-300" :style="{ left: 'calc(' + getDepartmentCompositionRevenueMarker(item) + ' - 1px)' }"></div>
                                <div class="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-violet-500 dark:bg-violet-300 right-0"></div>

                                <div class="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-slate-900 bg-cyan-500 dark:bg-cyan-300 shadow-[0_0_0_4px_rgba(6,182,212,0.16),0_0_14px_rgba(6,182,212,0.35)]" :style="{ left: getDepartmentCompositionRevenueMarker(item) }"></div>
                                <div class="absolute right-0 top-1/2 h-3.5 w-3.5 translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white dark:border-slate-900 bg-violet-500 dark:bg-violet-300 shadow-[0_0_0_4px_rgba(139,92,246,0.14),0_0_14px_rgba(139,92,246,0.28)]"></div>
                              </div>
                            </div>
                          </div>

                        </template>

                        <div v-else-if="isNegativeVisualLoading(item)" class="text-[11px] text-gray-500 dark:text-gray-400">正在加载部门利润构成...</div>
                        <div v-else class="text-[11px] text-gray-500 dark:text-gray-400">暂无部门利润构成数据</div>
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
    const negativeVisualData = ref({})
    const negativeVisualLoading = ref({})

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

    const normalizeIssueMetric = (item, level) => {
      if (level === 'unit' && Number(item.org_id) === 2 && item.metric === '净利润') {
        return '收费口径净利润'
      }
      if (level === 'unit' && item.metric === '所属企业利润') {
        return '利润总额'
      }
      return item.metric
    }

    const normalizeIssueRecord = (item, level, type) => {
      const isHeadquartersUnit = level === 'unit' && Number(item.org_id) === 2
      const normalizedOrgType = level === 'department_total' || isHeadquartersUnit ? 'department_total' : item.org_type
      const normalizedOrgName = level === 'department_total' || isHeadquartersUnit ? '公司本部' : item.org_name

      return {
        ...item,
        type,
        org_type: normalizedOrgType,
        org_name: normalizedOrgName,
        metric: normalizeIssueMetric(item, level),
      }
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

      if (issue.type === 'negative') loadNegativeVisualData(negativeIssues.value)
    }

    const openIssueModalByType = (type) => {
      handleLeave()
      detailModal.value = {
        visible: true,
        type,
        issue: null,
      }

      if (type === 'negative') loadNegativeVisualData(negativeIssues.value)
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

    const getOrgTypeLabel = (issue) => {
      const orgType = issue?.org_type
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

    const getNegativeIssueKey = (issue) => {
      if (!issue) return ''
      return `${issue.org_type}:${issue.org_id}:${issue.metric}`
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

    const getDeclineReductionWidth = (issue) => {
      const baseline = Number(getDeclineBaselinePercent(issue)) || 0
      const current = Number(getDeclineCurrentPercent(issue)) || 0
      return Math.max(0, Math.round((baseline - current) * 100) / 100)
    }

    const loadNegativeIssueVisual = async (issue) => {
      const issueKey = getNegativeIssueKey(issue)
      if (!issueKey) return
      if (negativeVisualData.value[issueKey] || negativeVisualLoading.value[issueKey]) return

      negativeVisualLoading.value = {
        ...negativeVisualLoading.value,
        [issueKey]: true,
      }

      try {
        const payload = {
          trend: issue?.trend || null,
          composition: issue?.composition || null,
        }

        negativeVisualData.value = {
          ...negativeVisualData.value,
          [issueKey]: payload,
        }
      } catch (error) {
        console.error('加载亏损可视化明细失败:', issue, error)
      } finally {
        negativeVisualLoading.value = {
          ...negativeVisualLoading.value,
          [issueKey]: false,
        }
      }
    }

    const loadNegativeVisualData = (issues) => {
      const targetIssues = Array.isArray(issues) ? issues : []
      const uniqueIssues = []
      const seen = new Set()

      targetIssues.forEach((issue) => {
        if (!issue?.trend && !issue?.composition) return
        const issueKey = getNegativeIssueKey(issue)
        if (!issueKey || seen.has(issueKey)) return
        seen.add(issueKey)
        uniqueIssues.push(issue)
      })

      uniqueIssues.forEach((issue) => {
        loadNegativeIssueVisual(issue)
      })
    }

    const getNegativeVisual = (issue) => {
      const issueKey = getNegativeIssueKey(issue)
      const fromCache = negativeVisualData.value[issueKey] || null
      const source = (fromCache?.trend || fromCache?.composition)
        ? fromCache
        : (issue?.trend || issue?.composition)
          ? { trend: issue?.trend || null, composition: issue?.composition || null }
          : null

      if (source) {
        const trend = source.trend ? {
          currentValue: toNumber(source.trend.currentValue ?? source.trend.current_value),
          previousValue: toNumber(source.trend.previousValue ?? source.trend.previous_value),
          changeValue: toNumber(source.trend.changeValue ?? source.trend.delta),
          currentLabel: source.trend.currentLabel || source.trend.current_period || '',
          previousLabel: source.trend.previousLabel || source.trend.previous_period || '',
          maxAbs: Math.max(
            Math.abs(toNumber(source.trend.currentValue ?? source.trend.current_value)),
            Math.abs(toNumber(source.trend.previousValue ?? source.trend.previous_value)),
            1
          ),
        } : null

        const composition = source.composition ? {
          currentLabel: source.composition.currentLabel || source.composition.current_period || '',
          afterTaxCharge: toNumber(source.composition.afterTaxCharge ?? source.composition.after_tax_charge),
          directCostAdjusted: toNumber(source.composition.directCostAdjusted ?? source.composition.direct_cost_adjusted),
          allocatedCost: toNumber(source.composition.allocatedCost ?? source.composition.allocated_cost),
          totalCost: toNumber(source.composition.totalCost ?? source.composition.total_cost),
          profitValue: toNumber(source.composition.profitValue ?? source.composition.profit_value),
        } : null

        return { trend, composition }
      }
      return null
    }

    const isNegativeTrendSupported = (issue) => !!getNegativeTrend(issue)

    const isDepartmentProfitCompositionSupported = (issue) => !!getDepartmentProfitComposition(issue)

    const isNegativeVisualLoading = (issue) => {
      const issueKey = getNegativeIssueKey(issue)
      return !!negativeVisualLoading.value[issueKey]
    }

    const getNegativeTrend = (issue) => getNegativeVisual(issue)?.trend || null

    const isNegativeTrendCrossToLoss = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return false
      return toNumber(trend.previousValue) > 0 && toNumber(trend.currentValue) < 0
    }

    const getNegativeTrendCrossZeroPercent = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return 50
      const previousProfit = Math.max(0, toNumber(trend.previousValue))
      const currentLoss = Math.max(0, Math.abs(toNumber(trend.currentValue)))
      const total = previousProfit + currentLoss
      if (total <= 0) return 50
      return Math.round(clampPercent((previousProfit / total) * 100) * 10) / 10
    }

    const getNegativeTrendCrossProfitTrackStyle = (issue) => {
      const zeroPercent = getNegativeTrendCrossZeroPercent(issue)
      return {
        left: '0%',
        width: `${zeroPercent}%`,
      }
    }

    const getNegativeTrendCrossLossTrackStyle = (issue) => {
      const zeroPercent = getNegativeTrendCrossZeroPercent(issue)
      return {
        left: `${zeroPercent}%`,
        right: '0%',
      }
    }

    const getNegativeTrendCrossZeroLineStyle = (issue) => {
      const zeroPercent = getNegativeTrendCrossZeroPercent(issue)
      return {
        left: `calc(${zeroPercent}% - 1px)`,
      }
    }

    const getNegativeTrendStatus = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return '暂无数据'

      if (trend.previousValue >= 0 && trend.currentValue < 0) return '由盈转亏'
      if (trend.previousValue < 0 && trend.currentValue >= 0) return '转正'

      const diffAbs = Math.abs(Math.abs(trend.currentValue) - Math.abs(trend.previousValue))
      if (diffAbs < 0.05) return '基本持平'
      return Math.abs(trend.currentValue) > Math.abs(trend.previousValue) ? '亏损扩大' : '亏损收窄'
    }

    const getNegativeTrendStatusClass = (issue) => {
      const status = getNegativeTrendStatus(issue)
      if (status === '亏损扩大') return 'border-orange-200/80 text-orange-700 dark:border-orange-800/70 dark:text-orange-200'
      if (status === '亏损收窄') return 'border-cyan-200/80 text-cyan-700 dark:border-cyan-800/70 dark:text-cyan-200'
      if (status === '由盈转亏') return 'border-rose-200/80 text-rose-700 dark:border-rose-800/70 dark:text-rose-200'
      if (status === '转正') return 'border-emerald-200/80 text-emerald-700 dark:border-emerald-800/70 dark:text-emerald-200'
      if (status === '基本持平') return 'border-slate-200/80 text-slate-600 dark:border-slate-700/70 dark:text-slate-300'
      return 'border-indigo-200/80 text-indigo-700 dark:border-indigo-800/70 dark:text-indigo-200'
    }

    const getNegativeTrendDeltaLabel = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return '-'

      const status = getNegativeTrendStatus(issue)
      if (status === '基本持平') return '较上月基本持平'
      if (status === '由盈转亏') return `较上月转负 ${formatNumber(Math.abs(trend.changeValue))}`
      if (status === '转正') return `较上月转正 ${formatNumber(Math.abs(trend.changeValue))}`
      return `${status} ${formatNumber(Math.abs(trend.changeValue))}`
    }

    const getNegativeTrendBaseAbs = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return 1
      return Math.max(
        Math.abs(toNumber(trend.previousValue)),
        Math.abs(toNumber(trend.currentValue)),
        1
      )
    }

    const getNegativeTrendBaseValue = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return 0
      return getNegativeTrendBaseAbs(issue)
    }

    const getNegativeTrendPreviousRatioPercent = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return 0
      const baseAbs = getNegativeTrendBaseAbs(issue)
      const ratio = (Math.abs(toNumber(trend.previousValue)) / baseAbs) * 100
      return Math.round(clampPercent(ratio) * 10) / 10
    }

    const getNegativeTrendCurrentRatioPercent = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return 0
      const baseAbs = getNegativeTrendBaseAbs(issue)
      const ratio = (Math.abs(toNumber(trend.currentValue)) / baseAbs) * 100
      return Math.round(clampPercent(ratio) * 10) / 10
    }

    const getNegativeTrendExpandedPercent = (issue) => {
      const expanded = getNegativeTrendCurrentRatioPercent(issue) - getNegativeTrendPreviousRatioPercent(issue)
      if (expanded <= 0) return 0
      return Math.round(expanded * 10) / 10
    }

    const getNegativeTrendNarrowedPercent = (issue) => {
      const narrowed = getNegativeTrendPreviousRatioPercent(issue) - getNegativeTrendCurrentRatioPercent(issue)
      if (narrowed <= 0) return 0
      return Math.round(narrowed * 10) / 10
    }

    const getNegativeTrendNarrowedStyle = (issue) => {
      const currentPercent = getNegativeTrendCurrentRatioPercent(issue)
      const previousPercent = getNegativeTrendPreviousRatioPercent(issue)
      const rightPercent = clampPercent(100 - previousPercent)
      return {
        left: `${currentPercent}%`,
        right: `${rightPercent}%`,
      }
    }

    const getNegativeTrendExpandedStyle = (issue) => {
      const previousPercent = getNegativeTrendPreviousRatioPercent(issue)
      const currentPercent = getNegativeTrendCurrentRatioPercent(issue)
      const rightPercent = clampPercent(100 - currentPercent)
      return {
        left: `${previousPercent}%`,
        right: `${rightPercent}%`,
      }
    }

    const getNegativeTrendLeadingLabel = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return '基准（100%）'

      if (isNegativeTrendCrossToLoss(issue)) {
        return `上月盈利（${getNegativeTrendCrossZeroPercent(issue)}%）`
      }
      if (getNegativeTrendExpandedPercent(issue) > 0) {
        return `上月亏损（${getNegativeTrendPreviousRatioPercent(issue)}%）`
      }
      if (getNegativeTrendNarrowedPercent(issue) > 0) {
        return `当月亏损（${getNegativeTrendCurrentRatioPercent(issue)}%）`
      }
      return `${trend.previousLabel}基准（100%）`
    }

    const getNegativeTrendLeadingValue = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return 0

      if (isNegativeTrendCrossToLoss(issue)) return Math.abs(toNumber(trend.previousValue))
      if (getNegativeTrendExpandedPercent(issue) > 0) return Math.abs(toNumber(trend.previousValue))
      if (getNegativeTrendNarrowedPercent(issue) > 0) return Math.abs(toNumber(trend.currentValue))
      return getNegativeTrendBaseValue(issue)
    }

    const getNegativeTrendBaselineLabel = (issue) => {
      const trend = getNegativeTrend(issue)
      if (!trend) return '基准（100%）'
      return getNegativeTrendExpandedPercent(issue) > 0
        ? `${trend.currentLabel}基准（100%）`
        : `${trend.previousLabel}基准（100%）`
    }

    const getDepartmentProfitComposition = (issue) => getNegativeVisual(issue)?.composition || null

    const getDepartmentCompositionRevenueMarker = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return '0%'
      const base = Math.max(toNumber(composition.totalCost), 1)
      return `${clampPercent((toNumber(composition.afterTaxCharge) / base) * 100)}%`
    }

    const getDepartmentCompositionCostMarker = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return '0%'
      const base = Math.max(toNumber(composition.totalCost), 1)
      return `${clampPercent((toNumber(composition.totalCost) / base) * 100)}%`
    }

    const getDepartmentCompositionSegmentWidth = (issue, field) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return '0%'
      const base = Math.max(toNumber(composition.totalCost), 1)
      if (field === 'directCostAdjusted') return `${clampPercent((toNumber(composition.directCostAdjusted) / base) * 100)}%`
      if (field === 'allocatedCost') return `${clampPercent((toNumber(composition.allocatedCost) / base) * 100)}%`
      return '0%'
    }

    const getDepartmentCompositionLossRangeStyle = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return { display: 'none' }
      const base = Math.max(toNumber(composition.totalCost), 1)
      const revenuePercent = clampPercent((toNumber(composition.afterTaxCharge) / base) * 100)
      const left = revenuePercent
      const width = clampPercent(100 - revenuePercent)
      return {
        left: `${left}%`,
        width: `${width}%`,
      }
    }

    const getDepartmentCompositionRevenueRangeStyle = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return { display: 'none' }
      const base = Math.max(toNumber(composition.totalCost), 1)
      const width = clampPercent((toNumber(composition.afterTaxCharge) / base) * 100)
      return {
        left: '0%',
        width: `${width}%`,
      }
    }

    const getDepartmentCompositionRevenueLabelMarker = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return '0%'
      const revenuePercent = parseFloat(getDepartmentCompositionRevenueMarker(issue)) || 0
      return `${clampPercent(revenuePercent / 2)}%`
    }

    const getDepartmentCompositionLossLabelMarker = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return '50%'
      const revenuePercent = parseFloat(getDepartmentCompositionRevenueMarker(issue)) || 0
      const midpoint = revenuePercent + ((100 - revenuePercent) / 2)
      return `${clampPercent(midpoint)}%`
    }

    const getDepartmentCompositionResultLabel = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return '结果'
      return toNumber(composition.profitValue) >= 0 ? '盈利' : '亏损'
    }

    const getDepartmentCompositionResultValue = (issue) => {
      const composition = getDepartmentProfitComposition(issue)
      if (!composition) return 0
      return Math.abs(toNumber(composition.profitValue))
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
          issues.push(normalizeIssueRecord(item, level, 'decline'))
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
          issues.push(normalizeIssueRecord(item, level, 'behind'))
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
          issues.push(normalizeIssueRecord(item, level, 'negative'))
        })
      }
      return issues.sort((a, b) => {
        const levelA = Number(a.org_level)
        const levelB = Number(b.org_level)
        if (levelA !== levelB) return levelA - levelB
        if (typeOrder[a.org_type] !== typeOrder[b.org_type]) return typeOrder[a.org_type] - typeOrder[b.org_type]
        if (a.metric !== b.metric) return a.metric.localeCompare(b.metric, 'zh-CN')
        if (a.profit_value !== b.profit_value) return a.profit_value - b.profit_value
        if (a.org_name !== b.org_name) return a.org_name.localeCompare(b.org_name, 'zh-CN')
        return 0
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
      toNumber,
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
      getDeclineReductionWidth,
      isNegativeTrendSupported,
      getNegativeTrend,
      isNegativeTrendCrossToLoss,
      getNegativeTrendCrossProfitTrackStyle,
      getNegativeTrendCrossLossTrackStyle,
      getNegativeTrendCrossZeroLineStyle,
      getNegativeTrendStatus,
      getNegativeTrendStatusClass,
      getNegativeTrendDeltaLabel,
      getNegativeTrendBaseValue,
      getNegativeTrendLeadingLabel,
      getNegativeTrendLeadingValue,
      getNegativeTrendBaselineLabel,
      getNegativeTrendPreviousRatioPercent,
      getNegativeTrendCurrentRatioPercent,
      getNegativeTrendExpandedPercent,
      getNegativeTrendNarrowedPercent,
      getNegativeTrendNarrowedStyle,
      getNegativeTrendExpandedStyle,
      isNegativeVisualLoading,
      isDepartmentProfitCompositionSupported,
      getDepartmentProfitComposition,
      getDepartmentCompositionRevenueMarker,
      getDepartmentCompositionCostMarker,
      getDepartmentCompositionSegmentWidth,
      getDepartmentCompositionRevenueRangeStyle,
      getDepartmentCompositionRevenueLabelMarker,
      getDepartmentCompositionLossRangeStyle,
      getDepartmentCompositionLossLabelMarker,
      getDepartmentCompositionResultLabel,
      getDepartmentCompositionResultValue,
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

.trend-impact-zone {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, rgba(249, 115, 22, 0.45) 0%, rgba(239, 68, 68, 0.45) 100%);
  animation: trend-impact-zone-pulse-v2 0.9s ease-in-out infinite;
}

.trend-impact-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  z-index: 2;
  transform-origin: left center;
  transform: scaleX(0);
  background: linear-gradient(90deg, rgba(251, 113, 133, 0.95) 0%, rgba(249, 115, 22, 0.98) 100%);
  box-shadow: 0 0 14px rgba(249, 115, 22, 0.45);
  animation: trend-impact-grow-fill-v2 0.95s cubic-bezier(0.25, 0.85, 0.35, 1) infinite;
}

.trend-impact-fill::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: -8px;
  width: 16px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.15) 70%, rgba(255, 255, 255, 0) 100%);
  filter: blur(0.6px);
}

.trend-impact-fill::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    115deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0) 10px,
    rgba(255, 255, 255, 0.35) 10px,
    rgba(255, 255, 255, 0.35) 16px
  );
  animation: trend-impact-stripe-v2 0.45s linear infinite;
}

@keyframes trend-impact-grow-fill-v2 {
  0% {
    transform: scaleX(0);
    opacity: 0.25;
  }
  65% {
    transform: scaleX(1);
    opacity: 1;
  }
  100% {
    transform: scaleX(1);
    opacity: 0.45;
  }
}

@keyframes trend-impact-stripe-v2 {
  to {
    transform: translateX(24px);
  }
}

@keyframes trend-impact-zone-pulse-v2 {
  0% {
    filter: brightness(0.95);
  }
  50% {
    filter: brightness(1.2);
  }
  100% {
    filter: brightness(0.95);
  }
}

.loss-narrowed-zone {
  position: absolute;
  overflow: hidden;
}

.decline-reduction-zone {
  position: absolute;
  overflow: hidden;
  border-top-right-radius: 9999px;
  border-bottom-right-radius: 9999px;
}

.decline-reduction-zone::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  background: repeating-linear-gradient(
    125deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0) 10px,
    rgba(255, 255, 255, 0.24) 10px,
    rgba(255, 255, 255, 0.24) 16px
  );
  animation: loss-narrowed-stripe-shift 1.2s linear infinite;
}

.decline-reduction-shrink-sync {
  will-change: clip-path, opacity;
  animation: loss-narrowed-shrink-right 2.1s cubic-bezier(0.23, 0.85, 0.35, 1) infinite;
}

.decline-reduction-sweep {
  position: absolute;
  top: 0;
  bottom: 0;
  right: -42%;
  width: 42%;
  border-radius: 9999px;
  background: linear-gradient(270deg, rgba(249, 115, 22, 0.06) 0%, rgba(255, 255, 255, 0.84) 45%, rgba(251, 191, 36, 0.26) 100%);
  filter: blur(0.4px);
  animation: loss-narrowed-sweep-left 2.1s cubic-bezier(0.23, 0.85, 0.35, 1) infinite;
}

.cross-to-loss-profit-track,
.cross-to-loss-loss-track {
  position: absolute;
  overflow: hidden;
}

.cross-to-loss-profit-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.92) 0%, rgba(217, 70, 239, 0.9) 100%);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.3);
  animation: cross-to-loss-profit-reduce-right 2.8s cubic-bezier(0.25, 0.85, 0.35, 1) infinite;
}

.cross-to-loss-profit-fill::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -34%;
  width: 34%;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.88) 56%, rgba(217, 70, 239, 0.3) 100%);
  filter: blur(0.4px);
  animation: cross-to-loss-profit-sweep-right 2.8s cubic-bezier(0.25, 0.85, 0.35, 1) infinite;
}

.cross-to-loss-loss-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(244, 63, 94, 0.92) 0%, rgba(239, 68, 68, 0.95) 100%);
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.36);
  animation: cross-to-loss-loss-grow-right 2.8s cubic-bezier(0.25, 0.85, 0.35, 1) infinite;
}

.cross-to-loss-loss-fill::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -34%;
  width: 34%;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.9) 56%, rgba(251, 113, 133, 0.28) 100%);
  filter: blur(0.4px);
  animation: cross-to-loss-loss-sweep-right 2.8s cubic-bezier(0.25, 0.85, 0.35, 1) infinite;
}

.loss-expanded-zone {
  position: absolute;
  overflow: hidden;
}

.loss-expanded-grow-sync {
  will-change: clip-path, opacity;
  animation: loss-expanded-grow-right 2.1s cubic-bezier(0.23, 0.85, 0.35, 1) infinite;
}

.loss-expanded-zone::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  background: repeating-linear-gradient(
    125deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0) 10px,
    rgba(255, 255, 255, 0.2) 10px,
    rgba(255, 255, 255, 0.2) 16px
  );
  animation: loss-expanded-stripe-shift 1.2s linear infinite;
}

.loss-expanded-sweep {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -42%;
  width: 42%;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.84) 55%, rgba(251, 113, 133, 0.26) 100%);
  filter: blur(0.4px);
  animation: loss-expanded-sweep-right 2.1s cubic-bezier(0.23, 0.85, 0.35, 1) infinite;
}

.loss-narrowed-shrink-sync {
  will-change: clip-path, opacity;
  animation: loss-narrowed-shrink-right 2.1s cubic-bezier(0.23, 0.85, 0.35, 1) infinite;
}

.loss-narrowed-zone::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  background: repeating-linear-gradient(
    125deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0) 10px,
    rgba(255, 255, 255, 0.22) 10px,
    rgba(255, 255, 255, 0.22) 16px
  );
  animation: loss-narrowed-stripe-shift 1.2s linear infinite;
}

.loss-narrowed-sweep {
  position: absolute;
  top: 0;
  bottom: 0;
  right: -42%;
  width: 42%;
  border-radius: 9999px;
  background: linear-gradient(270deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.82) 45%, rgba(45, 212, 191, 0.26) 100%);
  filter: blur(0.4px);
  animation: loss-narrowed-sweep-left 2.1s cubic-bezier(0.23, 0.85, 0.35, 1) infinite;
}

@keyframes loss-narrowed-sweep-left {
  0% {
    transform: translateX(0);
    opacity: 0.16;
  }
  30% {
    opacity: 0.95;
  }
  100% {
    transform: translateX(-260%);
    opacity: 0;
  }
}

@keyframes loss-narrowed-shrink-right {
  0% {
    clip-path: inset(0 0 0 0);
    opacity: 0.95;
  }
  20% {
    clip-path: inset(0 0 0 0);
    opacity: 0.95;
  }
  100% {
    clip-path: inset(0 100% 0 0);
    opacity: 0.2;
  }
}

@keyframes loss-expanded-grow-right {
  0% {
    clip-path: inset(0 100% 0 0);
    opacity: 0.2;
  }
  20% {
    clip-path: inset(0 100% 0 0);
    opacity: 0.2;
  }
  100% {
    clip-path: inset(0 0 0 0);
    opacity: 0.95;
  }
}

@keyframes loss-expanded-sweep-right {
  0% {
    transform: translateX(0);
    opacity: 0.16;
  }
  30% {
    opacity: 0.95;
  }
  100% {
    transform: translateX(260%);
    opacity: 0;
  }
}

@keyframes cross-to-loss-profit-reduce-right {
  0% {
    clip-path: inset(0 0 0 0);
    opacity: 0.95;
  }
  42% {
    clip-path: inset(0 0 0 0);
    opacity: 0.95;
  }
  58% {
    clip-path: inset(0 0 0 100%);
    opacity: 0.2;
  }
  100% {
    clip-path: inset(0 0 0 100%);
    opacity: 0;
  }
}

@keyframes cross-to-loss-profit-sweep-right {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  18% {
    opacity: 0.9;
  }
  58% {
    transform: translateX(285%);
    opacity: 0;
  }
  100% {
    transform: translateX(285%);
    opacity: 0;
  }
}

@keyframes cross-to-loss-loss-grow-right {
  0% {
    clip-path: inset(0 100% 0 0);
    opacity: 0;
  }
  52% {
    clip-path: inset(0 100% 0 0);
    opacity: 0;
  }
  100% {
    clip-path: inset(0 0 0 0);
    opacity: 0.95;
  }
}

@keyframes cross-to-loss-loss-sweep-right {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  56% {
    transform: translateX(0);
    opacity: 0;
  }
  68% {
    opacity: 0.92;
  }
  100% {
    transform: translateX(285%);
    opacity: 0;
  }
}

@keyframes loss-narrowed-stripe-shift {
  to {
    transform: translateX(-18px);
  }
}

@keyframes loss-expanded-stripe-shift {
  to {
    transform: translateX(18px);
  }
}
</style>
