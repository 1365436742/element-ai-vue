import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import { compiler } from './internal/vue-types/compiler'

export default defineConfig({
  plugins: [Vue({ compiler })],
  test: {
    include: ['packages/**/__tests__/**/*.test.{ts,tsx}'],
    clearMocks: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      include: ['packages/**/*.{ts,tsx,vue}'],
      exclude: [
        '**/*.d.ts',
        '**/dist/**',
        '**/__tests__/**',
        '**/tests/**',
        'packages/theme-chalk/**',
        'packages/uniapp-polyfill/**',
        'packages/element-ai-vue/version.ts',
        '**/lang/**',
        'packages/components/*/style/**',
      ],
    },
  },
})
