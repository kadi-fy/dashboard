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
              <div v-if="msg.chartData && msg.chartData.data && msg.chartData.data.length > 0" class="message-chart mt-3">
                <DynamicChart :chart-config="msg.chartData" />
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
                      @click="sendFeedback(msg.queryLogId, true, 5)" 
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
            placeholder="输入您的问题，例如：查询2025年12月各部门利润..."
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
        <p class="text-sm text-gray-600 mb-3">问题：{{ currentFeedbackMsg?.content?.substring(0, 100) }}...</p>
        
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
import { ref, reactive, nextTick, onMounted } from 'vue'
import axios from 'axios'
import DynamicChart from './DynamicChart.vue'
import { GLOBAL_CONFIG } from '../utils/Utils'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL;

export default {
  name: 'ChatBot',
  components: { DynamicChart },
  props: {
    currentYear: {
      type: Number,
      default: 2025
    },
    currentMonth: {
      type: Number,
      default: 12
    }
  },
  setup(props) {
    const isOpen = ref(false)
    const isLoading = ref(false)
    const messages = ref([])
    const currentQuestion = ref('')
    const suggestions = ref([])
    const messagesContainer = ref(null)
    const learningStats = ref({ total_templates: 0, total_queries: 0, success_queries: 0, avg_rating: 0 })
    
    // 反馈对话框相关
    const showFeedbackModal = ref(false)
    const currentFeedbackMsg = ref(null)
    const feedbackRating = ref(5)
    const feedbackComment = ref('')
    const correctedSql = ref('');
    
    // 分页相关的消息页码映射（需响应式，否则切页后视图不更新）
    const messagePaginationMap = reactive(new Map())

    // 获取学习统计
    const fetchLearningStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/learning-stats/`)
        if (response.data.success) {
          learningStats.value = response.data.stats
        }
      } catch (error) {
        console.error('获取学习统计失败:', error)
      }
    }

    // 显示学习统计
    const showLearningStats = () => {
      alert(`📊 学习统计\n\n` +
        `已学习模板: ${learningStats.value.total_templates || 0}\n` +
        `总查询次数: ${learningStats.value.total_queries || 0}\n` +
        `成功查询: ${learningStats.value.success_queries || 0}\n` +
        `平均评分: ${learningStats.value.avg_rating ? learningStats.value.avg_rating.toFixed(1) : 0}/5\n\n` +
        `💡 每次成功查询都会被学习，相似问题会直接从记忆库回复`)
    }

    // 获取建议问题
    const fetchSuggestions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/suggestions/`)
        suggestions.value = response.data.suggestions
      } catch (error) {
        console.error('获取建议失败:', error)
        suggestions.value = [
          "2025年12月的公司利润总额是多少？",
          "2025年各月份营业收入趋势如何？"
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
      if (yearMonth) return `${parseInt(yearMonth[2], 10)}月`
      const simpleMonth = text.match(/^(\d{1,2})月/) || text.match(/^(\d{1,2})\s*月/)
      if (simpleMonth) return `${parseInt(simpleMonth[1], 10)}月`
      return text
    }

    const normalizeChartConfig = (config) => {
      if (!config) return null
      
      // 检测无效的图表配置
      // 1. 只有一个标签且标签是纯数值
      if (Array.isArray(config.labels) && config.labels.length === 1) {
        const label = String(config.labels[0]).trim()
        if (/^\d+(\.\d+)?$/.test(label)) {
          return null
        }
      }
      
      // 2. 维度和指标相同（说明没有有效的维度分类）
      if (config.dimension === config.metric) {
        return null
      }
      
      const normalized = { ...config }
      if (Array.isArray(normalized.labels)) {
        normalized.labels = normalized.labels.map(normalizeMonthLabel)
      }
      if (normalized.series && Array.isArray(normalized.series)) {
        normalized.series = normalized.series.map(series => ({
          ...series,
          name: series.name || '数值'
        }))
      }
      return normalized
    }

    const normalizeTableData = (data) => {
      if (!Array.isArray(data) || data.length === 0) return []
      
      const timeFields = ['month_name', 'month', 'month_number', 'year_month', 'year', 'date', 'actual_date']
      
      return data.map(row => {
        const rowKeys = Object.keys(row)
        
        // 如果行只有1个字段（聚合结果：如公司利润总额），直接返回原始行
        if (rowKeys.length === 1) {
          return row
        }
        
        // 检查是否有时间字段
        const hasTimeField = rowKeys.some(k => timeFields.includes(k))
        if (!hasTimeField) {
          // 没有时间字段，保持原始数据结构
          return row
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
            newRow[key] = row[key]
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
      return content
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
        
        const response = await axios.post(`${API_BASE_URL}/chat/query/`, {
          question: question,
          context: context,
          session_id: `session_${Date.now()}_${Math.random()}`
        })
        
        const result = response.data
        
        if (result.success) {
          // 添加机器人回复，规范图表和表格显示
          const botMsg = {
            type: 'bot',
            content: result.answer,
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
          console.log(result)
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
    const sendFeedback = async (queryLogId, isHelpful, rating, correctedSqlValue = null, comment = null) => {
      try {
        await axios.post(`${API_BASE_URL}/chat/feedback/`, {
          query_log_id: queryLogId,
          is_helpful: isHelpful,
          rating: rating,
          corrected_sql: correctedSqlValue,
          comment: comment
        })
        
        // 标记消息已反馈
        const msg = messages.value.find(m => m.queryLogId === queryLogId)
        if (msg) {
          msg.feedbackGiven = true
        }
        
        // 更新学习统计
        await fetchLearningStats()
        
        return true
      } catch (error) {
        console.error('发送反馈失败:', error)
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
        await sendFeedback(
          currentFeedbackMsg.value.queryLogId,
          false,
          feedbackRating.value,
          correctedSql.value || null,
          feedbackComment.value || null
        )
        closeFeedbackModal()
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
        fetchLearningStats()
      }
    }

    onMounted(() => {
      fetchLearningStats()
    })

    return {
      isOpen,
      isLoading,
      messages,
      currentQuestion,
      suggestions,
      messagesContainer,
      learningStats,
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