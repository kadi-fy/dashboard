<template>
  <div class="col-span-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
    <div
      v-for="metric in metrics"
      :key="metric.field"
      class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-100/90 dark:border-gray-700/80 shadow-md px-4 py-4 flex flex-col gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      @click="openModal(metric)"
    >
      <span class="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-40" :class="metric.cardGlowClass"></span>
      <span class="pointer-events-none absolute inset-0 metric-grid-overlay"></span>

      <div class="relative z-10 flex flex-col gap-2">
      <!-- 标题 + 图标 -->
      <div class="flex items-start justify-between gap-2">
        <span class="text-sm font-semibold leading-5 text-gray-700 dark:text-gray-200">{{ metric.label }}</span>
        <div
          class="relative w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
          :class="metric.iconShellClass"
        >
          <span class="absolute inset-[3px] rounded-[12px] metric-orb-animate" :class="metric.iconOrbClass"></span>
          <span class="absolute top-1 left-1 h-3.5 w-5.5 rounded-full bg-white/35 blur-[1px]"></span>
          <component :is="metric.icon" class="w-6 h-6" :class="metric.iconClass" />
        </div>
      </div>

      <!-- 数值 -->
      <div class="text-2xl font-bold text-gray-900 dark:text-white leading-none">
        {{ formatDisplay(currentData?.[metric.field], metric) }}
      </div>

      <!-- 同比变化 -->
      <div class="flex flex-wrap items-center gap-1 text-xs">
        <span
          v-if="yoyChange(metric.field) !== null"
          :class="isGood(metric) ? 'text-red-500' : 'text-green-500'"
          class="font-semibold"
        >
          {{ yoyChange(metric.field) >= 0 ? '↑' : '↓' }}
          {{ formatYoyChange(metric) }}{{ metric.isPercent ? ' %' : '万元' }}
        </span>
        <span class="text-gray-400 dark:text-gray-500">
          较上年同期:
          {{ prevData?.[metric.field] != null
            ? formatDisplay(prevData[metric.field], metric)
            : '--' }}
        </span>
      </div>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <!-- 弹框主体 -->
        <div
          class="modal-panel relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl"
          @click.stop
        >
          <!-- 标题栏 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <component :is="activeMetric?.icon" class="w-5 h-5" :class="activeMetric?.modalIconClass || 'text-gray-600 dark:text-gray-300'" />
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ activeMetric?.label }}</h3>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ props.selectedYear }}年 1-{{ props.selectedMonth }}月</span>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="closeModal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 图表区域 -->
          <div class="px-6 pt-4 pb-6">
            <!-- 图例 -->
            <div class="flex items-center gap-6 mb-3">
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-8 h-0.5 bg-blue-500 rounded"></span>
                <span class="text-xs text-gray-600 dark:text-gray-300">{{ props.selectedYear }}年</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-8 border-t-2 border-dashed border-gray-400"></span>
                <span class="text-xs text-gray-600 dark:text-gray-300">{{ props.selectedYear - 1 }}年</span>
              </div>
            </div>
            <!-- 折线图 -->
            <div class="h-72 md:h-80">
              <MetricLineChart
                v-if="modalChartReady"
                :current-values="modalCurrentValues"
                :lastyear-values="modalLastYearValues"
                :unit="activeMetric?.unit ?? ''"
                width="100%"
                height="320"
              />
              <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">加载中...</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch, h, nextTick } from 'vue'
import { GLOBAL_CONFIG } from '../../utils/Utils'
import MetricLineChart from '../../charts/MetricLineChart.vue'

const API_BASE_URL = GLOBAL_CONFIG.API_BASE_URL

// ---------- Props ----------
const props = defineProps({
  selectedYear: { type: Number, required: true },
  selectedMonth: { type: Number, required: true },
})

