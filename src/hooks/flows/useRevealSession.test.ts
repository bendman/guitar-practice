import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRevealSession } from "./useRevealSession";
import type { ChordItem, PracticeItem } from "../../lib/constants";

const chord = (id: string): PracticeItem =>
  ({ id, label: id, labelShort: id, speak: id, type: "chord", defaultEnabled: true, rootId: id, qualityId: "maj", voicings: [] }) as ChordItem;

const pool = [chord("a"), chord("b"), chord("c")];

beforeEach(() => {
  vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [] });
  vi.spyOn(Math, "random").mockReturnValue(0);
  vi.useFakeTimers({
    toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date", "setTimeout", "clearTimeout"],
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useRevealSession", () => {
  it("start shows the first item, unrevealed", () => {
    const { result } = renderHook(() => useRevealSession({ interval: 5, pool }));
    act(() => result.current.start());
    expect(result.current.current?.id).toBe("a");
    expect(result.current.count).toBe(1);
    expect(result.current.revealed).toBe(false);
  });

  it("auto-reveals and pauses when the recall timer elapses", () => {
    const { result } = renderHook(() => useRevealSession({ interval: 1, pool }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1200));
    expect(result.current.revealed).toBe(true);
    expect(result.current.paused).toBe(true);
  });

  it("grading records the result, advances, and clears the reveal", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useRevealSession({ interval: 5, pool, onResult }));
    act(() => result.current.start());
    act(() => result.current.reveal());
    expect(result.current.revealed).toBe(true);
    act(() => result.current.grade(true));
    expect(onResult).toHaveBeenCalledWith("a", true);
    expect(result.current.streak).toBe(1);
    expect(result.current.revealed).toBe(false);
    expect(result.current.paused).toBe(false);
    expect(result.current.count).toBe(2);
    expect(result.current.current?.id).toBe("b");
  });

  it("skipping advances without recording a result", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useRevealSession({ interval: 5, pool, onResult }));
    act(() => result.current.start());
    act(() => result.current.skip());
    expect(onResult).not.toHaveBeenCalled();
    expect(result.current.count).toBe(2);
    expect(result.current.revealed).toBe(false);
  });

  it("finish returns the graded results", () => {
    const { result } = renderHook(() => useRevealSession({ interval: 5, pool }));
    act(() => result.current.start());
    act(() => result.current.grade(true));
    act(() => result.current.grade(false));
    let out!: ReturnType<typeof result.current.finish>;
    act(() => {
      out = result.current.finish();
    });
    expect(out.results.map((r) => r.correct)).toEqual([true, false]);
    expect(result.current.current).toBeNull();
  });
});
