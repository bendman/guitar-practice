import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimedSession } from "./useTimedSession";
import type { NoteItem, PracticeItem } from "../../lib/constants";

const note = (id: string): PracticeItem => ({ id, label: id, speak: id, type: "note" }) as NoteItem;

const pool = [note("do"), note("re"), note("mi")];

beforeEach(() => {
  vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [] });
  vi.spyOn(Math, "random").mockReturnValue(0);
  vi.useFakeTimers({
    toFake: [
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
      "setTimeout",
      "clearTimeout",
    ],
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useTimedSession — auto (non-listening)", () => {
  it("auto-advances without credit when the timer elapses", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useTimedSession({ interval: 1, pool, onResult }));
    act(() => result.current.start());
    expect(result.current.current?.id).toBe("do");
    // Timer elapses (1s) then the ~200ms inter-item gap.
    act(() => vi.advanceTimersByTime(1300));
    expect(onResult).toHaveBeenCalledWith("do", false);
    expect(result.current.count).toBe(2);
    expect(result.current.current?.id).toBe("re");
  });

  it("forceAccept advances the current item", () => {
    const { result } = renderHook(() => useTimedSession({ interval: 10, pool }));
    act(() => result.current.start());
    act(() => result.current.forceAccept());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.count).toBe(2);
  });

  it("does not advance while paused", () => {
    const { result } = renderHook(() => useTimedSession({ interval: 1, pool }));
    act(() => result.current.start());
    act(() => result.current.pauseToggle());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.count).toBe(1);
  });

  it("skip advances to the next item without recording", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useTimedSession({ interval: 10, pool, onResult }));
    act(() => result.current.start());
    act(() => result.current.pauseToggle());
    act(() => result.current.skip());
    expect(onResult).not.toHaveBeenCalled();
    expect(result.current.count).toBe(2);
    expect(result.current.current?.id).toBe("re");
    expect(result.current.hitStatus).toBeNull();
  });
});

describe("useTimedSession — listening", () => {
  it("a correct in-time note hit advances with credit at timeout", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() =>
      useTimedSession({ interval: 1, pool, listening: true, onResult }),
    );
    act(() => result.current.start());
    expect(result.current.micActive).toBe(true);
    act(() => result.current.onDetectedNote("do"));
    expect(result.current.hitStatus).toBe("correct");
    act(() => vi.advanceTimersByTime(1300));
    expect(onResult).toHaveBeenCalledWith("do", true);
    expect(result.current.streak).toBe(1);
    expect(result.current.count).toBe(2);
  });

  it("flags a wrong note without advancing", () => {
    const { result } = renderHook(() => useTimedSession({ interval: 10, pool, listening: true }));
    act(() => result.current.start());
    act(() => result.current.onDetectedNote("re"));
    expect(result.current.hitStatus).toBe("wrong");
    expect(result.current.count).toBe(1);
  });

  it("a late correct hit advances without credit after the timer expired", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() =>
      useTimedSession({ interval: 1, pool, listening: true, onResult }),
    );
    act(() => result.current.start());
    // Let the timer expire with no hit: streak broken, still waiting.
    act(() => vi.advanceTimersByTime(1100));
    expect(result.current.count).toBe(1);
    expect(result.current.streak).toBe(0);
    // The late hit now advances, scored as incorrect.
    act(() => result.current.onDetectedNote("do"));
    act(() => vi.advanceTimersByTime(300));
    expect(onResult).toHaveBeenCalledWith("do", false);
    expect(result.current.count).toBe(2);
  });
});
