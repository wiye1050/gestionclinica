import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'functions'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'functions/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      // Coverage thresholds (FASE 1: Target 30% overall, 80% for critical code)
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
        // Critical modules should have higher coverage
        'lib/validators/**': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'lib/utils/helpers.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
