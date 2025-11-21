import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/*.spec.{ts,js}'],
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@ops": path.resolve(__dirname, "src/ops"),
      "@query": path.resolve(__dirname, "src/query"),
      "@types": path.resolve(__dirname, "src/types")
    },
  },
});