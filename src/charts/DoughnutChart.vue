<template>
  <div class="gauge-wrap" :style="gaugeWrapStyle">
    <div class="gauge-core">
      <div class="gauge-halo" :style="haloStyle"></div>
      <div class="gauge-prism"></div>
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
      <div v-if="label" class="gauge-meta-label" :style="metaLabelStyle">{{ label }}</div>
      <div v-if="targetValue !== undefined" class="gauge-meta-target" :style="metaTargetStyle">{{ formatTarget(targetValue) }}万元</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDark } from '@vueuse/core'

const props = defineProps({
  value: { type: Number, default: 0 },
  target: { type: Number, default: 100 },
  selectedMonth: { type: Number, default: 12 },
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

const timelinePlanPercent = computed(() => {
  const month = Number(props.selectedMonth)
  if (Number.isFinite(month) && month > 0) {
    const clampedMonth = Math.min(Math.max(month, 1), 12)
    return (clampedMonth / 12) * 100
  }

  const t = Number(props.target)
  return Number.isFinite(t) && t > 0 ? t : 100
})

const gaugeColor = computed(() => {
  const plan = timelinePlanPercent.value
  if (safePercent.value >= plan) return props.color[0] || 'rgba(76, 175, 80, 0.7)'
  if (safePercent.value > plan * 0.8) return props.color[1] || 'rgba(255, 193, 7, 0.7)'
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
  background: `radial-gradient(circle at 50% 45%, ${gaugeColor.value}44 0%, transparent 68%)`,
}))

const withAlpha = (color, alpha) => {
  const c = String(color || '').trim()
  const rgbaMatch = c.match(/^rgba\(([^)]+)\)$/i)
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',').map((s) => s.trim())
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
  }
  const rgbMatch = c.match(/^rgb\(([^)]+)\)$/i)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((s) => s.trim())
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
  }
  if (/^#[0-9a-f]{6}$/i.test(c)) {
    const r = parseInt(c.slice(1, 3), 16)
    const g = parseInt(c.slice(3, 5), 16)
    const b = parseInt(c.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return c
}

const gaugeWrapStyle = computed(() => ({
  '--gauge-size': sizePx.value,
  '--gauge-accent': withAlpha(gaugeColor.value, 1),
  '--gauge-accent-soft': withAlpha(gaugeColor.value, 0.25),
  '--gauge-accent-glow': withAlpha(gaugeColor.value, 0.58),
  '--gauge-overflow-accent': withAlpha(overflowColor.value, 1),
  '--gauge-overflow-soft': 'transparent',
}))

const formatTarget = (v) => {
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return Math.round(n)
}

const isDark = useDark()

const metaLabelStyle = computed(() => ({
  color: isDark.value ? '#f1f5f9' : '#334155',
  textShadow: isDark.value ? '0 1px 2px rgba(2, 6, 23, 0.45)' : 'none',
}))

const metaTargetStyle = computed(() => ({
  color: isDark.value ? '#ffffff' : '#334155',
  textShadow: isDark.value ? '0 1px 2px rgba(2, 6, 23, 0.55)' : 'none',
}))
</script>

<style scoped>
.gauge-wrap {
  position: relative;
  width: var(--gauge-size);
  --gauge-text-color: #334155;
  --gauge-text-color-dark: #ffffff;
  --gauge-text-muted-dark: #e2e8f0;
  --gauge-meta-label-dark: #e2e8f0;
  --gauge-meta-target-dark: #ffffff;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.gauge-core {
  position: relative;
  width: var(--gauge-size);
  height: var(--gauge-size);
  border-radius: 9999px;
  isolation: isolate;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.16) 0%, rgba(226, 232, 240, 0.07) 44%, rgba(148, 163, 184, 0.03) 100%),
    radial-gradient(circle at 76% 78%, var(--gauge-overflow-soft) 0%, transparent 42%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.28),
    0 0 22px var(--gauge-accent-soft);
  backdrop-filter: blur(6px) saturate(1.15);
  -webkit-backdrop-filter: blur(6px) saturate(1.15);
}

