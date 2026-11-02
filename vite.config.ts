import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  // 相對路徑：不論 GitHub repo 叫什麼名字（待決事項 Q5），部署到 Pages 都能正常載入
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
    // 網站範本用 ?raw 把 CSS 內嵌進 HTML；不打開的話測試裡會拿到空字串
    css: true,
  },
})
