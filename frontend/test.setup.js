import { afterEach, vi } from 'vitest';

afterEach(() => {
  try {
    vi.restoreAllMocks();
    vi.useRealTimers();
  } catch {
    // ignore if not needed
  }
});
