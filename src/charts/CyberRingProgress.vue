<template>
  <div class="cyber-ring-wrap" :style="wrapStyle" role="img" :aria-label="`${displayPercent}% ${label}`">
    <div class="cyber-ring-core">
      <svg class="cyber-ring-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g>
          <line
            v-for="tick in ticks"
            :key="tick.index"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :style="tick.style"
            class="cyber-tick"
            :class="tick.active ? 'is-active' : 'is-inactive'"
          />
        </g>

        <g v-if="overflowTickCount > 0">
          <line
            v-for="tick in overflowTicks"
            :key="`overflow-${tick.index}`"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :style="tick.style"
            class="cyber-tick cyber-tick-overflow"
            :class="tick.active ? 'is-overflow-active' : 'is-overflow-inactive'"
          />
        </g>

        <g>
          <line
            v-for="tick in timelinePlanTicks"
            :key="`plan-${tick.index}`"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :style="tick.style"
            class="cyber-tick cyber-tick-plan"
          />
        </g>
      </svg>

      <div class="cyber-center">
        <div class="cyber-value" :style="valueStyle">
          <span class="cyber-value-number">{{ displayPercent }}</span>
          <span class="cyber-value-unit">%</span>
        </div>
        <div v-if="showLabel && label" class="cyber-label">{{ label }}</div>
      </div>
    </div>

    <div v-if="showTarget && targetValue !== undefined && targetValue !== null && targetValue !== ''" class="cyber-meta-outside">
      <div v-if="label" class="cyber-meta-label">{{ label }}</div>
      <div class="cyber-meta-target">{{ formatTarget(targetValue) }}{{ unit }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  value: { type: Number, default: 50.35 },
  max: { type: Number, default: 100 },
  selectedMonth: { type: Number, default: 12 },
  label: { type: String, default: '完成率' },
  showLabel: { type: Boolean, default: true },
  showTarget: { type: Boolean, default: false },
  targetValue: { type: [Number, String], default: '' },
  unit: { type: String, default: '万元' },
  size: { type: [Number, String], default: 220 },
  decimals: { type: Number, default: 0 },
  tickCount: { type: Number, default: 36 },
  innerRadius: { type: Number, default: 44 },
  outerRadius: { type: Number, default: 53 },
  overflowInnerRadius: { type: Number, default: 54 },
  overflowOuterRadius: { type: Number, default: 61 },
  // Optional override. If empty, auto-color by timeline plan: red (<= plan*80%), yellow ((plan*80%, plan)), green (>= plan)
  activeColor: { type: String, default: '' },
  inactiveColor: { type: String, default: 'rgba(148, 163, 184, 0.35)' },
  overflowColor: { type: String, default: 'rgba(196, 102, 255, 0.96)' },
  greenColor: { type: String, default: '#22c55e' },
  yellowColor: { type: String, default: '#eab308' },
  redColor: { type: String, default: '#ef4444' },
  planMarkerColor: { type: String, default: '#eab308' },
})

const rawPercent = computed(() => {
  const max = Number(props.max) || 100
  if (max <= 0) return 0
  return (Number(props.value) || 0) / max * 100
})

const ringPercent = computed(() => {
  return Math.max(0, Math.min(100, rawPercent.value))
})

const overflowPercent = computed(() => {
  return Math.max(0, Math.min(100, rawPercent.value - 100))
})

const displayPercent = computed(() => {
  const n = rawPercent.value
  return Number(n.toFixed(Math.max(0, props.decimals)))
})

const normalizedTickCount = computed(() => {
  return Math.max(12, Number(props.tickCount) || 48)
})

const activeTickCount = computed(() => {
  return Math.round((ringPercent.value / 100) * normalizedTickCount.value)
})

const overflowTickCount = computed(() => {
  return Math.round((overflowPercent.value / 100) * normalizedTickCount.value)
})

