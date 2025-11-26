import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/db/index.ts', 'src/types/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['@pdf-editor/pdf', '@pdf-editor/storage'],
});
