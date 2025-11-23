import { defineConfig } from 'vitest/config';
import os from 'os';

const cpus = Math.max(1, os.cpus().length || 1);
// Leave one CPU free when possible
const maxThreads = Math.max(1, cpus - 1);

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Use the richer setup file which registers jest-dom, MSW, and helpers
    setupFiles: ['./vitest.setup.jsx'],
    // Enable threads and cap workers to avoid oversubscribing CI machines
    threads: true,
    maxThreads
  }
});