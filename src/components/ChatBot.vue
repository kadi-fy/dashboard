<template>
  <div class="chatbot-container">
    <!-- 悬浮按钮 -->
    <div class="chatbot-toggle" @click="toggleChat" :class="{ active: isOpen }">
      <svg v-if="!isOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>

    <!-- 对话框 -->
    <transition name="slide-fade">
      <div v-if="isOpen" class="chatbot-dialog">
        <!-- 头部 -->
        <div class="chatbot-header">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h3 class="text-lg font-semibold text-white">智能数据分析助手</h3>
            <span class="text-xs text-white/70">DeepSeek 驱动</span>
            <!-- 学习状态提示 -->
            <span v-if="learningStats.total_templates > 0" class="learning-badge">
              🧠 已学习 {{ learningStats.total_templates }} 个模板
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="showLearningStats" class="stats-btn" title="学习统计">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button @click="toggleChat" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

          <div v-if="feedbackStatus.message" class="feedback-status" :class="feedbackStatus.type">
            {{ feedbackStatus.message }}
          </div>

          <div v-if="showStatsPanel" class="stats-panel">
            <div class="stats-panel-header">
              <h4 class="stats-panel-title">反馈与学习统计</h4>
              <button @click="refreshMetrics" class="stats-refresh-btn" :disabled="metricsLoading">
                {{ metricsLoading ? '刷新中...' : '刷新' }}
              </button>
            </div>
            <div class="stats-grid">
              <div class="stats-card accent-indigo">
                <span class="stats-label">已学习模板</span>
                <strong class="stats-value">{{ learningStats.total_templates || 0 }}</strong>
                <span class="stats-meta">累计成功查询 {{ learningStats.success_queries || 0 }}</span>
              </div>
              <div class="stats-card accent-amber">
                <span class="stats-label">总反馈数</span>
                <strong class="stats-value">{{ feedbackMetrics.total_feedbacks || 0 }}</strong>
                <span class="stats-meta">无帮助反馈 {{ feedbackMetrics.unhelpful_count || 0 }}</span>
              </div>
              <div class="stats-card accent-emerald">
                <span class="stats-label">用户满意度</span>
                <strong class="stats-value">{{ formatPercent(accuracyMetrics.user_satisfaction) }}</strong>
                <div class="mini-meter">
                  <span class="mini-meter-fill emerald" :style="barStyle(accuracyMetrics.user_satisfaction)"></span>
                </div>
              </div>
              <div class="stats-card accent-rose">
                <span class="stats-label">执行准确率</span>
                <strong class="stats-value">{{ formatPercent(accuracyMetrics.execution_accuracy) }}</strong>
                <div class="mini-meter">
                  <span class="mini-meter-fill rose" :style="barStyle(accuracyMetrics.execution_accuracy)"></span>
                </div>
              </div>
            </div>
            <div class="stats-visuals">
              <div class="visual-card">
                <div class="visual-header">
                  <p class="issues-title">反馈满意度结构</p>
                  <span class="visual-caption">最近 7 天</span>
                </div>
                <div class="split-meter">
                  <span class="split-meter-positive" :style="barStyle(feedbackMetrics.helpful_rate)"></span>
                  <span class="split-meter-negative" :style="barStyle(100 - Number(feedbackMetrics.helpful_rate || 0))"></span>
                </div>
                <div class="split-meter-legend">
                  <span><i class="legend-dot positive"></i>有帮助 {{ feedbackMetrics.helpful_count || 0 }}</span>
                  <span><i class="legend-dot negative"></i>待改进 {{ feedbackMetrics.unhelpful_count || 0 }}</span>
                </div>
                <div class="stats-summary compact">
                  <p>平均评分：{{ formatRating(feedbackMetrics.average_rating || accuracyMetrics.average_rating) }}</p>
                  <p>满意率：{{ formatPercent(feedbackMetrics.helpful_rate) }}</p>
                </div>
              </div>
              <div v-if="feedbackMetrics.top_issues && feedbackMetrics.top_issues.length" class="visual-card issues-list">
                <div class="visual-header">
                  <p class="issues-title">主要问题分布</p>
                  <span class="visual-caption">按反馈量排序</span>
                </div>
                <div v-for="issue in feedbackMetrics.top_issues.slice(0, 4)" :key="issue.category" class="issue-bar-row">
                  <div class="issue-row-top">
                    <span>{{ issue.label }}</span>
                    <span>{{ issue.count }} 条 / {{ formatRating(issue.avg_rating) }}</span>
                  </div>
                  <div class="issue-bar-track">
                    <span class="issue-bar-fill" :style="issueBarStyle(issue.count)"></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="stats-summary">
              <p>总查询：{{ accuracyMetrics.total_queries || 0 }}</p>
              <p>成功查询：{{ accuracyMetrics.successful_queries || 0 }}</p>
              <p>平均评分：{{ formatRating(feedbackMetrics.average_rating || accuracyMetrics.average_rating) }}</p>
            </div>
            <div class="insight-strip">
              <div class="insight-chip">
                <span class="insight-label">学习效率</span>
                <strong>{{ learningStats.total_queries || 0 }}</strong>
              </div>
              <div class="insight-chip">
                <span class="insight-label">满意反馈</span>
                <strong>{{ feedbackMetrics.helpful_count || 0 }}</strong>
              </div>
              <div class="insight-chip">
                <span class="insight-label">需优化项</span>
                <strong>{{ feedbackMetrics.unhelpful_count || 0 }}</strong>
              </div>
              <div class="insight-chip">
                <span class="insight-label">面板状态</span>
                <strong>{{ metricsLoading ? '同步中' : '已更新' }}</strong>
              </div>
            </div>
          </div>

        <!-- 消息列表 -->
        <div class="chatbot-messages" ref="messagesContainer">
          <!-- 欢迎界面 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="text-center text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p class="text-sm font-medium">你好！我是数据分析助手</p>
              <p class="text-xs mt-1">基于 DeepSeek 智能模型，支持持续学习</p>
              <p class="text-xs text-gray-400">可以问我任何关于经营数据的问题</p>
            </div>
            
            <!-- 常见问题 -->
            <div class="suggestions">
              <p class="text-xs text-gray-500 mb-2">试试这些问题：</p>
              <div class="space-y-2">
                <div v-for="suggestion in suggestions" :key="suggestion" 
                  class="suggestion-chip" @click="sendMessage(suggestion)">
                  {{ suggestion }}
                </div>
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.type]">
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              
              <!-- 来自记忆的标记 -->
              <div v-if="msg.fromMemory" class="memory-badge">
                🧠 来自记忆库
              </div>
              
              <!-- 图表展示 -->
              <div v-if="hasRenderableChart(msg.chartData)" class="message-chart mt-3">
                <template v-if="isDashboardChart(msg.chartData)">
                  <div class="chart-dashboard-grid">
                    <div
                      v-for="(chart, chartIdx) in msg.chartData.charts"
                      :key="`chart-${chartIdx}`"
                      class="chart-dashboard-card"
                    >
                      <p class="chart-dashboard-title">{{ chart.title || `图表${chartIdx + 1}` }}</p>
                      <DynamicChart :chart-config="chart" />
                    </div>
                  </div>
                </template>
                <template v-else>
                  <DynamicChart :chart-config="msg.chartData" />
                </template>
              </div>
              
              <!-- 数据表格 -->
              <div v-if="msg.tableData && msg.tableData.length > 0" class="message-table mt-3">
                <table class="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th v-for="col in Object.keys(msg.tableData[0])" :key="col" class="px-2 py-1 text-left bg-gray-50">
                        {{ col }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in getPaginatedTableData(msg, idx)" :key="i">
                      <td v-for="col in Object.keys(row)" :key="col" class="px-2 py-1 border-t">
                        {{ row[col] }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <!-- 分页控制 -->
                <div v-if="msg.paginationInfo && msg.paginationInfo.total_pages > 1" class="pagination-controls mt-3 flex items-center justify-between">
                  <p class="text-xs text-gray-500">
                    第 {{ getCurrentPage(idx) }} / {{ msg.paginationInfo.total_pages }} 页，共 {{ msg.paginationInfo.total }} 条
                  </p>
                  <div class="flex gap-2">
                    <button 
                      @click="goToPage(idx, getCurrentPage(idx) - 1)"
                      :disabled="getCurrentPage(idx) <= 1"
                      class="pagination-btn"
                    >
                      上一页
                    </button>
                    <input 
                      type="number" 
                      :value="getCurrentPage(idx)"
                      @change="goToPage(idx, $event.target.value)"
                      min="1" 
                      :max="msg.paginationInfo.total_pages"
                      class="pagination-input"
                    />
                    <button 
                      @click="goToPage(idx, getCurrentPage(idx) + 1)"
                      :disabled="getCurrentPage(idx) >= msg.paginationInfo.total_pages"
                      class="pagination-btn"
                    >
                      下一页
                    </button>
                  </div>
                </div>
                
                <!-- 非分页表格的记录数提示 -->
                <p v-else-if="msg.tableData.length > 24" class="text-xs text-gray-400 mt-1">
                  共{{ msg.tableData.length }}条数据
                </p>
              </div>
              
              <!-- 反馈按钮 -->
              <div v-if="msg.type === 'bot' && msg.queryLogId" class="feedback-buttons mt-3">
                <div class="flex items-center justify-between">
                  <div class="flex gap-2">
                    <button 
                      @click="sendFeedback(msg.queryLogId, true, 5, null, null, msg.question || null, msg.generatedSql || null)" 
                      class="feedback-btn positive"
                      :disabled="msg.feedbackGiven"
                      title="有帮助">
                      👍 有帮助
                    </button>
                    <button 
                      @click="showFeedbackDialog(msg)" 
                      class="feedback-btn negative"
                      :disabled="msg.feedbackGiven"
                      title="需要改进">
                      👎 需要改进
                    </button>
                  </div>
                  <span v-if="msg.feedbackGiven" class="text-xs text-gray-400">
                    感谢反馈 ❤️
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="isLoading" class="message bot">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chatbot-input">
          <textarea v-model="currentQuestion" 
            @keydown.enter.prevent="sendMessage(currentQuestion)"
            :placeholder="inputPlaceholder"
            rows="2"
            class="input-field"
            :disabled="isLoading"></textarea>
          
          <div class="input-actions">
            <button @click="clearConversation" class="clear-btn" title="清空对话">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button @click="sendMessage(currentQuestion)" 
              :disabled="!currentQuestion.trim() || isLoading"
              class="send-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 反馈对话框 -->
    <div v-if="showFeedbackModal" class="modal-overlay" @click.self="closeFeedbackModal">
      <div class="modal-content">
        <h3 class="text-lg font-semibold mb-4">反馈与改进</h3>
        <p class="text-sm text-gray-600 mb-3">问题：{{ currentFeedbackMsg?.question?.substring(0, 100) || '未记录原问题' }}...</p>
        
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">评分</label>
          <div class="flex gap-2">
            <button v-for="star in 5" :key="star" 
              @click="feedbackRating = star"
              class="rating-star" :class="{ active: star <= feedbackRating }">
              ⭐
            </button>
          </div>
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">问题描述（可选）</label>
          <textarea v-model="feedbackComment" rows="3" 
            class="w-full border rounded-lg p-2 text-sm"
            placeholder="描述一下哪里不满意，或者正确的答案应该是什么..."></textarea>
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">修正的SQL（可选，如果你知道正确的SQL）</label>
          <textarea v-model="correctedSql" rows="2" 
            class="w-full border rounded-lg p-2 text-sm font-mono"
            placeholder="SELECT ..."></textarea>
        </div>
        
        <div class="flex gap-2 justify-end">
          <button @click="closeFeedbackModal" class="px-3 py-1 border rounded-lg">取消</button>
          <button @click="submitFeedback" class="px-3 py-1 bg-blue-500 text-white rounded-lg">提交反馈</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, reactive, nextTick, onMounted } from 'vue'
import axios from 'axios'
import DynamicChart from './DynamicChart.vue'
import { GLOBAL_CONFIG } from '../utils/Utils'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL;
const QUERY_API_BASE_URL = `${API_BASE_URL}/query`

export default {
  name: 'ChatBot',
  components: { DynamicChart },
  props: {
    currentYear: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    currentMonth: {
      type: Number,
      default: () => new Date().getMonth() + 1
    }
  },
  setup(props) {
    const isOpen = ref(false)
    const isLoading = ref(false)
    const messages = ref([])
    const currentQuestion = ref('')
    const sessionId = ref('')
    const suggestions = ref([])
    const messagesContainer = ref(null)
    const learningStats = ref({ total_templates: 0, total_queries: 0, success_queries: 0, avg_rating: 0 })
    const showStatsPanel = ref(false)
    const metricsLoading = ref(false)
    const accuracyMetrics = ref({ total_queries: 0, successful_queries: 0, execution_accuracy: 0, user_satisfaction: 0, average_rating: 0 })
    const feedbackMetrics = ref({ total_feedbacks: 0, helpful_count: 0, unhelpful_count: 0, helpful_rate: 0, average_rating: 0, top_issues: [] })
    const feedbackStatus = ref({ message: '', type: 'info' })
    
    // 反馈对话框相关
    const showFeedbackModal = ref(false)
    const currentFeedbackMsg = ref(null)
    const feedbackRating = ref(5)
    const feedbackComment = ref('')
    const correctedSql = ref('');
    const inputPlaceholder = computed(() => `输入您的问题，例如：查询${props.currentYear}年${props.currentMonth}月各部门利润...`)
    
    // 分页相关的消息页码映射（需响应式，否则切页后视图不更新）
    const messagePaginationMap = reactive(new Map())

    // 获取学习统计
    const fetchLearningStats = async () => {
      try {
        const response = await axios.get(`${QUERY_API_BASE_URL}/learning-stats/`)
        if (response.data.success) {
          learningStats.value = response.data.stats
        }
      } catch (error) {
        console.error('获取学习统计失败:', error)
      }
    }

    const fetchAccuracyMetrics = async () => {
      const response = await axios.get(`${QUERY_API_BASE_URL}/metrics/accuracy/`)
      accuracyMetrics.value = response.data || accuracyMetrics.value
    }

    const fetchFeedbackMetrics = async () => {
      const response = await axios.get(`${QUERY_API_BASE_URL}/metrics/feedback/`)
      feedbackMetrics.value = response.data || feedbackMetrics.value
    }

    const refreshMetrics = async () => {
      metricsLoading.value = true
      try {
        await Promise.all([
          fetchLearningStats(),
          fetchAccuracyMetrics(),
          fetchFeedbackMetrics(),
        ])
      } catch (error) {
        console.error('刷新反馈统计失败:', error)
        setFeedbackStatus('统计刷新失败，请稍后重试', 'error')
      } finally {
        metricsLoading.value = false
      }
    }

    const setFeedbackStatus = (message, type = 'info') => {
      feedbackStatus.value = { message, type }
      window.clearTimeout(setFeedbackStatus.timer)
      setFeedbackStatus.timer = window.setTimeout(() => {
        feedbackStatus.value = { message: '', type: 'info' }
      }, 2500)
    }

    const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`
    const formatRating = (value) => `${Number(value || 0).toFixed(1)}/5`
    const barStyle = (value) => ({ width: `${Math.max(0, Math.min(Number(value || 0), 100))}%` })
    const issueBarStyle = (count) => {
      const issues = Array.isArray(feedbackMetrics.value.top_issues) ? feedbackMetrics.value.top_issues : []
      const maxCount = issues.length ? Math.max(...issues.map(issue => Number(issue.count || 0)), 1) : 1
      return { width: `${(Number(count || 0) / maxCount) * 100}%` }
    }

    // 显示学习统计
    const showLearningStats = () => {
      showStatsPanel.value = !showStatsPanel.value
      if (showStatsPanel.value) {
        refreshMetrics()
      }
    }

    // 获取建议问题
    const fetchSuggestions = async () => {
      try {
        const response = await axios.get(`${QUERY_API_BASE_URL}/suggestions/`)
        suggestions.value = response.data.suggestions
      } catch (error) {
        console.error('获取建议失败:', error)
        suggestions.value = [
          `${props.currentYear}年${props.currentMonth}月的公司利润总额是多少？`,
          `${props.currentYear}年各月份营业收入趋势如何？`
        ]
      }
    }

    const monthMap = {
      January: '1月',
      February: '2月',
      March: '3月',
      April: '4月',
      May: '5月',
      June: '6月',
      July: '7月',
      August: '8月',
      September: '9月',
      October: '10月',
      November: '11月',
      December: '12月',
      Jan: '1月',
      Feb: '2月',
      Mar: '3月',
      Apr: '4月',
      Jun: '6月',
      Jul: '7月',
      Aug: '8月',
      Sep: '9月',
      Oct: '10月',
      Nov: '11月',
      Dec: '12月'
    }

    const normalizeMonthLabel = (label) => {
      if (!label && label !== 0) return ''
      const text = String(label).trim()
      if (monthMap[text]) return monthMap[text]
      const digits = text.match(/^(\d{1,2})$/)
      if (digits) return `${parseInt(digits[1], 10)}月`
      const yearMonth = text.match(/^(\d{4})[-_/](\d{1,2})$/)
      if (yearMonth) return `${parseInt(yearMonth[1], 10)}年${parseInt(yearMonth[2], 10)}月`
      const yearMonthWithSuffix = text.match(/^(\d{4})-(\d{1,2})月$/)
      if (yearMonthWithSuffix) return `${parseInt(yearMonthWithSuffix[1], 10)}年${parseInt(yearMonthWithSuffix[2], 10)}月`
      const simpleMonth = text.match(/^(\d{1,2})月/) || text.match(/^(\d{1,2})\s*月/)
      if (simpleMonth) return `${parseInt(simpleMonth[1], 10)}月`
      return text
    }

    const getOrCreateSessionId = () => {
      const storageKey = 'dashboard-chat-session-id'
      try {
        const existing = window.localStorage.getItem(storageKey)
        if (existing) return existing
        const created = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        window.localStorage.setItem(storageKey, created)
        return created
      } catch (error) {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      }
    }

    const escapeHtml = (content) => {
      return String(content)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    const normalizeSingleChartConfig = (config) => {
      if (!config) return null
      const hasSeries = Array.isArray(config.series) && config.series.some(item => Array.isArray(item.data) && item.data.length > 0)
      const hasData = Array.isArray(config.data) && config.data.length > 0
      if (!hasSeries && !hasData) {
        return null
      }

      const normalized = { ...config }
      if (Array.isArray(normalized.labels)) {
        normalized.labels = normalized.labels.map(normalizeMonthLabel)
      }
      if (Array.isArray(normalized.series)) {
        normalized.series = normalized.series.map(series => ({
          ...series,
          name: series.name || '数值',
        }))
      }
      return normalized
    }

    const normalizeChartConfig = (config) => {
      if (!config) return null

      if (config.type === 'dashboard' && Array.isArray(config.charts)) {
        const charts = config.charts
          .map(normalizeSingleChartConfig)
          .filter(Boolean)

        if (!charts.length) {
          return null
        }

        return {
          ...config,
          charts,
        }
      }

      return normalizeSingleChartConfig(config)
    }

    const isDashboardChart = (chartConfig) => {
      return !!(chartConfig && chartConfig.type === 'dashboard' && Array.isArray(chartConfig.charts))
    }

    const hasRenderableChart = (chartConfig) => {
      if (!chartConfig) return false
      if (isDashboardChart(chartConfig)) {
        return chartConfig.charts.length > 0
      }
      const hasSeries = Array.isArray(chartConfig.series) && chartConfig.series.some(item => Array.isArray(item.data) && item.data.length > 0)
      const hasData = Array.isArray(chartConfig.data) && chartConfig.data.length > 0
      return hasSeries || hasData
    }

    const normalizeTableData = (data) => {
      if (!Array.isArray(data) || data.length === 0) return []

      const columnLabelMap = {
        metric_key: '指标编码',
        metric_label: '指标名称',
        current_value: '本期值',
        base_value: '基期值',
        change_value: '变化值',
        change_rate: '变化率(%)',
        org_name: '组织',
        value: '数值',
        year: '年份',
        month: '月份',
        month_number: '月份',
        year_month: '年月',
      }

      const metricKeyLabelMap = {
        revenue: '收入',
        profit: '利润',
        net_contract: '净合同',
        net_charge: '净收费',
        cost: '成本',
        charge_per: '人均收费',
        profit_per: '人均利润',
        earning: '收费口径利润',
      }

      const normalizeCellValue = (key, value) => {
        if (key === 'metric_key') {
          return metricKeyLabelMap[String(value)] || value
        }
        return value
      }

      const remapRowKeys = (row) => {
        const remapped = {}
        for (const [key, value] of Object.entries(row)) {
          const mappedKey = columnLabelMap[key] || key
          remapped[mappedKey] = normalizeCellValue(key, value)
        }
        return remapped
      }
      
      const timeFields = ['month_name', 'month', 'month_number', 'year_month', 'year', 'date', 'actual_date']
      
      return data.map(row => {
        const rowKeys = Object.keys(row)
        
        // 如果行只有1个字段（聚合结果：如公司利润总额），直接返回原始行
        if (rowKeys.length === 1) {
          return remapRowKeys(row)
        }
        
        // 检查是否有时间字段
        const hasTimeField = rowKeys.some(k => timeFields.includes(k))
        if (!hasTimeField) {
          // 没有时间字段，仅做字段中文化
          return remapRowKeys(row)
        }
        
        // 有时间字段，进行时间归一化，保留其他字段的原始名称
        let timeLabel = ''
        const year = row.year || row.year_month || null
        
        if (row.month_name) {
          timeLabel = normalizeMonthLabel(row.month_name)
        } else if (row.month_number || row.month_number === 0) {
          timeLabel = `${parseInt(row.month_number, 10)}月`
          if (row.year) {
            timeLabel = `${row.year}年${timeLabel}`
          }
        } else if (row.month) {
          timeLabel = normalizeMonthLabel(row.month)
          if (row.year) {
            timeLabel = `${row.year}年${timeLabel}`
          }
        } else if (row.year_month) {
          const parts = String(row.year_month).split(/[-_/]/)
          if (parts.length === 2) {
            timeLabel = `${parseInt(parts[1], 10)}月`
          } else {
            timeLabel = String(row.year_month)
          }
        } else if (year) {
          timeLabel = String(year)
        }
        
        // 构建新行：时间列 + 所有非时间字段（保留原始字段名）
        const newRow = {
          时间: timeLabel || '-'
        }
        
        // 保留所有非时间字段的原始名称和值
        for (const key of rowKeys) {
          if (!timeFields.includes(key)) {
            const mappedKey = columnLabelMap[key] || key
            newRow[mappedKey] = normalizeCellValue(key, row[key])
          }
        }
        
        return newRow
      })
    }


    // 滚动到底部
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }

    // 格式化消息
    const formatMessage = (content) => {
      if (!content) return ''
      return escapeHtml(content)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
    }

    // 发送消息
    const sendMessage = async (question) => {
      if (!question || !question.trim()) return
      
      // 添加用户消息
      const userMsg = {
        type: 'user',
        content: question,
        timestamp: new Date()
      }
      messages.value.push(userMsg)
      
      currentQuestion.value = ''
      isLoading.value = true
      scrollToBottom()
      
      try {
        const context = {
          year: props.currentYear,
          month: props.currentMonth
        }
        
        const response = await axios.post(`${QUERY_API_BASE_URL}/query/`, {
          question: question,
          context: context,
          session_id: sessionId.value || getOrCreateSessionId()
        })
        
        const result = response.data
        
        if (result.success) {
          // 添加机器人回复，规范图表和表格显示
          const botMsg = {
            type: 'bot',
            content: result.answer,
            question,
            generatedSql: result.sql || null,
            chartData: normalizeChartConfig(result.chart_config),
            tableData: normalizeTableData(result.data),
            paginationInfo: result.chart_config?.pagination || null,
            queryLogId: result.query_log_id,
            fromMemory: result.from_memory || false,
            feedbackGiven: false,
            timestamp: new Date()
          }
          messages.value.push(botMsg)
          // 初始化该消息的分页状态为第1页
          messagePaginationMap.set(messages.value.length - 1, 1)
          // 更新学习统计
          if (result.learning_stats) {
            learningStats.value = result.learning_stats
          }
        } else {
          messages.value.push({
            type: 'bot',
            content: result.answer || '抱歉，查询失败，请稍后重试',
            suggestion: result.suggestion,
            timestamp: new Date()
          })
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        messages.value.push({
          type: 'bot',
          content: '网络错误，请检查网络连接后重试',
          timestamp: new Date()
        })
      } finally {
        isLoading.value = false
        scrollToBottom()
      }
    }

    // 发送反馈
    const sendFeedback = async (queryLogId, isHelpful, rating, correctedSqlValue = null, comment = null, question = null, generatedSql = null) => {
      try {
        await axios.post(`${QUERY_API_BASE_URL}/feedback/`, {
          query_log_id: queryLogId,
          is_helpful: isHelpful,
          rating: rating,
          corrected_sql: correctedSqlValue,
          comment: comment,
          question: question,
          generated_sql: generatedSql
        })
        
        // 标记消息已反馈
        const msg = messages.value.find(m => m.queryLogId === queryLogId)
        if (msg) {
          msg.feedbackGiven = true
        }
        
        // 更新学习统计
        await refreshMetrics()
        setFeedbackStatus('反馈提交成功，已进入学习队列', 'success')
        
        return true
      } catch (error) {
        console.error('发送反馈失败:', error)
        setFeedbackStatus('反馈提交失败，请稍后重试', 'error')
        return false
      }
    }

    // 显示反馈对话框
    const showFeedbackDialog = (msg) => {
      currentFeedbackMsg.value = msg
      feedbackRating.value = 3
      feedbackComment.value = ''
      correctedSql.value = ''
      showFeedbackModal.value = true
    }

    // 关闭反馈对话框
    const closeFeedbackModal = () => {
      showFeedbackModal.value = false
      currentFeedbackMsg.value = null
    }

    // 提交反馈
    const submitFeedback = async () => {
      if (currentFeedbackMsg.value) {
        const ok = await sendFeedback(
          currentFeedbackMsg.value.queryLogId,
          false,
          feedbackRating.value,
          correctedSql.value || null,
          feedbackComment.value || null,
          currentFeedbackMsg.value.question || null,
          currentFeedbackMsg.value.generatedSql || null
        )
        if (ok) {
          closeFeedbackModal()
        }
      }
    }

    // 清空对话
    const clearConversation = () => {
      if (confirm('确定要清空所有对话吗？')) {
        messages.value = []
        messagePaginationMap.clear()
        scrollToBottom()
      }
    }

    // 获取当前消息的当前页码
    const getCurrentPage = (msgIndex) => {
      return messagePaginationMap.get(msgIndex) || 1
    }

    // 跳转到指定页面
    const goToPage = (msgIndex, pageNum) => {
      const msg = messages.value[msgIndex]
      if (!msg || !msg.paginationInfo) return

      const parsedPage = parseInt(pageNum, 10)
      const safePage = Number.isFinite(parsedPage) ? parsedPage : 1
      const page = Math.max(1, Math.min(safePage, msg.paginationInfo.total_pages))
      messagePaginationMap.set(msgIndex, page)
      scrollToBottom()
    }

    // 获取分页后的表格数据
    const getPaginatedTableData = (msg, msgIndex) => {
      if (!msg.tableData || msg.tableData.length === 0) return []
      
      // 如果有分页信息，按分页显示
      if (msg.paginationInfo) {
        const pageSize = msg.paginationInfo.page_size || 24
        const currentPage = getCurrentPage(msgIndex)
        const startIdx = (currentPage - 1) * pageSize
        const endIdx = startIdx + pageSize
        return msg.tableData.slice(startIdx, endIdx)
      }
      
      // 没有分页信息时的兼容处理，显示前24条
      return msg.tableData.slice(0, 24)
    }

    // 切换对话框
    const toggleChat = () => {
      isOpen.value = !isOpen.value
      if (isOpen.value && messages.value.length === 0) {
        fetchSuggestions()
        refreshMetrics()
      }
    }

    onMounted(() => {
      sessionId.value = getOrCreateSessionId()
      refreshMetrics()
    })

    return {
      isOpen,
      isLoading,
      messages,
      currentQuestion,
      inputPlaceholder,
      sessionId,
      suggestions,
      messagesContainer,
      learningStats,
      showStatsPanel,
      metricsLoading,
      accuracyMetrics,
      feedbackMetrics,
      feedbackStatus,
      showFeedbackModal,
      currentFeedbackMsg,
      feedbackRating,
      feedbackComment,
      correctedSql,
      toggleChat,
      sendMessage,
      sendFeedback,
      clearConversation,
      formatMessage,
      showLearningStats,
      showFeedbackDialog,
      closeFeedbackModal,
      submitFeedback,
      fetchLearningStats,
      refreshMetrics,
      formatPercent,
      formatRating,
      barStyle,
      issueBarStyle,
      isDashboardChart,
      hasRenderableChart,
      getCurrentPage,
      goToPage,
      getPaginatedTableData
    }
  }
}
</script>

<style scoped>
/* ... 保持原有样式 ... */

.chatbot-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}

.chatbot-toggle {
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.chatbot-toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.chatbot-toggle.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.chatbot-dialog {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 820px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chatbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.learning-badge {
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
}

.stats-btn {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.25rem;
  transition: all 0.2s;
}

.stats-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.feedback-status {
  padding: 0.625rem 1rem;
  font-size: 0.8rem;
  border-bottom: 1px solid #e2e8f0;
}

.feedback-status.success {
  background: #ecfdf5;
  color: #166534;
}

.feedback-status.error {
  background: #fef2f2;
  color: #991b1b;
}

.stats-panel {
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.stats-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.stats-panel-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

.stats-refresh-btn {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: white;
  font-size: 0.75rem;
  color: #334155;
}

.stats-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.stats-card {
  position: relative;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  overflow: hidden;
}

.stats-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 12px 0 0 12px;
}

.stats-card.accent-indigo::before {
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
}

.stats-card.accent-amber::before {
  background: linear-gradient(180deg, #f59e0b 0%, #f97316 100%);
}

.stats-card.accent-emerald::before {
  background: linear-gradient(180deg, #10b981 0%, #14b8a6 100%);
}

.stats-card.accent-rose::before {
  background: linear-gradient(180deg, #f43f5e 0%, #fb7185 100%);
}

.stats-label {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.chart-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0.75rem;
}

.chart-dashboard-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem;
  background: #f8fafc;
}

.chart-dashboard-title {
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

@media (min-width: 1024px) {
  .chart-dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.stats-value {
  font-size: 1rem;
  color: #0f172a;
}

.stats-meta {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.72rem;
  color: #64748b;
}

.mini-meter {
  width: 100%;
  height: 6px;
  margin-top: 0.6rem;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.mini-meter-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.mini-meter-fill.emerald {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.mini-meter-fill.rose {
  background: linear-gradient(90deg, #f43f5e 0%, #fb7185 100%);
}

.stats-visuals {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.visual-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.85rem;
}

.visual-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.visual-caption {
  font-size: 0.7rem;
  color: #94a3b8;
}

.split-meter {
  display: flex;
  width: 100%;
  height: 10px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.split-meter-positive,
.split-meter-negative {
  display: block;
  height: 100%;
}

.split-meter-positive {
  background: linear-gradient(90deg, #10b981 0%, #22c55e 100%);
}

.split-meter-negative {
  background: linear-gradient(90deg, #f97316 0%, #ef4444 100%);
}

.split-meter-legend {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.7rem;
  font-size: 0.73rem;
  color: #475569;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  margin-right: 0.35rem;
}

.legend-dot.positive {
  background: #22c55e;
}

.legend-dot.negative {
  background: #ef4444;
}

.stats-summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.78rem;
  color: #475569;
}

.stats-summary.compact {
  margin-top: 0.75rem;
}

.issues-list {
  margin-top: 0.75rem;
  background: white;
}

.issues-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
}

.issue-bar-row {
  margin-top: 0.65rem;
}

.issue-row-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.75rem;
  color: #475569;
  margin-bottom: 0.35rem;
}

.issue-bar-track {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #eef2ff;
  overflow: hidden;
}

.issue-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
}

.insight-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.insight-chip {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.55rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.insight-label {
  font-size: 0.68rem;
  color: #64748b;
}

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f7f9fc;
}

.welcome-message {
  padding: 1rem;
}

.suggestions {
  margin-top: 1rem;
}

.suggestion-chip {
  display: inline-block;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.message {
  margin-bottom: 1rem;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.message.bot .message-content {
  background: white;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  max-width: 85%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.message-text {
  word-wrap: break-word;
}

.memory-badge {
  font-size: 0.65rem;
  color: #667eea;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.message-chart {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.message-table {
  overflow-x: auto;
}

.message-table table {
  border-collapse: collapse;
  width: 100%;
}

.message-table th,
.message-table td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
  text-align: left;
}

.message-table th {
  background: #f7fafc;
  font-weight: 600;
}

.feedback-buttons {
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.feedback-btn {
  font-size: 0.7rem;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
  background: white;
}

.feedback-btn.positive:hover {
  background: #48bb78;
  color: white;
  border-color: #48bb78;
}

.feedback-btn.negative:hover {
  background: #f56565;
  color: white;
  border-color: #f56565;
}

.feedback-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 0.5rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #a0aec0;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chatbot-input {
  border-top: 1px solid #e2e8f0;
  background: white;
  padding: 1rem;
}

.input-field {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 0.875rem;
  resize: none;
  outline: none;
}

.input-field:focus {
  border-color: #667eea;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.clear-btn,
.send-btn {
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: transparent;
}

.clear-btn:hover {
  background: #f56565;
  color: white;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.rating-star {
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.3;
  transition: all 0.2s;
}

.rating-star.active {
  opacity: 1;
}

.rating-star:hover {
  transform: scale(1.1);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* 分页控制样式 */
.pagination-controls {
  padding: 0.75rem 0;
  border-top: 1px solid #e2e8f0;
  font-size: 0.875rem;
}

.pagination-btn {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #cbd5e0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.pagination-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-input {
  width: 3rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.75rem;
}

.pagination-input:focus {
  outline: none;
  border-color: #667eea;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats-visuals {
    grid-template-columns: 1fr;
  }

  .insight-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats-summary {
    flex-direction: column;
    gap: 0.25rem;
  }

  .chatbot-dialog {
    width: 100vw;
    height: 100vh;
    position: fixed;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }
  
  .chatbot-toggle {
    bottom: 1rem;
    right: 1rem;
  }
  
  .modal-content {
    width: 90%;
  }
}
</style>