// ---------- 内联 SVG 图标 (函数式组件) ----------
const IconAsset = (_, { attrs }) => h('svg', { viewBox: '0 0 1024 1024', fill: 'currentColor', ...attrs }, [
  h('path', {
    d: 'M512.001 954.78c-244.529 0-448.662-50.729-499.262-118.49C4.869 846.835 0.413 857.745 0.413 868.984c0 83.485 229.044 151.16 511.588 151.16 282.54 0 511.586-67.675 511.586-151.16 0-11.239-4.452-22.144-12.325-32.694-50.601 67.762-254.739 118.49-499.261 118.49zM512.001 376.657c282.54 0 511.586-83.459 511.586-186.402 0-102.946-229.046-186.399-511.586-186.399C229.457 3.855 0.413 87.309 0.413 190.258c0 102.952 229.044 186.399 511.588 186.399zM286.12 523.371v-65.329c-137.092-20.014-239.578-57.583-273.381-102.84C4.869 365.748 0.413 376.657 0.413 387.897c0 59.493 116.609 110.811 285.707 135.474zM737.879 458.042v65.329c169.097-24.663 285.708-75.988 285.708-135.474 0-11.24-4.452-22.156-12.325-32.695-33.799 45.257-136.298 82.826-273.383 102.84zM737.879 619.948v65.322c169.097-24.669 285.708-75.982 285.708-135.48 0-11.233-4.452-22.149-12.325-32.688-33.799 45.257-136.298 82.819-273.383 102.846zM286.12 685.271v-65.322c-137.093-20.028-239.578-57.59-273.381-102.847C4.869 527.641 0.413 538.557 0.413 549.79c0 59.498 116.609 110.812 285.707 135.481z',
  }),
  h('path', {
    d: 'M286.12 846.146v-65.328C149.027 760.796 46.542 723.234 12.739 677.983 4.869 688.515 0.413 699.43 0.413 710.665c0 59.492 116.609 110.818 285.707 135.481zM737.879 780.817v65.328c169.097-24.662 285.708-75.988 285.708-135.48 0-11.234-4.452-22.149-12.325-32.682-33.799 45.251-136.298 82.813-273.383 102.834zM469.541 835.629v-69.585h-83.053c-17.957 0-26.936-8.207-26.936-24.691 1.473-13.468 10.451-21.675 26.936-24.691h83.053v-38.159h-83.053c-17.957 0-26.936-8.207-26.936-24.691 1.473-13.468 10.451-21.675 26.936-24.691h47.139l-71.83-101.01c-7.506-5.963-10.486-14.205-8.979-24.691 1.473-25.428 15.713-39.632 42.648-42.648 13.469 1.508 24.691 7.505 33.67 17.957l83.053 118.968 83.053-118.968c7.471-10.452 18.694-16.449 33.67-17.957 25.428 3.016 39.633 17.221 42.648 42.648 0 10.486-3.016 18.729-8.979 24.691l-71.828 101.01h47.137c14.941 3.017 23.92 11.224 26.937 24.691-1.509 16.484-10.487 24.691-26.937 24.691h-83.053v38.159h83.053c14.941 3.017 23.92 11.224 26.937 24.691-1.509 16.484-10.487 24.691-26.937 24.691h-83.053v69.585c-1.508 25.463-15.712 38.159-42.648 38.159-28.443 0-42.648-12.696-42.648-38.159z',
  }),
])

