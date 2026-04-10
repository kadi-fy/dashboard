<template>
	<section class="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
		<header class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M3 3v18h18" />
						<path d="m19 9-5 5-4-4-3 3" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">部门利润</h3>
					<p class="text-[10px] tracking-wider text-emerald-500">DEPARTMENT PROFIT</p>
				</div>
			</div>
			<div class="text-xs text-gray-500 flex items-center gap-3">
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></i>盈利</span>
				<span class="flex items-center gap-1"><i class="inline-block h-2.5 w-2.5 rounded-full bg-rose-400"></i>亏损</span>
			</div>
		</header>

		<div class="h-[2px] bg-emerald-400"></div>

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
			const y = value >= 0 ? bar.y + 20 : bar.y - 10
			ctx.fillStyle = '#f8fafc'
			ctx.fillText(`${Math.round(value)}万`, x, y)
			ctx.fillText('元', x, y + 14)
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
	const profits = props.rows.map((r) => toNum(r.department_profit))

	const ctx = canvasRef.value.getContext('2d')
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
					maxBarThickness: 38,
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
onUnmounted(() => {
	if (chart) chart.destroy()
})
</script>
