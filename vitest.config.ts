import {defineConfig} from 'vitest/config';
import path from 'node:path';

const sourcePath = path.resolve(__dirname, 'source');

export default defineConfig({
  resolve: {
    alias: {
      '@': sourcePath,
      '~': path.resolve(__dirname, 'node_modules'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['source/**/*.spec.ts', 'source/**/*.spec.tsx'],
    exclude: ['node_modules', 'extension', 'safari', '**/*.d.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['source/**/*.{ts,tsx}'],
      exclude: [
        'node_modules',
        'source/**/*.spec.{ts,tsx}',
        'source/**/__test__/**',
        'source/**/*.d.ts',
        'source/vite-env.d.ts',
        'source/globals.d.ts',
        'source/__mocks__/**',
        '**/*.json',
      ],
      reporter: ['text', 'html'],
    },
  },
});
