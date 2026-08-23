import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Mirrors tsconfig.json paths: { "@/*": ["./src/*"] }
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
