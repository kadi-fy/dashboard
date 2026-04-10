<template>
	<section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
		<header class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="12" cy="12" r="10" />
						<path d="M12 6v12" />
						<path d="M8 12h8" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">部门成本</h3>
					<p class="text-[10px] tracking-wider text-orange-500">DEPARTMENT COST</p>
				</div>
			</div>
			<div class="text-xs text-gray-500 flex items-center gap-3">
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-sky-400"></i>直接成本</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"></i>共摊成本</span>
			</div>
		</header>

		<div class="h-[2px] bg-orange-400"></div>

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

			// 顶端显示合计值
			ctx.fillStyle = '#0ea5e9'
			ctx.fillText(`${total.toFixed(1)}`, bar.x, totalTop - 8)

			// 直接成本值显示在直接成本柱体中间
			if (directVal > 0) {
				const directCenterY = (bar.base + directTop) / 2
				ctx.fillStyle = '#f8fafc'
				ctx.fillText(`${directVal.toFixed(1)}`, bar.x, directCenterY + 4)
			}

			// 共摊成本值显示在共摊成本柱体中间
			if (sharedVal > 0 && sharedBar) {
				const sharedCenterY = (directTop + sharedBar.y) / 2
				ctx.fillStyle = '#7c2d12'
				ctx.fillText(`${sharedVal.toFixed(1)}`, bar.x, sharedCenterY + 4)
			}
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

	const labels = props.rows.map((r) => r.org_name)
	const direct = props.rows.map((r) => toNum(r.direct_cost_adjusted))
	const shared = props.rows.map((r) => toNum(r.allocated_cost))

	const ctx = canvasRef.value.getContext('2d')
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
					borderRadius: 5,
						categoryPercentage: 0.92,
						barPercentage: 0.95,
						maxBarThickness: 62,
					backgroundColor: (context) => {
						const area = context.chart.chartArea
						if (!area) return '#6db8f5'
						return buildGradient(context.chart.ctx, area, ['rgba(54, 162, 235, 0.95)', 'rgba(158, 214, 255, 0.95)'])
					},
				},
				{
					label: '共摊成本',
					data: shared,
					stack: 'cost',
					borderRadius: 5,
						categoryPercentage: 0.92,
						barPercentage: 0.95,
						maxBarThickness: 62,
					backgroundColor: (context) => {
						const area = context.chart.chartArea
						if (!area) return '#f2c16f'
						return buildGradient(context.chart.ctx, area, ['rgba(245, 176, 65, 0.95)', 'rgba(253, 220, 158, 0.95)'])
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
				tooltip: {
					callbacks: {
						label: (context) => `${context.dataset.label}: ${toNum(context.parsed.y).toFixed(1)}万元`,
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
		plugins: [totalLabelPlugin],
	})
}

watch(() => props.rows, () => renderChart(), { deep: true })

onMounted(() => renderChart())
onUnmounted(() => {
	if (chart) chart.destroy()
})
</script>
