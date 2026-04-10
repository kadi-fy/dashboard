<template>
  <div class="gauge-wrap" :style="{ width: sizePx, height: sizePx }">
    <div class="gauge-ring" :style="ringStyle"></div>
    <div class="gauge-center">
      <div class="gauge-value">{{ displayPercent }}%</div>
      <div class="gauge-label">{{ label }}</div>
      <div v-if="targetValue !== undefined" class="gauge-target">{{ formatTarget(targetValue) }}万元</div>
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

const gaugeColor = computed(() => {
  if (safePercent.value >= 100) return props.color[0] || 'rgba(76, 175, 80, 0.7)'
  if (safePercent.value >= 80) return props.color[1] || 'rgba(255, 193, 7, 0.7)'
  return props.color[2] || 'rgba(244, 67, 54, 0.7)'
})

const ringStyle = computed(() => {
  const p = Math.min(safePercent.value, 100)
  return {
    background: `conic-gradient(${gaugeColor.value} ${p * 3.6}deg, #e5e7eb ${p * 3.6}deg 360deg)`,
  }
})

const formatTarget = (v) => {
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return Math.round(n)
}
</script>

<style scoped>
.gauge-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gauge-ring {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  position: relative;
}

.gauge-ring::after {
  content: '';
  position: absolute;
  inset: 12%;
  border-radius: 9999px;
  background: white;
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
}

.gauge-value {
  font-size: 1.1rem;
  line-height: 1;
  font-weight: 700;
  color: #1f2937;
}

.gauge-label {
  margin-top: 0.2rem;
  font-size: 0.65rem;
  color: #6b7280;
}

.gauge-target {
  margin-top: 0.15rem;
  font-size: 0.65rem;
  color: #374151;
  font-weight: 600;
}
</style>
