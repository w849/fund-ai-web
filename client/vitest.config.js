import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/utils/**', 'src/stores/**', 'src/components/**'],
    },
    deps: {
      inline: ['element-plus', 'vue-echarts'],
    },
  },
})
