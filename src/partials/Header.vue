<template>
  <header
    class="sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30"
    :class="[
      variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-xs lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90',
      variant === 'v2' ? 'dark:before:bg-gray-800' : '',
      variant === 'v3' ? 'dark:before:bg-gray-900' : '',
    ]"
  >
    <div class="px-4 sm:px-6 lg:px-8">
      <div
        class="flex items-center h-16"
        :class="variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'"
      >

        <!-- Header: Left side -->
        <div class="flex items-center gap-3">

          <!-- Hamburger button -->
          <button class="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden" @click.stop="$emit('toggle-sidebar')" aria-controls="sidebar" :aria-expanded="sidebarOpen">
            <span class="sr-only">Open sidebar</span>
            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="5" width="16" height="2" />
              <rect x="4" y="11" width="16" height="2" />
              <rect x="4" y="17" width="16" height="2" />
            </svg>
          </button>

          <img
            :src="processedLogoSrc"
            alt="Logo"
            class="h-10 sm:h-11 w-auto max-w-[340px] object-contain"
          />

        </div>

        <div class="flex-1 min-w-0 h-full px-3 sm:px-4">
          <WarningBroadcast />
        </div>

        <!-- Header: Right side -->
        <div class="flex items-center shrink-0">
          <ThemeToggle />
        </div>

      </div>
    </div>
  </header>
</template>

<script>
import ThemeToggle from '../components/ThemeToggle.vue'
import WarningBroadcast from '../components/WarningBroadcast.vue'

export default {
  name: 'Header',
  props: [
    'sidebarOpen',
    'variant',
  ],
  data() {
    return {
      processedLogoSrc: '/logo.png',
    }
  },
  mounted() {
    this.makeLogoTransparent('/logo.png')
  },
  components: {
    ThemeToggle,
    WarningBroadcast,
  },
  methods: {
    makeLogoTransparent(src) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = src

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const { data } = imageData
        const width = canvas.width
        const height = canvas.height

        const isLikelyBackground = (index) => {
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]
          return r > 205 && g > 205 && b > 205 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18
        }

        // Flood-fill from four corners so only connected matte background is removed.
        const queue = [
          [0, 0],
          [width - 1, 0],
          [0, height - 1],
          [width - 1, height - 1],
        ]
        const visited = new Uint8Array(width * height)

        while (queue.length > 0) {
          const [x, y] = queue.pop()
          if (x < 0 || y < 0 || x >= width || y >= height) continue

          const offset = y * width + x
          if (visited[offset]) continue
          visited[offset] = 1

          const index = offset * 4
          if (!isLikelyBackground(index)) continue

          data[index + 3] = 0

          queue.push([x + 1, y])
          queue.push([x - 1, y])
          queue.push([x, y + 1])
          queue.push([x, y - 1])
        }

        // Clean light edge halo left by JPEG-like matte.
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const isBrightNeutral = r > 230 && g > 230 && b > 230 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14
          if (alpha < 245 && isBrightNeutral) {
            data[i + 3] = Math.max(0, alpha - 220)
          }
        }

        ctx.putImageData(imageData, 0, 0)

        // Crop to non-transparent area so logo appears larger in fixed header height.
        let minX = width
        let minY = height
        let maxX = -1
        let maxY = -1

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const idx = (y * width + x) * 4
            if (data[idx + 3] > 10) {
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
            }
          }
        }

        if (maxX < minX || maxY < minY) {
          this.processedLogoSrc = src
          return
        }

        const cropWidth = maxX - minX + 1
        const cropHeight = maxY - minY + 1
        const croppedCanvas = document.createElement('canvas')
        croppedCanvas.width = cropWidth
        croppedCanvas.height = cropHeight
        const croppedCtx = croppedCanvas.getContext('2d')
        if (!croppedCtx) return

        croppedCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
        this.processedLogoSrc = croppedCanvas.toDataURL('image/png')
      }
    },
  },
}
</script>