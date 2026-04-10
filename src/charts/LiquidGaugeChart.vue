<template>
  <DoughnutChart01
    :value="value"
    :target="target"
    :target-value="targetValue"
    :color="color"
    :width="width"
    :height="height"
    :label="label"
  />
</template>

<script setup>
import DoughnutChart01 from './DoughnutChart.vue'

defineProps({
  value: { type: Number, default: 0 },
  target: { type: Number, default: 100 },
  targetValue: { type: [Number, String], default: 0 },
  color: { type: Array, default: () => ['rgba(76, 175, 80, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)'] },
  width: { type: [Number, String], default: 100 },
  height: { type: [Number, String], default: 100 },
  label: { type: String, default: '' },
  selectedMonth: { type: Number, default: 12 },
})
</script>
