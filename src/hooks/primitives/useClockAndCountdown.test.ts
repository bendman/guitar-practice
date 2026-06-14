import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePracticeClock } from "./usePracticeClock";
import { useCountdown } from "./useCountdown";

// Fake timers drive requestAnimationFrame + performance.now together so the
// RAF-based hooks advance deterministically.
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("usePracticeClock", () => {
  it("accumulates elapsed seconds only while active", () => {
    const { result, rerender } = renderHook(({ active }) => usePracticeClock(active), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(1000));
    const afterFirst = result.current.practiceTime;
    expect(afterFirst).toBeGreaterThan(0.5);

    // Pause: time should hold roughly steady.
    rerender({ active: false });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.practiceTime).toBeCloseTo(afterFirst, 1);

    // Resume: it continues accumulating.
    rerender({ active: true });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.practiceTime).toBeGreaterThan(afterFirst);
  });

  it("reset zeroes the accumulator", () => {
    const { result } = renderHook(() => usePracticeClock(true));
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.practiceTime).toBeGreaterThan(0);
    act(() => result.current.reset());
    expect(result.current.practiceTime).toBe(0);
  });
});

describe("useCountdown", () => {
  it("drives progress to 1 and fires onElapsed exactly once", () => {
    const onElapsed = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({ durationMs: 200, running: true, onElapsed }),
    );
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.progress).toBeGreaterThan(0);
    expect(result.current.progress).toBeLessThan(1);
    expect(onElapsed).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(200));
    expect(result.current.progress).toBe(1);
    expect(onElapsed).toHaveBeenCalledTimes(1);

    // Stays at 1 without re-firing.
    act(() => vi.advanceTimersByTime(200));
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it("does not advance while paused", () => {
    const { result } = renderHook(() => useCountdown({ durationMs: 200, running: false }));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.progress).toBe(0);
  });

  it("restart begins a fresh cycle that can fire again", () => {
    const onElapsed = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({ durationMs: 100, running: true, onElapsed }),
    );
    act(() => vi.advanceTimersByTime(150));
    expect(onElapsed).toHaveBeenCalledTimes(1);
    act(() => result.current.restart());
    expect(result.current.progress).toBe(0);
    act(() => vi.advanceTimersByTime(150));
    expect(onElapsed).toHaveBeenCalledTimes(2);
  });
});
