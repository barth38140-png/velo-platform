import { afterEach, vi } from 'vitest';

afterEach(() => {
  try {
    vi.restoreAllMocks();
    vi.useRealTimers();
  } catch (e) {
    // ignore if not needed
  }
});
