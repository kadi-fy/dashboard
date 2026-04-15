<template>
  <div class="relative">
    <flat-pickr
      class="form-input pl-9 dark:bg-gray-800 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium w-[9rem] text-xs py-1.5"
      :config="computedConfig"
      v-model="date"
    />
    <div class="absolute inset-0 right-auto flex items-center pointer-events-none">
      <svg class="fill-current text-gray-400 dark:text-gray-500 ml-3" width="16" height="16" viewBox="0 0 16 16">
        <path d="M5 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H5Z" />
        <path d="M4 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4ZM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z" />
      </svg>
    </div>
  </div>
</template>

<script>
import flatPickr from 'vue-flatpickr-component'
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect'
import { Mandarin } from 'flatpickr/dist/l10n/zh.js'
import { GLOBAL_CONFIG } from '../utils/Utils'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL

export default {
  name: 'Datepicker',
  props: {
    modelValue: { type: String, default: null },
    align: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      date: null,
      availableMonths: [],
    }
  },
  computed: {
    computedConfig() {
      const self = this
      const cfg = {
        static: false,
        locale: Mandarin,
        position: 'auto left',
        plugins: [
          new monthSelectPlugin({
            shorthand: false,
            dateFormat: 'Y-m',
            altFormat: 'Y年n月',
            theme: 'light',
          }),
        ],
        prevArrow: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;width:26px;height:26px"><path d="M14.5 6L8.5 12" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M8.5 12L14.5 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
        nextArrow: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;width:26px;height:26px"><path d="M9.5 6L15.5 12" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M15.5 12L9.5 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
        altInput: true,
        onChange(selectedDates, dateStr) {
          if (dateStr) self.$emit('update:modelValue', dateStr)
        },
        onOpen(_, __, instance) {
          self.adjustCalendarPosition(instance)
          self.applyAvailableMonthStates(instance)
        },
        onReady(_, __, instance) {
          const customClass = self.align ? self.align : ''
          if (customClass) instance.calendarContainer.classList.add(`flatpickr-${customClass}`)
          self.adjustCalendarPosition(instance)
          self.applyAvailableMonthStates(instance)
        },
        onYearChange(_, __, instance) {
          self.applyAvailableMonthStates(instance)
        },
        onMonthChange(_, __, instance) {
          self.applyAvailableMonthStates(instance)
        },
      }
      if (this.availableMonths.length) {
        const first = this.availableMonths[0]
        const last = this.availableMonths[this.availableMonths.length - 1]
        const [firstY, firstM] = first.split('-').map(Number)
        const [lastY, lastM] = last.split('-').map(Number)
        cfg.minDate = new Date(firstY, firstM - 1, 1)
        cfg.maxDate = new Date(lastY, lastM, 0)
      }
      return cfg
    },
  },
  async mounted() {
    await this.loadAvailableMonths()
  },
  methods: {
    async loadAvailableMonths() {
      try {
        const res = await fetch(`${API_BASE_URL}/dates`)
        const payload = await res.json()
        const rows = Array.isArray(payload.data) ? payload.data : []
        if (!rows.length) return

        // Deduplicate and sort year-month strings
        const monthSet = new Set()
        rows.forEach((r) => {
          const y = r.year
          const m = String(r.month_number).padStart(2, '0')
          monthSet.add(`${y}-${m}`)
        })
        const sorted = Array.from(monthSet).sort()

        this.availableMonths = sorted

        // Always default to latest available month when entering page
        const latest = sorted[sorted.length - 1]
        this.date = latest
        this.$emit('update:modelValue', latest)
      } catch (e) {
        console.error('Datepicker: failed to load dates', e)
      }
    },
    adjustCalendarPosition(instance) {
      if (!instance || !instance.calendarContainer) return
      const calendar = instance.calendarContainer
      calendar.style.left = ''

      const rect = calendar.getBoundingClientRect()
      const overflowRight = rect.right - window.innerWidth
      if (overflowRight > 0) {
        const currentLeft = parseFloat(calendar.style.left || '0')
        calendar.style.left = `${currentLeft - overflowRight - 8}px`
      }
    },
    applyAvailableMonthStates(instance) {
      if (!instance || !instance.calendarContainer || !this.availableMonths.length) return
      const allowed = new Set(this.availableMonths)
      const monthEls = instance.calendarContainer.querySelectorAll('.flatpickr-monthSelect-month')
      monthEls.forEach((el) => {
        const dateObj = el.dateObj
        if (!dateObj) return
        const y = dateObj.getFullYear()
        const m = String(dateObj.getMonth() + 1).padStart(2, '0')
        const isAllowed = allowed.has(`${y}-${m}`)
        if (isAllowed) {
          el.classList.remove('flatpickr-disabled')
          el.removeAttribute('aria-disabled')
        } else {
          el.classList.add('flatpickr-disabled')
          el.setAttribute('aria-disabled', 'true')
        }
      })
    },
  },
  watch: {
    modelValue(val) {
      if (val && val !== this.date) {
        this.date = val
      }
    },
  },
  components: {
    flatPickr,
  },
}
</script>

<style>
@import 'flatpickr/dist/plugins/monthSelect/style.css';
.flatpickr-calendar {
  width: 280px !important;
  min-width: 280px !important;
}

.flatpickr-calendar .flatpickr-prev-month,
.flatpickr-calendar .flatpickr-next-month {
  width: 32px;
  height: 32px;
  top: 6px;
  padding: 4px;
  border-radius: 8px;
}

.flatpickr-calendar .flatpickr-prev-month svg,
.flatpickr-calendar .flatpickr-next-month svg {
  width: 26px !important;
  height: 26px !important;
  display: block;
}

.flatpickr-calendar .flatpickr-prev-month:hover,
.flatpickr-calendar .flatpickr-next-month:hover {
  background: rgba(148, 163, 184, 0.18);
}
</style>