import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    reporters: 'verbose',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      exclude: [
        'app/layout.tsx',
        '**/*.d.ts',
        '**/node_modules/**',
      ],
      thresholds: {
        // Thresholds sobre lib/ (lógica testada). Páginas app/ com 0% são listadas
        // no relatório mas não bloqueiam o CI — elevar conforme testes são adicionados.
        'lib/**': {
          lines: 65,
          functions: 50,
          branches: 60,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
