import { defineConfig } from 'vitest/config';

// Firestore Rules tests; they need the emulator (see `npm run test:rules`).
export default defineConfig({
  test: {
    include: ['firestore-tests/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
  },
});
