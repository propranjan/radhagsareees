import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disabled DTS temporarily to fix build issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
});