const IconROE = (_, { attrs }) => h('svg', { viewBox: '0 0 1024 1024', fill: 'currentColor', ...attrs }, [
  h('path', {
    d: 'M753.877835 446.464c148.871529 0 269.522824 129.204706 269.492706 288.587294 0 157.696-118.151529 285.846588-264.854588 288.527059h-9.276235c-146.672941-2.680471-264.854588-130.831059-264.854589-288.527059 0-159.382588 120.651294-288.587294 269.492706-288.587294z m114.386824 381.952c14.607059-6.686118 23.070118-24.485647 19.57647-42.074353-4.065882-17.92-18.040471-29.967059-34.544941-29.967059h-63.759059v-24.877176h62.524236c1.987765 0 3.312941-0.090353 5.029647-0.301177l1.957647-0.240941c9.216-1.505882 17.468235-6.927059 22.889412-15.088941 5.752471-8.583529 7.951059-19.365647 5.933176-29.665882-3.915294-18.582588-18.401882-30.388706-36.141176-30.388706h-28.340706l19.847529-20.841412c7.137882-7.137882 14.275765-14.637176 21.564235-22.618353 9.216-9.848471 12.679529-24.335059 9.035295-37.707294a35.990588 35.990588 0 0 0-25.6-25.810824c-12.890353-3.192471-25.088 0.722824-34.665412 10.782118l-17.438118 18.492235c-12.378353 13.101176-21.082353 22.287059-42.044235 44.333177l-58.849883-61.801412-0.662588-0.692706a50.115765 50.115765 0 0 0-5.12-4.758588 33.731765 33.731765 0 0 0-28.069647-7.04753 35.629176 35.629176 0 0 0-23.702588 17.588706 40.297412 40.297412 0 0 0 6.294588 47.585883l40.508235 42.526117h-28.340705c-18.883765 0-34.454588 13.854118-36.472471 33.67153-1.204706 10.962824 1.807059 21.775059 8.673882 29.81647 6.927059 8.192 16.956235 12.528941 27.798589 12.528942h61.831529v24.515764h-62.162824c-9.487059 0-17.679059 2.981647-24.274823 9.276236-11.053176 9.547294-15.510588 26.804706-10.119529 41.712941 5.210353 14.938353 18.552471 24.786824 33.430588 24.69647h63.427764v36.924236c0 12.288 4.186353 22.588235 12.649412 30.238117 6.866824 5.903059 14.607059 8.975059 22.738824 8.975059 5.089882-0.030118 10.089412-1.204706 14.697412-3.403294 13.492706-6.746353 21.172706-19.395765 21.172705-34.816v-37.918118h62.162824c6.234353 0 11.685647-1.084235 16.564706-3.614117z m74.992941-741.857882V442.127059a318.915765 318.915765 0 0 0-175.164235-52.555294c-130.710588 0-244.043294 79.691294-299.881412 196.21647H173.842071c-21.142588 0-38.430118 17.980235-39.062589 40.598589-0.602353 22.618353 15.661176 41.682824 36.74353 43.008l2.319059 0.060235h265.84847c-5.632 26.503529-8.493176 53.609412-8.463059 80.805647 0 29.846588 3.373176 58.849882 9.758118 86.558118H80.838776a78.245647 78.245647 0 0 1-57.163294-25.328942A89.780706 89.780706 0 0 1 0.003012 750.230588V86.558118C0.003012 38.761412 36.204424 0 80.838776 0h781.583059c21.443765 0 42.014118 9.125647 57.163294 25.359059a89.750588 89.750588 0 0 1 23.702589 61.199059zM665.603012 192.602353c12.890353-17.498353 10.300235-42.857412-5.842824-56.922353a39.454118 39.454118 0 0 0-55.235764 2.349176l-1.807059 2.017883-182.543059 219.407059-106.917647-91.166118-2.017883-1.626353a39.454118 39.454118 0 0 0-53.278117 5.391059l-1.746824 2.108235-125.801411 159.62353-1.566118 2.138353a42.887529 42.887529 0 0 0 5.421176 55.024941l1.92753 1.746823 2.017882 1.596236a39.454118 39.454118 0 0 0 53.097412-5.51153l1.746823-2.078118 100.141177-127.09647 106.10447 90.473412 2.048 1.65647c16.203294 12.077176 38.550588 10.089412 52.495059-4.638117l1.807059-1.987765 208.353882-250.428235 1.626353-2.078118z',
  }),
])

const IconLabor = (_, { attrs }) => h('svg', { viewBox: '0 0 1050 1024', fill: 'currentColor', ...attrs }, [
  h('path', {
    d: 'M699.09839799 697.494468l39.86160901-49.764855a441.633001 441.633001 0 0 0-116.272762-67.103021A305.726491 305.726491 0 0 0 794.334504 305.710196 305.769427 305.769427 0 1 0 333.917489 569.577055c-181.889 55.034004-314.3117 224.004251-314.3117 423.911405h63.747022a378.992331 378.992331 0 0 1 378.991332-379.034269c87.289945 0 169.989729 29.577931 236.753256 83.040277zM246.456799 305.710196a242.06534199 242.06534199 0 1 1 484.13068299 0 242.06534199 242.06534199 0 0 1-484.13068299 0z',
  }),
  h('path', {
    d: 'M791.23212601 591.973685l-10.96366501 62.76848 138.28596501 24.096099-238.49466201 150.313045-76.32628-79.640342-285.795187 212.78496699 38.077268 51.12383001 240.66343-179.21099001 73.43558699 76.62283801 277.67828101-175.047193-29.493058 126.387692 62.087495 14.448473 56.437911-241.937532z',
  }),
])

