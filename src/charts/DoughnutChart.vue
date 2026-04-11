<template>
  <div class="gauge-wrap" :style="{ '--gauge-size': sizePx }">
    <div class="gauge-core">
      <div class="gauge-halo" :style="haloStyle"></div>
      <svg class="gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient :id="baseGradientId" x1="0" y1="0" x2="120" y2="120">
            <stop offset="0%" :stop-color="baseGradientStart" />
            <stop offset="100%" :stop-color="baseGradientEnd" />
          </linearGradient>
        </defs>

        <circle class="gauge-track" cx="60" cy="60" :r="baseRadius" />
        <circle
          class="gauge-progress"
          cx="60"
          cy="60"
          :r="baseRadius"
          :stroke="`url(#${baseGradientId})`"
          :stroke-dasharray="baseCircumference"
          :stroke-dashoffset="baseDashoffset"
        />

        <circle v-if="overflowPercent > 0" class="gauge-overflow-track" cx="60" cy="60" :r="overflowRadius" />
        <circle
          v-if="overflowPercent > 0"
          class="gauge-overflow-progress"
          cx="60"
          cy="60"
          :r="overflowRadius"
          :stroke="overflowColor"
          :stroke-dasharray="overflowCircumference"
          :stroke-dashoffset="overflowDashoffset"
        />
      </svg>

      <div class="gauge-ticks"></div>
      <div class="gauge-center">
        <div class="gauge-value">
          <span class="gauge-value-number">{{ displayPercent }}</span>
          <span class="gauge-value-unit">%</span>
        </div>
      </div>
    </div>

    <div v-if="label || targetValue !== undefined" class="gauge-meta-outside">
      <div v-if="label" class="gauge-meta-label">{{ label }}</div>
      <div v-if="targetValue !== undefined" class="gauge-meta-target">{{ formatTarget(targetValue) }}万元</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  target: { type: Number, default: 100 },
  targetValue: { type: [Number, String], default: 0 },
  color: { type: Array, default: () => ['rgba(76, 175, 80, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)'] },
  width: { type: [Number, String], default: 100 },
  height: { type: [Number, String], default: 100 },
  label: { type: String, default: '' },
})

const size = computed(() => {
  const w = Number(props.width) || 100
  const h = Number(props.height) || 100
  return Math.min(w, h)
})

const sizePx = computed(() => `${size.value}px`)

const safePercent = computed(() => {
  const v = Number(props.value) || 0
  if (v < 0) return 0
  if (v > 200) return 200
  return v
})

const displayPercent = computed(() => Math.round(safePercent.value))

const basePercent = computed(() => Math.min(safePercent.value, 100))
const overflowPercent = computed(() => Math.max(safePercent.value - 100, 0))

const baseRadius = 43
const overflowRadius = 51
const baseCircumference = 2 * Math.PI * baseRadius
const overflowCircumference = 2 * Math.PI * overflowRadius

const gaugeColor = computed(() => {
  if (safePercent.value >= 100) return props.color[0] || 'rgba(76, 175, 80, 0.7)'
  if (safePercent.value >= 80) return props.color[1] || 'rgba(255, 193, 7, 0.7)'
  return props.color[2] || 'rgba(244, 67, 54, 0.7)'
})

const overflowColor = computed(() => props.color[3] || 'rgba(196, 102, 255, 0.96)')

const baseGradientStart = computed(() => gaugeColor.value)
const baseGradientEnd = computed(() => {
  const c = gaugeColor.value
  return c.endsWith(')') && c.includes('rgba(')
    ? c.replace('rgba(', 'rgba(').replace(/,\s*([0-9.]+)\)$/, ', 0.72)')
    : c
})

const gaugeIdSeed = Math.random().toString(36).slice(2, 8)
const baseGradientId = `gauge-base-${gaugeIdSeed}`

const baseDashoffset = computed(() => {
  const progress = basePercent.value / 100
  return baseCircumference * (1 - progress)
})

const overflowDashoffset = computed(() => {
  const progress = overflowPercent.value / 100
  return overflowCircumference * (1 - progress)
})

const haloStyle = computed(() => ({
  background: `radial-gradient(circle at 50% 45%, ${safePercent.value > 100 ? overflowColor.value : gaugeColor.value}44 0%, transparent 68%)`,
}))

const formatTarget = (v) => {
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return Math.round(n)
}
</script>

<style scoped>
.gauge-wrap {
  position: relative;
  width: var(--gauge-size);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.gauge-core {
  position: relative;
  width: var(--gauge-size);
  height: var(--gauge-size);
}

.gauge-halo {
  position: absolute;
  inset: -10%;
  border-radius: 9999px;
  filter: blur(8px);
  opacity: 0.9;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-track {
  fill: none;
  stroke: #e7edf6;
  stroke-width: 12;
  opacity: 0.95;
}

.gauge-progress {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.55s ease;
  filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.32));
}

.gauge-overflow-track {
  fill: none;
  stroke: rgba(216, 180, 254, 0.42);
  stroke-width: 6;
}

.gauge-overflow-progress {
  fill: none;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.55s ease;
  filter: drop-shadow(0 0 6px rgba(196, 102, 255, 0.45));
}

.gauge-ticks {
  position: absolute;
  inset: 4px;
  border-radius: 9999px;
  transform: rotate(-90deg);
  -webkit-mask: radial-gradient(circle, transparent 72%, #000 72.8%, #000 74.4%, transparent 75.2%);
  mask: radial-gradient(circle, transparent 72%, #000 72.8%, #000 74.4%, transparent 75.2%);
  background: repeating-conic-gradient(rgba(165, 180, 206, 0.36) 0deg 1deg, transparent 1deg 14deg);
}

.gauge-center::before {
  content: '';
  position: absolute;
  inset: 20%;
  border-radius: 9999px;
  background: radial-gradient(circle at 30% 25%, #ffffff 0%, #f8fafc 55%, #eef2f7 100%);
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.9);
  z-index: 0;
}

.gauge-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
  gap: 2px;
}

.gauge-value {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  line-height: 1;
  font-weight: 800;
  color: #111827;
}

.gauge-value-number {
  font-size: 1.2rem;
  letter-spacing: -0.02em;
}

.gauge-value-unit {
  margin-left: 1px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
}

.gauge-meta-outside {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  line-height: 1.15;
}

.gauge-meta-label {
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: #64748b;
  font-weight: 700;
}

.gauge-meta-target {
  margin-top: 2px;
  font-size: 0.82rem;
  color: #1f3a8a;
  font-weight: 700;
}

@keyframes gaugeFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1.5px);
  }
}

:global(.dark) .gauge-center::before {
  background: radial-gradient(circle at 30% 25%, #1f2937 0%, #111827 55%, #0f172a 100%);
  box-shadow: inset 0 0 0 1px rgba(71, 85, 105, 0.65);
}

:global(.dark) .gauge-value {
  color: #f1f5f9;
}

:global(.dark) .gauge-value-unit,
:global(.dark) .gauge-meta-label {
  color: #94a3b8;
}

:global(.dark) .gauge-meta-target {
  color: #c7d2fe;
}
</style>
