<template>
  <div class="flex items-center justify-between gap-4" :class="wrapperClass">
    <div class="min-w-0">
      <div class="flex items-center gap-3">
        <span class="h-6 w-1.5 rounded-full" :class="accentClass"></span>
        <h2 class="font-bold tracking-tight" :class="titleClass">{{ title }}</h2>
      </div>
      <p v-if="subtitle" class="mt-1 pl-[18px] text-[10px] font-semibold uppercase tracking-[0.22em]" :class="subtitleClass">
        {{ subtitle }}
      </p>
    </div>

    <div class="flex min-w-[80px] flex-1 items-center gap-2">
      <span class="h-px flex-1 rounded-full" :class="lineClass"></span>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'blue',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const toneMap = {
  blue: {
    accent: 'bg-blue-500 dark:bg-blue-400',
    subtitle: 'text-blue-500/80 dark:text-blue-300/80',
    line: 'bg-gradient-to-r from-blue-300/80 via-blue-100/60 to-transparent dark:from-blue-500/60 dark:via-blue-700/30',
  },
  emerald: {
    accent: 'bg-emerald-500 dark:bg-emerald-400',
    subtitle: 'text-emerald-500/80 dark:text-emerald-300/80',
    line: 'bg-gradient-to-r from-emerald-300/80 via-emerald-100/60 to-transparent dark:from-emerald-500/60 dark:via-emerald-700/30',
  },
  violet: {
    accent: 'bg-violet-500 dark:bg-violet-400',
    subtitle: 'text-violet-500/80 dark:text-violet-300/80',
    line: 'bg-gradient-to-r from-violet-300/80 via-violet-100/60 to-transparent dark:from-violet-500/60 dark:via-violet-700/30',
  },
}

const palette = computed(() => toneMap[props.tone] || toneMap.blue)

const wrapperClass = computed(() => (props.compact ? 'py-1' : 'py-2'))
const titleClass = computed(() => (props.compact
  ? 'text-base text-gray-800 dark:text-gray-100'
  : 'text-2xl text-gray-800 dark:text-gray-100'))
const accentClass = computed(() => palette.value.accent)
const subtitleClass = computed(() => palette.value.subtitle)
const lineClass = computed(() => palette.value.line)
</script>