.gauge-prism {
  position: absolute;
  inset: -3%;
  border-radius: 9999px;
  background: conic-gradient(
    from 30deg,
    var(--gauge-accent-soft) 0deg,
    rgba(56, 189, 248, 0.16) 70deg,
    rgba(14, 165, 233, 0.08) 120deg,
    var(--gauge-overflow-soft) 200deg,
    rgba(244, 114, 182, 0.1) 260deg,
    var(--gauge-accent-soft) 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 64%, #000 71%, #000 76%, transparent 82%);
  mask: radial-gradient(circle, transparent 64%, #000 71%, #000 76%, transparent 82%);
  filter: blur(0.8px) saturate(1.25);
  opacity: 0.95;
  pointer-events: none;
  mix-blend-mode: screen;
  animation: prismSpin 9s linear infinite;
}

.gauge-core::before {
  content: '';
  position: absolute;
  inset: 2%;
  border-radius: 9999px;
  background:
    repeating-conic-gradient(from 0deg, rgba(125, 211, 252, 0.1) 0deg 1.4deg, transparent 1.4deg 10deg),
    radial-gradient(circle at 26% 20%, rgba(255, 255, 255, 0.54) 0%, rgba(255, 255, 255, 0.1) 28%, transparent 56%),
    radial-gradient(circle at 74% 80%, var(--gauge-accent-soft) 0%, transparent 46%);
  pointer-events: none;
  mix-blend-mode: plus-lighter;
}

.gauge-core::after {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: 9999px;
  background: conic-gradient(from 205deg, rgba(34, 211, 238, 0) 0deg, rgba(34, 211, 238, 0.34) 52deg, rgba(244, 114, 182, 0.18) 92deg, rgba(255, 255, 255, 0) 122deg);
  -webkit-mask: radial-gradient(circle, transparent 69%, #000 72%, #000 74%, transparent 77%);
  mask: radial-gradient(circle, transparent 69%, #000 72%, #000 74%, transparent 77%);
  pointer-events: none;
  animation: liquidSheen 4s ease-in-out infinite;
}

.gauge-halo {
  position: absolute;
  inset: -16%;
  border-radius: 9999px;
  filter: blur(18px) saturate(1.25);
  opacity: 0.72;
  mix-blend-mode: screen;
  animation: cyberPulse 2.8s ease-in-out infinite;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-track {
  fill: none;
  stroke: rgba(125, 211, 252, 0.24);
  stroke-width: 10;
  opacity: 0.88;
}

.gauge-progress {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.78s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease;
  filter: drop-shadow(0 0 10px var(--gauge-accent-glow)) drop-shadow(0 0 20px var(--gauge-accent-soft));
}

.gauge-overflow-track {
  fill: none;
  stroke: rgba(216, 180, 254, 0.42);
  stroke-width: 5;
}

.gauge-overflow-progress {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.78s cubic-bezier(0.22, 1, 0.36, 1);
  filter: none;
}

.gauge-ticks {
  position: absolute;
  inset: 6px;
  border-radius: 9999px;
  transform: rotate(-90deg);
  -webkit-mask: radial-gradient(circle, transparent 73%, #000 73.6%, #000 74.7%, transparent 75.4%);
  mask: radial-gradient(circle, transparent 73%, #000 73.6%, #000 74.7%, transparent 75.4%);
  background: repeating-conic-gradient(rgba(148, 163, 184, 0.2) 0deg 0.9deg, transparent 0.9deg 16deg);
  opacity: 0.8;
}

.gauge-center::before {
  content: '';
  position: absolute;
  inset: 22.5%;
  border-radius: 9999px;
  background:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.2) 42%, rgba(255, 255, 255, 0.08) 100%),
    linear-gradient(170deg, rgba(236, 254, 255, 0.55) 0%, rgba(224, 231, 255, 0.32) 100%);
  border: 1px solid rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.16), 0 0 16px rgba(56, 189, 248, 0.2);
  backdrop-filter: blur(12px) saturate(1.22);
  -webkit-backdrop-filter: blur(12px) saturate(1.22);
  z-index: 0;
}

.gauge-center::after {
  content: '';
  position: absolute;
  inset: 24.5% 25% 53% 25%;
  border-radius: 9999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(125, 211, 252, 0.16) 100%);
  pointer-events: none;
  z-index: 1;
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
  animation: gaugeFloat 4.2s ease-in-out infinite;
}

.gauge-value {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  line-height: 1;
  font-weight: 700;
  color: var(--gauge-text-color);
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
  color: var(--gauge-text-color);
}

.gauge-meta-outside {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  line-height: 1.16;
}

.gauge-meta-label {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  color: var(--gauge-text-color);
  font-weight: 650;
  opacity: 0.96;
}

.gauge-meta-target {
  margin-top: 2px;
  font-size: 0.9rem;
  color: var(--gauge-text-color);
  font-weight: 700;
  letter-spacing: 0.01em;
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
    radial-gradient(circle at 28% 22%, rgba(226, 232, 240, 0.24) 0%, rgba(71, 85, 105, 0.2) 45%, rgba(15, 23, 42, 0.3) 100%),
    linear-gradient(170deg, rgba(15, 23, 42, 0.64) 0%, rgba(2, 6, 23, 0.46) 100%);
  border-color: rgba(125, 211, 252, 0.35);
  box-shadow: inset 0 0 0 1px rgba(125, 211, 252, 0.24), 0 0 20px rgba(56, 189, 248, 0.24);
}

:global(.dark) .gauge-core {
  background:
    radial-gradient(circle at 32% 24%, rgba(148, 163, 184, 0.16) 0%, rgba(51, 65, 85, 0.14) 34%, rgba(30, 41, 59, 0.08) 70%, rgba(2, 6, 23, 0.02) 100%),
    radial-gradient(circle at 76% 78%, var(--gauge-overflow-soft) 0%, transparent 48%);
  box-shadow:
    inset 0 0 0 1px rgba(125, 211, 252, 0.18),
    0 0 26px rgba(56, 189, 248, 0.2);
}

:global(.dark) .gauge-prism {
  opacity: 0.96;
  filter: blur(0.6px) saturate(1.35);
}

:global(.dark) .gauge-track {
  stroke: rgba(125, 211, 252, 0.28);
}

:global(.dark) .gauge-ticks {
  background: repeating-conic-gradient(rgba(125, 211, 252, 0.32) 0deg 0.9deg, transparent 0.9deg 16deg);
}

:global(.dark) .gauge-value {
  color: var(--gauge-text-color-dark);
  text-shadow: none;
}

:global(.dark) .gauge-value-unit,
:global(.dark) .gauge-meta-label {
  color: var(--gauge-meta-label-dark);
}

:global(.dark) .gauge-meta-target {
  color: var(--gauge-meta-target-dark);
  text-shadow: 0 1px 2px rgba(2, 6, 23, 0.45);
}

@keyframes liquidSheen {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
    opacity: 0.88;
  }
  50% {
    transform: rotate(4deg) scale(1.01);
    opacity: 1;
  }
}

@keyframes prismSpin {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.01);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

@keyframes cyberPulse {
  0%,
  100% {
    opacity: 0.62;
    transform: scale(1);
  }
  50% {
    opacity: 0.78;
    transform: scale(1.015);
  }
}
</style>
