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
  font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.gauge-core {
  position: relative;
  width: var(--gauge-size);
  height: var(--gauge-size);
  border-radius: 9999px;
}

.gauge-core::after {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: 9999px;
  background: conic-gradient(from 200deg, rgba(255, 255, 255, 0) 0deg, rgba(255, 255, 255, 0.24) 56deg, rgba(255, 255, 255, 0) 120deg);
  -webkit-mask: radial-gradient(circle, transparent 69%, #000 72%, #000 74%, transparent 77%);
  mask: radial-gradient(circle, transparent 69%, #000 72%, #000 74%, transparent 77%);
  pointer-events: none;
}

.gauge-halo {
  position: absolute;
  inset: -12%;
  border-radius: 9999px;
  filter: blur(12px);
  opacity: 0.56;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-track {
  fill: none;
  stroke: rgba(226, 232, 240, 0.5);
  stroke-width: 10;
  opacity: 1;
}

.gauge-progress {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.78s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease;
  filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.18));
}

.gauge-overflow-track {
  fill: none;
  stroke: rgba(216, 180, 254, 0.32);
  stroke-width: 5;
}

.gauge-overflow-progress {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.78s cubic-bezier(0.22, 1, 0.36, 1);
  filter: drop-shadow(0 0 5px rgba(196, 102, 255, 0.3));
}

.gauge-ticks {
  position: absolute;
  inset: 6px;
  border-radius: 9999px;
  transform: rotate(-90deg);
  -webkit-mask: radial-gradient(circle, transparent 73%, #000 73.6%, #000 74.7%, transparent 75.4%);
  mask: radial-gradient(circle, transparent 73%, #000 73.6%, #000 74.7%, transparent 75.4%);
  background: repeating-conic-gradient(rgba(148, 163, 184, 0.13) 0deg 0.8deg, transparent 0.8deg 16deg);
}

.gauge-center::before {
  content: '';
  position: absolute;
  inset: 23%;
  border-radius: 9999px;
  background:
    radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.74) 0%, rgba(255, 255, 255, 0.16) 45%, rgba(255, 255, 255, 0.06) 100%),
    linear-gradient(170deg, rgba(248, 250, 252, 0.52) 0%, rgba(241, 245, 249, 0.24) 100%);
  border: 1px solid rgba(255, 255, 255, 0.68);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    inset 0 -10px 16px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px) saturate(1.15);
  -webkit-backdrop-filter: blur(8px) saturate(1.15);
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
  font-weight: 700;
  color: #111827;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.45);
}

.gauge-value-number {
  font-size: 1.18rem;
  letter-spacing: -0.03em;
}

.gauge-value-unit {
  margin-left: 1px;
  font-size: 0.68rem;
  font-weight: 650;
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
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 600;
}

.gauge-meta-target {
  margin-top: 2px;
  font-size: 0.8rem;
  color: #1f3a8a;
  font-weight: 650;
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
  background:
    radial-gradient(circle at 28% 22%, rgba(148, 163, 184, 0.28) 0%, rgba(51, 65, 85, 0.2) 45%, rgba(15, 23, 42, 0.28) 100%),
    linear-gradient(170deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.34) 100%);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(226, 232, 240, 0.18),
    inset 0 -10px 16px rgba(2, 6, 23, 0.42);
}

:global(.dark) .gauge-track {
  stroke: rgba(71, 85, 105, 0.5);
}

:global(.dark) .gauge-value {
  color: #f1f5f9;
  text-shadow: none;
}

:global(.dark) .gauge-value-unit,
:global(.dark) .gauge-meta-label {
  color: #94a3b8;
}

:global(.dark) .gauge-meta-target {
  color: #c7d2fe;
}
</style>
