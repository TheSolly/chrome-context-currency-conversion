import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/vitest.setup.js'],
    // Only run real specs; the legacy tests/**/test-*.js manual scripts are excluded.
    include: ['tests/**/*.test.js']
  }
});