const timelinePlanPercent = computed(() => {
  const month = Number(props.selectedMonth)
  if (Number.isFinite(month) && month > 0) {
    const clampedMonth = Math.min(Math.max(month, 1), 12)
    return (clampedMonth / 12) * 100
  }
  return 100
})

const resolvedActiveColor = computed(() => {
  if (props.activeColor) return props.activeColor
  const plan = timelinePlanPercent.value
  if (rawPercent.value >= plan) return props.greenColor
  if (rawPercent.value > plan * 0.8) return props.yellowColor
  return props.redColor
})

const timelinePlanTickIndex = computed(() => {
  const count = normalizedTickCount.value
  const ratio = Math.max(0, Math.min(1, timelinePlanPercent.value / 100))
  return Math.max(0, Math.min(count - 1, Math.round(ratio * count) - 1))
})

const planMarkerIndices = computed(() => {
  const targetIndex = timelinePlanTickIndex.value
  return new Set([targetIndex])
})

const withAlpha = (color, alpha) => {
  const value = String(color || '').trim()
  const rgbaMatch = value.match(/^rgba\(([^)]+)\)$/i)

  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',').map((item) => item.trim())
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
  }

  const rgbMatch = value.match(/^rgb\(([^)]+)\)$/i)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((item) => item.trim())
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
  }

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    const r = parseInt(value.slice(1, 3), 16)
    const g = parseInt(value.slice(3, 5), 16)
    const b = parseInt(value.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return value
}

const formatTarget = (value) => {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 0,
    useGrouping: false,
  }).format(Math.round(n))
}

const toRad = (deg) => deg * (Math.PI / 180)

const buildTick = (index, count, innerRadius, outerRadius) => {
  const startDeg = -90
  const step = 360 / count
  const deg = startDeg + index * step
  const rad = toRad(deg)

  return {
    index,
    x1: 60 + Math.cos(rad) * innerRadius,
    y1: 60 + Math.sin(rad) * innerRadius,
    x2: 60 + Math.cos(rad) * outerRadius,
    y2: 60 + Math.sin(rad) * outerRadius,
  }
}

const ticks = computed(() => {
  const count = normalizedTickCount.value

  return Array.from({ length: count }, (_, i) => {
    const tick = buildTick(i, count, props.innerRadius, props.outerRadius)

    return {
      ...tick,
      active: i < activeTickCount.value,
      style: { '--tick-delay': `${i * 72}ms` },
    }
  })
})

const overflowTicks = computed(() => {
  const count = normalizedTickCount.value

  return Array.from({ length: count }, (_, i) => {
    const tick = buildTick(i, count, props.overflowInnerRadius, props.overflowOuterRadius)

    return {
      ...tick,
      active: i < overflowTickCount.value,
      style: { '--tick-delay': `${i * 72}ms` },
    }
  })
})

const timelinePlanTicks = computed(() => {
  const count = normalizedTickCount.value
  const indices = planMarkerIndices.value

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((index) => ({
      ...buildTick(index, count, props.innerRadius - 4, props.outerRadius + 4),
      style: { '--plan-delay': `${index * 72}ms` },
    }))
})

const wrapStyle = computed(() => ({
  '--ring-size': `${Number(props.size) || 220}px`,
  '--ring-value-size': `${Math.max(16, Math.min(36, (Number(props.size) || 220) * 0.22))}px`,
  '--ring-label-size': `${Math.max(10, Math.min(16, (Number(props.size) || 220) * 0.075))}px`,
  '--ring-active': resolvedActiveColor.value,
  '--ring-active-soft': withAlpha(resolvedActiveColor.value, 0.18),
  '--ring-active-glow': withAlpha(resolvedActiveColor.value, 0.38),
  '--ring-active-strong': withAlpha(resolvedActiveColor.value, 0.92),
  '--ring-overflow': props.overflowColor,
  '--ring-overflow-soft': overflowTickCount.value > 0 ? withAlpha(props.overflowColor, 0.16) : 'transparent',
  '--ring-overflow-glow': overflowTickCount.value > 0 ? withAlpha(props.overflowColor, 0.34) : 'transparent',
  '--ring-overflow-strong': withAlpha(props.overflowColor, 0.92),
  '--ring-plan': props.planMarkerColor,
  '--ring-plan-soft': withAlpha(props.planMarkerColor, 0.24),
  '--ring-plan-strong': withAlpha(props.planMarkerColor, 0.95),
  '--ring-inactive': props.inactiveColor,
}))

