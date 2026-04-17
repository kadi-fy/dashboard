<template>
	<section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
		<header class="relative overflow-hidden px-4 py-3  flex items-center justify-between bg-gradient-to-r from-slate-50 via-cyan-50/70 to-blue-50/80 dark:from-slate-900/80 dark:via-cyan-950/30 dark:to-slate-900/70">
			<div class="pointer-events-none absolute -left-10 -top-8 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl dark:bg-cyan-400/15"></div>
			<div class="pointer-events-none absolute right-6 -bottom-10 h-20 w-20 rounded-full bg-blue-400/20 blur-2xl dark:bg-blue-500/15"></div>
			<div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent dark:via-cyan-300/60"></div>
			<div class="flex items-center gap-2">
				<div :class="iconClass" class="relative h-8 w-8 rounded-lg flex items-center justify-center ring-1 ring-cyan-300/40 dark:ring-cyan-400/30 shadow-[0_0_16px_rgba(34,211,238,0.25)] dark:shadow-[0_0_20px_rgba(56,189,248,0.18)]">
					<DotLottieVue
						class="h-7 w-7"
						autoplay
						loop
						:src="barLottieSrc"
					/>
				</div>
				<div class="relative">
					<h3 class="text-lg font-extrabold tracking-[0.03em] text-slate-800 dark:text-slate-100">{{ title }}</h3>
					<p class="text-[10px] tracking-[0.2em] uppercase" :class="subtitleClass">{{ subtitle }}</p>
				</div>
			</div>
			<div class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 bg-white/55 dark:bg-slate-900/45 rounded-full px-3 py-1 ring-1 ring-cyan-200/70 dark:ring-cyan-500/20 backdrop-blur-sm">
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></i>达标</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"></i>预警</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-rose-400"></i>未达标</span>
			</div>
		</header>

		<div class="h-[2px] w-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden">
			<div
				class="h-full transition-all duration-500 ease-out"
				:class="metricType === 'charge' ? 'bg-blue-500' : 'bg-violet-500'"
				:style="completionBarStyle"
			></div>
		</div>

		<div class="p-3 h-[300px] relative bg-white dark:bg-gray-800">
			<canvas ref="canvasRef"></canvas>
			<div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">暂无数据</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import {
	Chart,
	BarController,
	BarElement,
	LineController,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
} from 'chart.js'

Chart.register(
	BarController,
	BarElement,
	LineController,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
)

const props = defineProps({
	title: { type: String, required: true },
	subtitle: { type: String, required: true },
	metricType: { type: String, required: true },
	selectedMonth: { type: Number, required: true },
	rows: { type: Array, default: () => [] },
	actualKey: { type: String, required: true },
	planKey: { type: String, required: true },
	clickable: { type: Boolean, default: false },
})

const emit = defineEmits(['bar-click'])

const canvasRef = ref(null)
const barLottieSrc = '/lottie/wired-gradient-153-bar-chart-hover-pinch.json'
let chart = null

const destroyChart = () => {
	if (chart) {
		chart.destroy()
		chart = null
	}
}

const toNum = (v) => {
	const n = parseFloat(v)
	return Number.isFinite(n) ? n : 0
}

const isEmpty = computed(() => !props.rows || props.rows.length === 0)

const overallCompletionRate = computed(() => {
	const list = Array.isArray(props.rows) ? props.rows : []
	if (!list.length) return 0

	const totalActual = list.reduce((sum, row) => sum + toNum(row?.[props.actualKey]), 0)
	const totalPlan = list.reduce((sum, row) => sum + toNum(row?.[props.planKey]), 0)
	if (totalPlan <= 0) return 0

	return (totalActual / totalPlan) * 100
})

const completionBarStyle = computed(() => {
	const bounded = Math.min(Math.max(overallCompletionRate.value, 0), 100)
	return { width: `${bounded}%` }
})

const iconClass = computed(() => {
	if (props.metricType === 'charge') return 'bg-blue-100 text-blue-600'
	return 'bg-violet-100 text-violet-600'
})

const subtitleClass = computed(() => {
	if (props.metricType === 'charge') return 'text-blue-500'
	return 'text-violet-500'
})

const buildGradient = (ctx, area, colors) => {
	const g = ctx.createLinearGradient(0, area.bottom, 0, area.top)
	g.addColorStop(0, colors[0])
	g.addColorStop(1, colors[1])
	return g
}

const getCompletionColors = (completion, monthNumber) => {
	const expected = monthNumber / 12
	if (completion >= expected) return ['rgba(120, 202, 129, 0.95)', 'rgba(188, 231, 190, 0.95)']
	if (completion >= expected * 0.8) return ['rgba(236, 191, 88, 0.95)', 'rgba(247, 223, 162, 0.95)']
	return ['rgba(242, 127, 127, 0.95)', 'rgba(250, 192, 192, 0.95)']
}

