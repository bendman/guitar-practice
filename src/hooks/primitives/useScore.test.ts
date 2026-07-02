import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useScore } from "./useScore";

const chord = (id: string) => ({ id, label: id, type: "chord" as const });

describe("useScore", () => {
  it("starts at zero", () => {
    const { result } = renderHook(() => useScore());
    expect(result.current.streak).toBe(0);
    expect(result.current.snapshot()).toEqual({ results: [], bestStreak: 0 });
  });

  it("grows the streak on correct and zeroes it on incorrect", () => {
    const { result } = renderHook(() => useScore());
    act(() => result.current.record(chord("a"), true));
    act(() => result.current.record(chord("b"), true));
    expect(result.current.streak).toBe(2);
    act(() => result.current.record(chord("c"), false));
    expect(result.current.streak).toBe(0);
  });

  it("remembers the best streak across resets of the live streak", () => {
    const { result } = renderHook(() => useScore());
    act(() => result.current.record(chord("a"), true));
    act(() => result.current.record(chord("b"), true));
    act(() => result.current.record(chord("c"), false));
    act(() => result.current.record(chord("d"), true));
    expect(result.current.snapshot().bestStreak).toBe(2);
  });

  it("logs every result with its response time and fires onResult", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useScore({ onResult }));
    act(() => result.current.record(chord("a"), true, 1.5));
    act(() => result.current.record(chord("b"), false));
    expect(onResult).toHaveBeenNthCalledWith(1, "a", true);
    expect(onResult).toHaveBeenNthCalledWith(2, "b", false);
    expect(result.current.snapshot().results).toEqual([
      { id: "a", label: "a", type: "chord", correct: true, responseTime: 1.5 },
      { id: "b", label: "b", type: "chord", correct: false, responseTime: null },
    ]);
  });

  it("breakStreak zeroes the streak without logging a result", () => {
    const { result } = renderHook(() => useScore());
    act(() => result.current.record(chord("a"), true));
    act(() => result.current.breakStreak());
    expect(result.current.streak).toBe(0);
    expect(result.current.snapshot().results).toHaveLength(1);
  });

  it("reset clears results and streaks", () => {
    const { result } = renderHook(() => useScore());
    act(() => result.current.record(chord("a"), true));
    act(() => result.current.reset());
    expect(result.current.streak).toBe(0);
    expect(result.current.snapshot()).toEqual({ results: [], bestStreak: 0 });
  });
});
