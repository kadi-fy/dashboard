<template>
	<section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
		<header class="relative overflow-hidden px-4 py-3 border-b border-amber-200/70 dark:border-amber-500/20 flex items-center justify-between bg-gradient-to-r from-amber-50 via-orange-50 to-sky-50 dark:from-slate-900/85 dark:via-amber-950/20 dark:to-sky-950/25">
			<div class="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-amber-300/25 blur-2xl dark:bg-amber-400/15"></div>
			<div class="pointer-events-none absolute right-8 -bottom-10 h-24 w-24 rounded-full bg-sky-300/25 blur-2xl dark:bg-sky-400/15"></div>
			<div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent dark:via-amber-300/60"></div>
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-orange-100/90 text-orange-600 flex items-center justify-center ring-1 ring-amber-300/50 dark:ring-amber-400/30 shadow-[0_0_18px_rgba(251,191,36,0.22)] dark:shadow-[0_0_22px_rgba(245,158,11,0.18)]">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path  d="M4 20V10" />
						<path  d="M10 20V4" />
						<path  d="M16 20v-8" />
						<path  d="M22 20v-5" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-extrabold tracking-[0.03em] text-slate-800 dark:text-slate-100">部门成本</h3>
					<p class="text-[10px] tracking-[0.2em] uppercase text-orange-500 dark:text-amber-300">DEPARTMENT COST</p>
				</div>
			</div>
			<div class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 bg-white/60 dark:bg-slate-900/45 rounded-full px-3 py-1 ring-1 ring-amber-200/70 dark:ring-amber-500/25 backdrop-blur-sm">
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-sky-400"></i>直接成本</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"></i>共摊成本</span>
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

const formatAmount = (value) => {
	const n = toNum(value)
	return n >= 100 ? n.toFixed(0) : n.toFixed(1)
}

const totalLabelPlugin = {
	id: `cost-total-${Math.random().toString(36).slice(2)}`,
	afterDatasetsDraw(c) {
		const { ctx } = c
		const directMeta = c.getDatasetMeta(0)
		const sharedMeta = c.getDatasetMeta(1)
		const direct = c.data.datasets[0].data || []
		const shared = c.data.datasets[1].data || []

		ctx.save()
		ctx.font = 'bold 11px sans-serif'
		ctx.textAlign = 'center'

		directMeta.data.forEach((bar, i) => {
			if (!bar) return
			const directVal = toNum(direct[i])
			const sharedVal = toNum(shared[i])
			const total = toNum(direct[i]) + toNum(shared[i])
			const sharedBar = sharedMeta.data[i]
			const directTop = bar.y
			const totalTop = sharedBar ? Math.min(directTop, sharedBar.y) : directTop
			const directHeight = Math.abs(bar.base - bar.y)
			const sharedHeight = sharedBar ? Math.abs(directTop - sharedBar.y) : 0

			// 顶端显示合计值标签
			const totalText = `${formatAmount(total)}万`
			const badgeW = ctx.measureText(totalText).width + 14
			const badgeH = 18
			const bx = bar.x - badgeW / 2
			const by = totalTop - 20

			ctx.fillStyle = 'rgba(241, 245, 249, 0.96)'
			ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
			ctx.lineWidth = 1
			ctx.beginPath()
			ctx.roundRect(bx, by, badgeW, badgeH, 6)
			ctx.fill()
			ctx.stroke()

			ctx.fillStyle = '#0f172a'
			ctx.fillText(totalText, bar.x, by + 12)

			// 直接成本值显示在直接成本柱体中间
			if (directVal > 0 && directHeight > 18) {
				const directCenterY = (bar.base + directTop) / 2
				ctx.fillStyle = '#f8fafc'
				ctx.fillText(formatAmount(directVal), bar.x, directCenterY + 4)
			}

			// 共摊成本值显示在共摊成本柱体中间
			if (sharedVal > 0 && sharedBar && sharedHeight > 18) {
				const sharedCenterY = (directTop + sharedBar.y) / 2
				ctx.fillStyle = '#7c2d12'
				ctx.fillText(formatAmount(sharedVal), bar.x, sharedCenterY + 4)
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
	const direct = props.rows.map((r) => toNum(r.direct_cost_adjusted))
	const shared = props.rows.map((r) => toNum(r.allocated_cost))

	const ctx = canvasEl.getContext('2d')
	if (!ctx) return

	chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels,
			datasets: [
				{
					label: '直接成本',
					data: direct,
					stack: 'cost',
					borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
					borderSkipped: false,
					categoryPercentage: 0.86,
					barPercentage: 0.82,
					maxBarThickness: 56,
					backgroundColor: (context) => {
						const area = context.chart.chartArea
						if (!area) return '#6db8f5'
						return buildGradient(context.chart.ctx, area, ['rgba(56, 189, 248, 0.92)', 'rgba(186, 230, 253, 0.96)'])
					},
				},
				{
					label: '共摊成本',
					data: shared,
					stack: 'cost',
					borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
					borderSkipped: false,
					categoryPercentage: 0.86,
					barPercentage: 0.82,
					maxBarThickness: 56,
					backgroundColor: (context) => {
						const area = context.chart.chartArea
						if (!area) return '#f2c16f'
						return buildGradient(context.chart.ctx, area, ['rgba(251, 191, 36, 0.9)', 'rgba(254, 243, 199, 0.96)'])
					},
				},
			],
		},
		options: {
			maintainAspectRatio: false,
			animation: {
				duration: 650,
				easing: 'easeOutCubic',
			},
			onClick: (_evt, elements) => {
				if (!elements.length) return
				const idx = elements[0].index
				emit('bar-click', props.rows[idx])
			},
			plugins: {
				legend: { display: false },
				tooltip: {
					displayColors: true,
					padding: 10,
					backgroundColor: '#ffffff',
					titleColor: '#334155',
					bodyColor: '#334155',
					borderColor: 'rgba(148, 163, 184, 0.35)',
					borderWidth: 1,
					titleFont: { weight: 600 },
					callbacks: {
						title: (items) => items?.[0]?.label || '',
						label: (context) => `${context.dataset.label}: ${formatAmount(context.parsed.y)}万元`,
						footer: (items) => {
							const i = items?.[0]?.dataIndex
							if (i == null) return ''
							const total = toNum(direct[i]) + toNum(shared[i])
							return `合计: ${formatAmount(total)}万元`
						},
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: (v) => `${v}万`,
						color: '#64748b',
						font: { size: 11 },
					},
					grid: {
						color: 'rgba(148, 163, 184, 0.2)',
						borderDash: [4, 4],
					},
				},
				x: {
					ticks: {
						maxRotation: 20,
						minRotation: 20,
						color: '#475569',
						font: { size: 11, weight: 600 },
					},
					grid: { display: false },
				},
			},
		},
		plugins: [totalLabelPlugin],
	})
}

watch(() => props.rows, () => renderChart(), { deep: true })

onMounted(() => renderChart())
onBeforeUnmount(() => destroyChart())
</script>
