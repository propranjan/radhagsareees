export default {
  entry: ['src/index.ts', 'src/adapters/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disabled DTS temporarily to fix build issues
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  external: ['react', 'posthog-js'],
};