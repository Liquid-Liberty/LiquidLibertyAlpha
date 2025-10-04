import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['netlify/functions/**/*.test.js', 'tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/*.test.js',
        'netlify/functions/test-*.js',
        'netlify/functions/debug-*.js',
      ],
    },
    testTimeout: 30000,
  },
});
