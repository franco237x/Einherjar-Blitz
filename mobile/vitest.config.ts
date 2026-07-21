import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/assets': resolve(__dirname, 'assets'),
    },
  },
  test: {
    // Only run tests under src/**/*.test.ts so we don't try to import
    // React Native components (which would need a jest-preset).
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
