<template>
	<section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
		<header class="relative overflow-hidden px-4 py-3 border-b border-emerald-200/70 dark:border-emerald-500/20 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-lime-50 dark:from-slate-900/85 dark:via-emerald-950/25 dark:to-teal-950/25">
			<div class="pointer-events-none absolute -left-10 top-1/2 h-16 w-28 -translate-y-1/2 rounded-full bg-emerald-300/20 blur-2xl dark:bg-emerald-400/15"></div>
			<div class="pointer-events-none absolute right-4 top-1 h-20 w-20 rounded-full bg-teal-300/25 blur-2xl dark:bg-teal-400/15"></div>
			<div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/75 to-transparent dark:via-emerald-300/60"></div>
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-emerald-100/90 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-300/50 dark:ring-emerald-400/30 shadow-[0_0_18px_rgba(16,185,129,0.24)] dark:shadow-[0_0_22px_rgba(52,211,153,0.18)]">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path  d="M4 20V10" />
						<path  d="M10 20V4" />
						<path  d="M16 20v-8" />
						<path  d="M22 20v-5" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-extrabold tracking-[0.03em] text-slate-800 dark:text-slate-100">部门利润</h3>
					<p class="text-[10px] tracking-[0.2em] uppercase text-emerald-500 dark:text-emerald-300">DEPARTMENT PROFIT</p>
				</div>
			</div>
			<div class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 bg-white/60 dark:bg-slate-900/45 rounded-full px-3 py-1 ring-1 ring-emerald-200/70 dark:ring-emerald-500/25 backdrop-blur-sm">
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></i>盈利</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-rose-400"></i>亏损</span>
			</div>
		</header>

		<div class="p-3 h-[300px] relative bg-white dark:bg-gray-800">
			<canvas ref="canvasRef"></canvas>
			<div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">暂无数据</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
	Chart,
	BarController,
	BarElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
} from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
	rows: { type: Array, default: () => [] },
})

const emit = defineEmits(['bar-click'])

const canvasRef = ref(null)
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

const buildGradient = (ctx, area, colors) => {
	const g = ctx.createLinearGradient(0, area.bottom, 0, area.top)
	g.addColorStop(0, colors[0])
	g.addColorStop(1, colors[1])
	return g
}

const valuePlugin = {
	id: `profit-label-${Math.random().toString(36).slice(2)}`,
	afterDatasetsDraw(c) {
		const ds = c.data.datasets[0]
		if (!ds) return

		const meta = c.getDatasetMeta(0)
		const { ctx } = c
		ctx.save()
		ctx.font = 'bold 11px sans-serif'
		ctx.textAlign = 'center'

		meta.data.forEach((bar, i) => {
			const value = toNum(ds.data[i])
			if (!Number.isFinite(value)) return

			const x = bar.x
			const valueText = `${Math.round(value)}`
			const unitText = '万元'
			const barHeight = Math.abs(bar.base - bar.y)
			const showOutside = barHeight < 30

			if (showOutside) {
				const isPositive = value >= 0
				const badgeWidth = Math.max(ctx.measureText(`${valueText}${unitText}`).width + 18, 56)
				const badgeHeight = 20
				const by = isPositive ? bar.y - 28 : bar.base + 8
				const bx = x - badgeWidth / 2

				ctx.fillStyle = isPositive ? 'rgba(236, 253, 245, 0.96)' : 'rgba(254, 242, 242, 0.96)'
				ctx.strokeStyle = isPositive ? 'rgba(110, 231, 183, 0.95)' : 'rgba(252, 165, 165, 0.95)'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.roundRect(bx, by, badgeWidth, badgeHeight, 5)
				ctx.fill()
				ctx.stroke()

				ctx.fillStyle = isPositive ? '#047857' : '#b91c1c'
				ctx.font = 'bold 11px sans-serif'
				const arrow = isPositive ? '↑' : '↓'
				ctx.fillText(`${arrow}${valueText}`, x, by + 13)
			} else {
				const centerY = bar.y + (bar.base - bar.y) / 2
				ctx.fillStyle = '#f8fafc'
				ctx.font = 'bold 11px sans-serif'
				ctx.fillText(valueText, x, centerY - 3)
				ctx.fillText(unitText, x, centerY + 11)
			}
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

	const labels = props.rows.map((r) => r.org_name)
	const profits = props.rows.map((r) => toNum(r.department_profit))

	const ctx = canvasEl.getContext('2d')
	if (!ctx) return

	chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels,
			datasets: [
				{
					label: '利润',
					data: profits,
					borderRadius: 6,
					categoryPercentage: 0.8,
					barPercentage: 0.86,
					maxBarThickness: 48,
					backgroundColor: (context) => {
						const area = context.chart.chartArea
						if (!area) return '#9acfa1'
						const v = toNum(profits[context.dataIndex])
						if (v >= 0) return buildGradient(context.chart.ctx, area, ['rgba(98, 194, 105, 0.95)', 'rgba(176, 227, 180, 0.95)'])
						return buildGradient(context.chart.ctx, area, ['rgba(233, 102, 102, 0.95)', 'rgba(249, 173, 173, 0.95)'])
					},
				},
			],
		},
		options: {
			maintainAspectRatio: false,
			onClick: (_evt, elements) => {
				if (!elements.length) return
				const idx = elements[0].index
				emit('bar-click', props.rows[idx])
			},
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: (context) => `利润: ${toNum(context.parsed.y).toFixed(0)}万元`,
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: { callback: (v) => `${v}万元` },
					grid: { color: '#eef2f7' },
				},
				x: {
					ticks: { maxRotation: 20, minRotation: 20, color: '#475569' },
					grid: { display: false },
				},
			},
		},
		plugins: [valuePlugin],
	})
}

watch(() => props.rows, () => renderChart(), { deep: true })

onMounted(() => renderChart())
onBeforeUnmount(() => destroyChart())
</script>