const getCompletionLabelTheme = (completion, monthNumber) => {
	const expected = monthNumber / 12
	if (completion >= expected) {
		return { bg: '#ecfdf3', border: '#86efac', text: '#15803d' }
	}
	if (completion >= expected * 0.8) {
		return { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' }
	}
	return { bg: '#fff1f2', border: '#fda4af', text: '#be123c' }
}

const completionLabelPlugin = {
	id: `completion-label-${Math.random().toString(36).slice(2)}`,
	afterDatasetsDraw(c) {
		const barDsIndex = c.data.datasets.findIndex((d) => d.type === 'bar')
		if (barDsIndex < 0) return

		const ds = c.data.datasets[barDsIndex]
		const meta = c.getDatasetMeta(barDsIndex)
		const { ctx } = c
		ctx.save()
		ctx.font = 'bold 11px sans-serif'
		ctx.textAlign = 'center'

		meta.data.forEach((bar, i) => {
			const value = ds.actualValues?.[i]
			const pct = ds.percentValues?.[i]
			if (!Number.isFinite(value) || !Number.isFinite(pct)) return
			const completion = toNum(pct) / 100
			const labelTheme = getCompletionLabelTheme(completion, props.selectedMonth)

			const x = bar.x
			const y = bar.y
			const pctText = `${Math.round(pct)}%`
			const w = ctx.measureText(pctText).width + 14
			const h = 20
			const bx = x - w / 2
			const by = y - 25

			ctx.fillStyle = labelTheme.bg
			ctx.strokeStyle = labelTheme.border
			ctx.lineWidth = 1
			ctx.beginPath()
			ctx.roundRect(bx, by, w, h, 5)
			ctx.fill()
			ctx.stroke()

			ctx.fillStyle = labelTheme.text
			ctx.fillText(pctText, x, by + 14)
			ctx.fillStyle = '#f8fafc'
			const centerY = y + bar.height / 2
			ctx.fillText(`${Math.round(value)}`, x, centerY - 3)
			ctx.fillText('万元', x, centerY + 9)
		})

		ctx.restore()
	},
}

const renderChart = () => {
	const canvasEl = canvasRef.value
	if (!canvasEl || !canvasEl.isConnected) {
		destroyChart()
		return
	}
	destroyChart()
	if (isEmpty.value) return

	const rows = props.rows
	const labels = rows.map((r) => r.org_name)
	const actuals = rows.map((r) => toNum(r[props.actualKey]))
	const plans = rows.map((r) => toNum(r[props.planKey]))
	const rawRates = actuals.map((v, i) => {
		const plan = plans[i]
		if (plan <= 0) return 0
		const result = (v / plan) * 100
		return Number.isFinite(result) ? result : 0
	})
	const rates = rawRates.map((r) => Math.max(r, 0))

	const maxRate = Math.max(...rates)
	const yMax = Math.ceil((maxRate * 1.08) / 10) * 10
	const yStep = 10

	const ctx = canvasEl.getContext('2d')
	if (!ctx) return

	chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels,
			datasets: [
				{
					type: 'bar',
					label: '今年',
					data: rates,
					actualValues: actuals,
					percentValues: rates,
					borderRadius: 6,
						categoryPercentage: 0.85,
						barPercentage: 0.8,
						maxBarThickness: 62,
					order: 1,
					backgroundColor: (context) => {
						const area = context.chart.chartArea
						if (!area) return '#9acfa1'
						const completion = toNum(rates[context.dataIndex]) / 100
						const colors = getCompletionColors(completion, props.selectedMonth)
						return buildGradient(context.chart.ctx, area, colors)
					},
				},
			],
		},
		options: {
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: (context) => {
							const i = context.dataIndex
							return `${context.dataset.label}: ${Math.round(actuals[i])}万元 (${toNum(rates[i]).toFixed(1)}%)`
						},
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					max: yMax,
					ticks: { stepSize: yStep, callback: (v) => `${v}%` },
					grid: { color: '#eef2f7' },
				},
				x: {
					ticks: { maxRotation: 20, minRotation: 20, color: '#475569' },
					grid: { display: false },
				},
			},
			onClick: (_evt, elements) => {
				if (!props.clickable || !elements.length) return
				const idx = elements[0].index
				emit('bar-click', rows[idx])
			},
		},
		plugins: [completionLabelPlugin],
	})
}

watch(
	() => [props.rows, props.selectedMonth, props.actualKey, props.planKey],
	() => renderChart(),
	{ deep: true },
)

onMounted(() => renderChart())
onBeforeUnmount(() => destroyChart())
</script>
