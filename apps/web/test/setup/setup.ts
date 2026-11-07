import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Shared by every web test: unmount what a test rendered, and give the next test real timers.
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
