import { describe, expect, test } from "vitest";
import { formatAgo, formatClock } from "../../src/lib/time";

// UC-06: formatAgo is the design library's avAgo, word for word; formatClock is local HH:MM.

describe("UC-06 formatAgo matches the design library's avAgo", () => {
  test.each([
    [0, "0s"],
    [59_000, "59s"],
    [60_000, "1m"],
    [59 * 60_000, "59m"],
    [61 * 60_000, "1h 1m"],
  ])("UC-06 %i ms gives %s", (ms, expected) => {
    expect(formatAgo(ms)).toBe(expected);
  });

  test("UC-06 null and a non-finite number give an em dash", () => {
    expect(formatAgo(null)).toBe("—");
    expect(formatAgo(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatAgo(Number.NaN)).toBe("—");
  });

  test("UC-06 the edges follow avAgo: seconds are rounded, an hour is '1h 0m', negatives are 0s", () => {
    expect(formatAgo(59_400)).toBe("59s");
    expect(formatAgo(59_500)).toBe("1m");
    expect(formatAgo(60 * 60_000)).toBe("1h 0m");
    expect(formatAgo(25 * 3_600_000 + 5 * 60_000)).toBe("25h 5m");
    expect(formatAgo(-5_000)).toBe("0s");
  });
});

describe("UC-06 formatClock gives local HH:MM", () => {
  test.each([
    [new Date(2026, 10, 7, 14, 6, 0), "14:06"],
    [new Date(2026, 10, 7, 4, 5, 59), "04:05"],
    [new Date(2026, 10, 7, 0, 0, 0), "00:00"],
    [new Date(2026, 10, 7, 23, 59, 0), "23:59"],
  ])("UC-06 %s gives %s", (date, expected) => {
    expect(formatClock(date.toISOString())).toBe(expected);
  });
});