const isDarkMode = ref(false)
let darkObserver = null
let darkMediaQuery = null

const detectDarkMode = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const root = document.documentElement
  const body = document.body
  const rootDark = root?.classList?.contains('dark')
  const bodyDark = body?.classList?.contains('dark')
  const rootThemeDark = root?.getAttribute('data-theme') === 'dark' || root?.getAttribute('data-mode') === 'dark'
  const bodyThemeDark = body?.getAttribute('data-theme') === 'dark' || body?.getAttribute('data-mode') === 'dark'
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

  isDarkMode.value = !!(rootDark || bodyDark || rootThemeDark || bodyThemeDark || prefersDark)
}

const valueStyle = computed(() => ({
  color: isDarkMode.value ? '#ffffff' : '#1e293b',
}))

onMounted(() => {
  detectDarkMode()

  if (typeof window !== 'undefined' && window.matchMedia) {
    darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (darkMediaQuery.addEventListener) {
      darkMediaQuery.addEventListener('change', detectDarkMode)
    } else if (darkMediaQuery.addListener) {
      darkMediaQuery.addListener(detectDarkMode)
    }
  }

  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    darkObserver = new MutationObserver(detectDarkMode)
    const root = document.documentElement
    const body = document.body
    if (root) {
      darkObserver.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-mode'] })
    }
    if (body) {
      darkObserver.observe(body, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-mode'] })
    }
  }
})

onBeforeUnmount(() => {
  if (darkObserver) {
    darkObserver.disconnect()
    darkObserver = null
  }

  if (darkMediaQuery) {
    if (darkMediaQuery.removeEventListener) {
      darkMediaQuery.removeEventListener('change', detectDarkMode)
    } else if (darkMediaQuery.removeListener) {
      darkMediaQuery.removeListener(detectDarkMode)
    }
    darkMediaQuery = null
  }
})
</script>

<style scoped>
.cyber-ring-wrap {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: calc(var(--ring-size) + 4px);
  background: transparent;
  box-shadow: none;
}

.cyber-ring-core {
  position: relative;
  width: var(--ring-size);
  height: var(--ring-size);
  border-radius: 9999px;
  isolation: isolate;
}

.cyber-ring-core::before {
  content: none;
}

.cyber-ring-svg {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.cyber-tick {
  stroke-linecap: round;
  stroke-width: 2.4;
  transition: stroke 320ms ease, opacity 320ms ease, filter 320ms ease, stroke-width 320ms ease;
}

.cyber-tick.is-active {
  stroke: var(--ring-active);
  opacity: 0.84;
  filter: none;
  animation: tickSweep 3.8s ease-in-out infinite;
  animation-delay: var(--tick-delay, 0ms);
}

.cyber-tick.is-inactive {
  stroke: var(--ring-inactive);
  opacity: 0.88;
}

.cyber-tick-overflow {
  stroke-linecap: round;
  stroke-width: 2;
}

.cyber-tick-overflow.is-overflow-active {
  stroke: var(--ring-overflow);
  opacity: 0.84;
  filter: none;
  animation: tickSweepOverflow 3.8s ease-in-out infinite;
  animation-delay: var(--tick-delay, 0ms);
}

.cyber-tick-overflow.is-overflow-inactive {
  stroke: transparent;
  opacity: 0;
}

.cyber-tick-plan {
  stroke: var(--ring-plan);
  stroke-width: 4.2;
  opacity: 0.98;
  filter: drop-shadow(0 0 7px var(--ring-plan));
  animation: tickPlanPulse 2.2s ease-in-out infinite;
  animation-delay: var(--plan-delay, 0ms);
}

.cyber-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transform: translateY(-2px);
  z-index: 2;
}