const IconResearch = (_, { attrs }) => h('svg', { viewBox: '0 0 1024 1024', fill: 'currentColor', ...attrs }, [
  h('path', {
    d: 'M730.88 59.392l4.416-4.288 152.192 147.2-46.592 45.056-152.256-147.136 42.24-40.832zM138.432 548.224c0-14.72 5.44-27.264 16.192-37.632l415.488-399.68a53.504 53.504 0 0 1 38.4-15.68 54.528 54.528 0 0 1 38.784 15.68l197.888 191.808a49.28 49.28 0 0 1 16.448 37.44c0 14.72-5.504 27.2-16.384 37.376l-124.544 120c1.92 3.072 3.584 6.144 5.12 9.344 93.568 67.776 141.44 142.848 143.616 225.216v0.512a302.72 302.72 0 0 1-62.848 169.792h148.608v64H368.128v-64h350.08a254.72 254.72 0 0 0 59.008-75.84c14.976-29.44 23.872-60.48 26.496-93.12a228.288 228.288 0 0 0-71.552-141.12c-6.912 21.76-19.776 40.128-38.528 55.04a119.04 119.04 0 0 1-75.52 26.24 120.192 120.192 0 0 1-62.08-16.32L431.36 777.216a53.376 53.376 0 0 1-38.912 15.68 54.72 54.72 0 0 1-38.272-15.104L154.688 585.856a50.304 50.304 0 0 1-16.192-37.632z m20.608-33.024z m449.408-351.872L210.688 548.48l181.888 175.872 118.08-113.728a111.36 111.36 0 0 1-13.376-53.12 110.4 110.4 0 0 1 35.072-82.56 117.76 117.76 0 0 1 84.992-34.176 120.896 120.896 0 0 1 56.96 13.76l116.672-112.32-182.464-178.88z m-29.632 431.36a53.504 53.504 0 0 0 38.784 15.488 53.44 53.44 0 0 0 38.656-15.68 49.664 49.664 0 0 0 15.68-37.312 49.152 49.152 0 0 0-15.744-36.672 53.056 53.056 0 0 0-38.272-15.232 53.504 53.504 0 0 0-38.848 15.168 49.664 49.664 0 0 0-16.128 37.12c0 14.464 5.248 26.88 15.872 37.12z m-492.16 2.112l4.544-4.224 234.304 236.352-47.616 44.16-234.24-236.416 43.008-39.872z',
  }),
])

const IconCashRatio = (_, { attrs }) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, ...attrs }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 17V7m6 10V4m6 13v-6m4 6V9' }),
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M3 20h18' }),
])

const IconCash = (_, { attrs }) => h('svg', { viewBox: '0 0 1280 1024', fill: 'currentColor', ...attrs }, [
  h('path', {
    d: 'M813.312 640c113.792 0 173.376 42.24 173.376 83.2v219.52c0 40.832-59.52 81.28-173.376 81.28-112.896 0-172.416-40.768-173.312-81.28v-220.48c0-40.896 59.52-82.24 173.312-82.24z m122.944 252.032c-27.392 16.768-70.464 28.672-122.88 28.672-52.48 0-95.872-11.904-123.264-28.672v37.632c0 13.056 44.032 43.584 123.2 43.584 79.232 0 122.944-30.528 122.944-43.584v-37.632zM1026.688 384C1149.44 384 1280 425.728 1280 503.04v350.72c0 77.312-130.56 119.04-253.312 119.04v-51.712c128.96 0 200.96-43.328 200.96-74.496v-97.088c-48.768 32.192-122.88 53.12-200.96 53.12v-49.728c128.96 0 200.96-42.176 200.96-73.28V566.528c-48.704 32.192-122.88 47.872-200.96 47.872-78.144 0-150.72-16.896-199.488-49.152V614.4h-53.888V503.04c0-77.312 130.56-119.04 253.376-119.04z m-337.344 404.416v39.104c0 13.056 44.8 43.648 123.968 43.648 79.232 0 124.16-30.592 124.16-43.648v-39.04c-27.392 16.64-71.68 27.84-124.16 27.84-52.48 0-96.64-11.136-123.968-27.904z m123.968-97.024c-79.168 0-123.712 26.88-123.712 38.4s44.544 38.4 123.712 38.4c79.232 0 123.84-26.88 123.84-38.4s-44.672-38.4-123.84-38.4zM906.688 0c44.16 0 80 34.368 80 76.8v230.4a37.504 37.504 0 0 1-5.376 19.52 40.32 40.32 0 0 1-34.624 19.2 39.552 39.552 0 0 1-39.488-32.128l-0.512-6.272V102.4a25.088 25.088 0 0 0-7.808-18.112 27.264 27.264 0 0 0-18.88-7.488H106.688a27.264 27.264 0 0 0-18.88 7.488 25.088 25.088 0 0 0-7.808 18.112v512c0 14.08 11.968 25.6 26.688 25.6H533.76c19.84 0 36.352 13.952 39.488 32.192l0.512 6.208a38.912 38.912 0 0 1-33.536 37.888l-6.464 0.512H80C35.84 716.8 0 682.432 0 640V76.8C0 34.368 35.84 0 80 0h826.688z m120 435.2c-123.968 0-200 37.248-200 64 0 26.752 76.032 64 200 64 123.904 0 200-37.248 200-64 0-26.752-76.16-64-200-64z m-320-256c22.08 0 40 17.216 40 38.4v256c0 21.184-17.92 38.4-40 38.4a39.232 39.232 0 0 1-40-38.4v-256c0-21.184 17.92-38.4 40-38.4zM280 332.8c22.08 0 40 17.216 40 38.4v102.4c0 21.184-17.92 38.4-40 38.4a39.232 39.232 0 0 1-40-38.4V371.2c0-21.184 17.92-38.4 40-38.4zM493.312 256c22.144 0 40 17.216 40 38.4v179.2c0 21.184-17.92 38.4-40 38.4a39.232 39.232 0 0 1-40-38.4V294.4c0-21.184 17.92-38.4 40-38.4z',
  }),
])

