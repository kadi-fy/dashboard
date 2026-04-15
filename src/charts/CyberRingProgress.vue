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
            class="cyber-tick cyber-tick-overflow"
            :class="tick.active ? 'is-overflow-active' : 'is-overflow-inactive'"
          />
        </g>
      </svg>

      <div class="cyber-center">
        <div class="cyber-value">
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
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 50.35 },
  max: { type: Number, default: 100 },
  label: { type: String, default: '完成率' },
  showLabel: { type: Boolean, default: true },
  showTarget: { type: Boolean, default: false },
  targetValue: { type: [Number, String], default: '' },
  unit: { type: String, default: '万元' },
  size: { type: [Number, String], default: 220 },
  decimals: { type: Number, default: 0 },
  tickCount: { type: Number, default: 48 },
  innerRadius: { type: Number, default: 47 },
  outerRadius: { type: Number, default: 52 },
  overflowInnerRadius: { type: Number, default: 55 },
  overflowOuterRadius: { type: Number, default: 59 },
  // Optional override. If empty, auto-color by progress: red (<80), yellow (80-99), green (>=100)
  activeColor: { type: String, default: '' },
  inactiveColor: { type: String, default: 'rgba(148, 163, 184, 0.35)' },
  overflowColor: { type: String, default: 'rgba(196, 102, 255, 0.96)' },
  greenColor: { type: String, default: '#22c55e' },
  yellowColor: { type: String, default: '#eab308' },
  redColor: { type: String, default: '#ef4444' },
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

const activeTickCount = computed(() => {
  return Math.round((ringPercent.value / 100) * props.tickCount)
})

const overflowTickCount = computed(() => {
  return Math.round((overflowPercent.value / 100) * props.tickCount)
})

const resolvedActiveColor = computed(() => {
  if (props.activeColor) return props.activeColor
  if (rawPercent.value >= 100) return props.greenColor
  if (rawPercent.value >= 80) return props.yellowColor
  return props.redColor
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
  return Math.round(n).toLocaleString('zh-CN')
}

const toRad = (deg) => deg * (Math.PI / 180)

const ticks = computed(() => {
  const count = Math.max(12, Number(props.tickCount) || 48)
  const startDeg = -90
  const step = 360 / count

  return Array.from({ length: count }, (_, i) => {
    const deg = startDeg + i * step
    const rad = toRad(deg)
    const x1 = 60 + Math.cos(rad) * props.innerRadius
    const y1 = 60 + Math.sin(rad) * props.innerRadius
    const x2 = 60 + Math.cos(rad) * props.outerRadius
    const y2 = 60 + Math.sin(rad) * props.outerRadius

    return {
      index: i,
      x1,
      y1,
      x2,
      y2,
      active: i < activeTickCount.value,
    }
  })
})

const overflowTicks = computed(() => {
  const count = Math.max(12, Number(props.tickCount) || 48)
  const startDeg = -90
  const step = 360 / count

  return Array.from({ length: count }, (_, i) => {
    const deg = startDeg + i * step
    const rad = toRad(deg)
    const x1 = 60 + Math.cos(rad) * props.overflowInnerRadius
    const y1 = 60 + Math.sin(rad) * props.overflowInnerRadius
    const x2 = 60 + Math.cos(rad) * props.overflowOuterRadius
    const y2 = 60 + Math.sin(rad) * props.overflowOuterRadius

    return {
      index: i,
      x1,
      y1,
      x2,
      y2,
      active: i < overflowTickCount.value,
    }
  })
})

const wrapStyle = computed(() => ({
  '--ring-size': `${Number(props.size) || 220}px`,
  '--ring-value-size': `${Math.max(16, Math.min(36, (Number(props.size) || 220) * 0.22))}px`,
  '--ring-label-size': `${Math.max(10, Math.min(16, (Number(props.size) || 220) * 0.075))}px`,
  '--ring-active': resolvedActiveColor.value,
  '--ring-active-soft': withAlpha(resolvedActiveColor.value, 0.18),
  '--ring-active-glow': withAlpha(resolvedActiveColor.value, 0.38),
  '--ring-overflow': props.overflowColor,
  '--ring-overflow-soft': overflowTickCount.value > 0 ? withAlpha(props.overflowColor, 0.16) : 'transparent',
  '--ring-overflow-glow': overflowTickCount.value > 0 ? withAlpha(props.overflowColor, 0.34) : 'transparent',
  '--ring-inactive': props.inactiveColor,
}))
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
  content: '';
  position: absolute;
  inset: -12%;
  border-radius: 9999px;
  background:
    radial-gradient(circle at 50% 50%, var(--ring-active-soft) 0%, transparent 54%),
    radial-gradient(circle at 66% 34%, var(--ring-active-glow) 0%, transparent 28%),
    radial-gradient(circle at 74% 76%, var(--ring-overflow-soft) 0%, transparent 26%);
  filter: blur(16px) saturate(1.08);
  opacity: 0.95;
  z-index: 0;
  pointer-events: none;
}

.cyber-ring-svg {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.cyber-tick {
  stroke-linecap: round;
  stroke-width: 1.25;
  transition: stroke 180ms ease, opacity 180ms ease;
}

.cyber-tick.is-active {
  stroke: var(--ring-active);
  opacity: 1;
  filter: drop-shadow(0 0 5px var(--ring-active-glow)) drop-shadow(0 0 10px var(--ring-active-soft));
}

.cyber-tick.is-inactive {
  stroke: var(--ring-inactive);
  opacity: 0.88;
}

.cyber-tick-overflow {
  stroke-linecap: round;
  stroke-width: 1.15;
}

.cyber-tick-overflow.is-overflow-active {
  stroke: var(--ring-overflow);
  opacity: 0.95;
  filter: drop-shadow(0 0 6px var(--ring-overflow-glow)) drop-shadow(0 0 12px var(--ring-overflow-soft));
}

.cyber-tick-overflow.is-overflow-inactive {
  stroke: transparent;
  opacity: 0;
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

:global(.dark) .cyber-value {
  color: #f8fafc;
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
</style>