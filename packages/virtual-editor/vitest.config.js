import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/*.spec.{ts,js}'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      "@types": path.resolve(__dirname, "src/types/index.ts")
    },
  },
});