.cyber-meta-outside {
  margin-top: 2px;
  min-height: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.14;
}

.cyber-meta-label {
  color: #64748b;
  font-size: calc(var(--ring-label-size) - 1px);
  font-weight: 600;
  letter-spacing: 0.06em;
}

.cyber-meta-target {
  margin-top: 2px;
  color: #1e293b;
  font-size: calc(var(--ring-label-size) + 2px);
  line-height: 1;
  font-weight: 700;
}

.cyber-value {
  color: #1e293b;
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.03em;
  text-shadow: none;
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
}

.cyber-value-number {
  font-size: var(--ring-value-size);
}

.cyber-value-unit {
  font-size: calc(var(--ring-value-size) * 0.46);
  font-weight: 600;
}

.cyber-label {
  margin-top: 4px;
  color: #475569;
  font-size: var(--ring-label-size);
  line-height: 1;
  font-weight: 500;
  letter-spacing: 0.02em;
}

:global(.dark) .cyber-tick.is-inactive {
  stroke: rgba(148, 163, 184, 0.5);
}

:global(.dark) .cyber-value,
:global(html.dark) .cyber-value,
:global(body.dark) .cyber-value,
:global([data-theme='dark']) .cyber-value,
:global([data-mode='dark']) .cyber-value {
  color: #f8fafc !important;
}

:global(.dark) .cyber-value-number,
:global(html.dark) .cyber-value-number,
:global(body.dark) .cyber-value-number,
:global([data-theme='dark']) .cyber-value-number,
:global([data-mode='dark']) .cyber-value-number,
:global(.dark) .cyber-value-unit,
:global(html.dark) .cyber-value-unit,
:global(body.dark) .cyber-value-unit,
:global([data-theme='dark']) .cyber-value-unit,
:global([data-mode='dark']) .cyber-value-unit {
  color: #ffffff !important;
}

:global(.dark) .cyber-label {
  color: #cbd5e1;
}

:global(.dark) .cyber-meta-label {
  color: #94a3b8;
}

:global(.dark) .cyber-meta-target {
  color: #e2e8f0;
}

@media (prefers-color-scheme: dark) {
  .cyber-value-number {
    color: #ffffff;
  }
}

@keyframes tickSweep {
  0%,
  100% {
    opacity: 0.58;
    stroke: var(--ring-active-soft);
    stroke-width: 2.2;
  }
  30% {
    opacity: 0.76;
    stroke: var(--ring-active);
    stroke-width: 2.45;
  }
  50% {
    opacity: 0.96;
    stroke: var(--ring-active-strong);
    stroke-width: 2.9;
  }
  70% {
    opacity: 0.8;
    stroke: var(--ring-active);
    stroke-width: 2.5;
  }
}

@keyframes tickSweepOverflow {
  0%,
  100% {
    opacity: 0.56;
    stroke: var(--ring-overflow-soft);
    stroke-width: 1.9;
  }
  30% {
    opacity: 0.74;
    stroke: var(--ring-overflow);
    stroke-width: 2.1;
  }
  50% {
    opacity: 0.95;
    stroke: var(--ring-overflow-strong);
    stroke-width: 2.45;
  }
  70% {
    opacity: 0.8;
    stroke: var(--ring-overflow);
    stroke-width: 2.15;
  }
}

@keyframes tickPlanPulse {
  0%,
  100% {
    opacity: 0.7;
    stroke: var(--ring-plan-soft);
    stroke-width: 3.5;
  }
  50% {
    opacity: 1;
    stroke: var(--ring-plan-strong);
    stroke-width: 4.6;
  }
}
</style>