// ---------- 指标配置 ----------
const metrics = [
  {
    field: 'asset',
    label: '资产负债率',
    isPercent: true,
    unit: '%',
    higherIsBetter: false,
    cardGlowClass: 'bg-violet-400/60 dark:bg-violet-500/40',
    iconShellClass: 'border-violet-200/80 dark:border-violet-700/60 bg-violet-50/60 dark:bg-violet-900/20',
    iconOrbClass: 'bg-gradient-to-br from-violet-500 to-indigo-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-violet-600 dark:text-violet-300',
    icon: IconAsset,
  },
  {
    field: 'roe',
    label: '净资产收益率',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    cardGlowClass: 'bg-emerald-400/60 dark:bg-emerald-500/40',
    iconShellClass: 'border-emerald-200/80 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-900/20',
    iconOrbClass: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-emerald-600 dark:text-emerald-300',
    icon: IconROE,
  },
  {
    field: 'labor',
    label: '全员劳动生产率',
    isPercent: false,
    unit: '万元/人',
    higherIsBetter: true,
    cardGlowClass: 'bg-blue-400/60 dark:bg-blue-500/40',
    iconShellClass: 'border-blue-200/80 dark:border-blue-700/60 bg-blue-50/60 dark:bg-blue-900/20',
    iconOrbClass: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-blue-600 dark:text-blue-300',
    icon: IconLabor,
  },
  {
    field: 'research',
    label: '研发投入强度',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    cardGlowClass: 'bg-orange-400/60 dark:bg-orange-500/40',
    iconShellClass: 'border-orange-200/80 dark:border-orange-700/60 bg-orange-50/60 dark:bg-orange-900/20',
    iconOrbClass: 'bg-gradient-to-br from-orange-500 to-amber-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-orange-600 dark:text-orange-300',
    icon: IconResearch,
  },
  {
    field: 'cash_ratio',
    label: '营业收现率',
    isPercent: true,
    unit: '%',
    higherIsBetter: true,
    cardGlowClass: 'bg-fuchsia-400/60 dark:bg-fuchsia-500/40',
    iconShellClass: 'border-fuchsia-200/80 dark:border-fuchsia-700/60 bg-fuchsia-50/60 dark:bg-fuchsia-900/20',
    iconOrbClass: 'bg-gradient-to-br from-fuchsia-500 to-purple-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-fuchsia-600 dark:text-fuchsia-300',
    icon: IconCashRatio,
  },
  {
    field: 'cash',
    label: '经营性净现金流',
    isPercent: false,
    unit: '万元',
    higherIsBetter: true,
    cardGlowClass: 'bg-cyan-400/60 dark:bg-cyan-500/40',
    iconShellClass: 'border-cyan-200/80 dark:border-cyan-700/60 bg-cyan-50/60 dark:bg-cyan-900/20',
    iconOrbClass: 'bg-gradient-to-br from-cyan-500 to-sky-500',
    iconClass: 'relative text-white',
    modalIconClass: 'text-cyan-600 dark:text-cyan-300',
    icon: IconCash,
  },
]

// ---------- 数据 ----------
const currentData = ref(null)      // 当月快照（用于卡片显示）
const prevData = ref(null)         // 上年同期快照
const allCurrentYear = ref([])     // 今年全月数据（用于折线图）
const allLastYear = ref([])        // 去年全月数据（用于折线图）

