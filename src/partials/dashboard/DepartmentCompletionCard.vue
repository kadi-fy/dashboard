<template>
	<section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
		<header class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div :class="iconClass" class="h-8 w-8 rounded-lg flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path v-if="metricType === 'charge'" d="M4 20V10" />
						<path v-if="metricType === 'charge'" d="M10 20V4" />
						<path v-if="metricType === 'charge'" d="M16 20v-8" />
						<path v-if="metricType === 'charge'" d="M22 20v-5" />
						<path v-if="metricType === 'contract'" d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z" />
						<path v-if="metricType === 'contract'" d="M15 3v5h5" />
						<path v-if="metricType === 'contract'" d="M8 13h8" />
						<path v-if="metricType === 'contract'" d="M8 17h5" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ title }}</h3>
					<p class="text-[10px] tracking-wider" :class="subtitleClass">{{ subtitle }}</p>
				</div>
			</div>
			<div class="text-xs text-gray-500 flex items-center gap-3">
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></i>达标</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"></i>预警</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-rose-400"></i>未达标</span>
			</div>
		</header>

		<div class="h-[2px]" :class="metricType === 'charge' ? 'bg-blue-500' : 'bg-violet-500'"></div>

		<div class="p-3 h-[300px] relative bg-white dark:bg-gray-800">
			<canvas ref="canvasRef"></canvas>
			<div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">暂无数据</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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
let chart = null

const toNum = (v) => {
	const n = parseFloat(v)
	return Number.isFinite(n) ? n : 0
}

const isEmpty = computed(() => !props.rows || props.rows.length === 0)

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

			const x = bar.x
			const y = bar.y
			const pctText = `${Math.round(pct)}%`
			const w = ctx.measureText(pctText).width + 14
			const h = 20
			const bx = x - w / 2
			const by = y - 25

			ctx.fillStyle = '#f0fdf4'
			ctx.strokeStyle = '#bfdbfe'
			ctx.lineWidth = 1
			ctx.beginPath()
			ctx.roundRect(bx, by, w, h, 5)
			ctx.fill()
			ctx.stroke()

			ctx.fillStyle = '#16a34a'
			ctx.fillText(pctText, x, by + 14)
			ctx.fillStyle = '#f8fafc'
			ctx.fillText(`${Math.round(value)}`, x, y + 20)
			ctx.fillText('万元', x, y + 34)
		})

		ctx.restore()
	},
}

const renderChart = () => {
	if (!canvasRef.value) return
	if (chart) {
		chart.destroy()
		chart = null
	}
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

	const ctx = canvasRef.value.getContext('2d')
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
onUnmounted(() => {
	if (chart) chart.destroy()
})
</script>
