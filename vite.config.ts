import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  // 相對路徑：不論 GitHub repo 叫什麼名字（待決事項 Q5），部署到 Pages 都能正常載入
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
})