const loadData = async () => {
  try {
    const params = new URLSearchParams({
      year: props.selectedYear,
      month: props.selectedMonth,
    })
    // 使用 /company-lastyear 同时获取今年与去年全部月度数据
    const res = await fetch(`${API_BASE_URL}/company-lastyear?${params}`)
    if (!res.ok) return
    const json = await res.json()
    const allData = json.data ?? []

    const currYear = props.selectedYear
    const prevYear = props.selectedYear - 1

    const curr = allData
      .filter(r => Math.floor(r.time_id / 100) === currYear)
      .sort((a, b) => a.time_id - b.time_id)
    const prev = allData
      .filter(r => Math.floor(r.time_id / 100) === prevYear)
      .sort((a, b) => a.time_id - b.time_id)

    allCurrentYear.value = curr
    allLastYear.value = prev

    // 当月快照（卡片显示）
    const targetTimeId = currYear * 100 + props.selectedMonth
    currentData.value = curr.find(r => r.time_id === targetTimeId)
      ?? (curr.length ? curr[curr.length - 1] : null)

    // 上年同期快照
    const prevTargetId = prevYear * 100 + props.selectedMonth
    prevData.value = prev.find(r => r.time_id === prevTargetId)
      ?? (prev.length ? prev[0] : null)
  } catch (e) {
    console.error('CompanyMetricCards load failed', e)
  }
}

// ---------- Modal ----------
const modalOpen = ref(false)
const activeMetric = ref(null)
const modalChartReady = ref(false)

const modalCurrentValues = computed(() => {
  if (!activeMetric.value) return []
  const field = activeMetric.value.field
  return allCurrentYear.value.map(r => {
    const v = Number(r[field] ?? 0)
    return activeMetric.value.isPercent ? (Math.abs(v) <= 1 ? v * 100 : v) : v
  })
})

const modalLastYearValues = computed(() => {
  if (!activeMetric.value) return []
  const field = activeMetric.value.field
  return allLastYear.value.map(r => {
    const v = Number(r[field] ?? 0)
    return activeMetric.value.isPercent ? (Math.abs(v) <= 1 ? v * 100 : v) : v
  })
})

const openModal = async (metric) => {
  activeMetric.value = metric
  modalChartReady.value = false
  modalOpen.value = true
  await nextTick()
  modalChartReady.value = true
}

const closeModal = () => {
  modalOpen.value = false
  activeMetric.value = null
  modalChartReady.value = false
}

// ---------- 计算 ----------
const yoyChange = (field) => {
  const curr = currentData.value?.[field]
  const prev = prevData.value?.[field]
  if (curr == null || prev == null) return null
  return Number(curr) - Number(prev)
}

// 判断同比变化是否为"好"（红色=好，绿色=差）
const isGood = (metric) => {
  const diff = yoyChange(metric.field)
  if (diff == null) return false
  return metric.higherIsBetter ? diff > 0 : diff < 0
}

const normalizePercentValue = (val) => {
  const n = Number(val)
  if (Number.isNaN(n)) return null
  // API returns ratio values like 0.4838; display as 48.38%
  return Math.abs(n) <= 1 ? n * 100 : n
}

const formatYoyChange = (metric) => {
  const diff = yoyChange(metric.field)
  if (diff == null) return '--'
  const n = metric.isPercent ? normalizePercentValue(diff) : Number(diff)
  if (n == null || Number.isNaN(n)) return '--'
  return Math.abs(n).toFixed(2)
}

const formatDisplay = (val, metric) => {
  if (val == null || val === '') return '--'
  const raw = Number(val)
  const n = metric.isPercent ? normalizePercentValue(raw) : raw
  if (Number.isNaN(n)) return '--'
  if (metric.isPercent) return `${n.toFixed(2)}%`
  if (metric.unit === '万元/人') return `${n.toFixed(1)}万元/人`
  // 万元：整数
  return `${Math.round(n)}万元`
}

// ---------- 生命周期 ----------
onMounted(loadData)
watch([() => props.selectedYear, () => props.selectedMonth], loadData)
</script>

<style scoped>
.metric-grid-overlay {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 14px 14px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent 70%);
}

.metric-orb-animate {
  animation: orbPulse 3.2s ease-in-out infinite;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.26s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-origin: center;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@keyframes orbPulse {
  0%,
  100% {
    transform: scale(1);
    filter: saturate(1);
  }
  50% {
    transform: scale(1.05);
    filter: saturate(1.15);
  }
}
</style>
