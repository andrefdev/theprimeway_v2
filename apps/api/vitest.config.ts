import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const r = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@repo/shared/types': r('../../packages/shared/src/types/index.ts'),
      '@repo/shared/validators': r('../../packages/shared/src/validators/index.ts'),
      '@repo/shared/constants/plans': r('../../packages/shared/src/constants/plans.ts'),
      '@repo/shared/constants': r('../../packages/shared/src/constants/index.ts'),
      '@repo/shared/utils': r('../../packages/shared/src/utils/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
