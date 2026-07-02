import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuizSession } from "./useQuizSession";
import type { ChordItem, PracticeItem } from "../../lib/constants";

const chord = (id: string): PracticeItem =>
  ({
    id,
    label: id,
    labelShort: id,
    speak: id,
    type: "chord",
    defaultEnabled: true,
    rootId: id,
    qualityId: "maj",
    voicings: [],
  }) as ChordItem;

const pool = [chord("a"), chord("b"), chord("c"), chord("d"), chord("e")];

beforeEach(() => {
  vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [] });
  vi.spyOn(Math, "random").mockReturnValue(0);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useQuizSession", () => {
  it("start builds a 4-choice round containing the target", () => {
    const { result } = renderHook(() => useQuizSession({ pool }));
    act(() => result.current.start());
    expect(result.current.count).toBe(1);
    expect(result.current.choices).toHaveLength(4);
    expect(result.current.selectedId).toBeNull();
    const target = result.current.current!;
    expect(result.current.correctId).toBe(target.id);
    expect(result.current.choices.map((c) => c.id)).toContain(target.id);
  });

  it("selecting the correct choice scores a streak and records the result", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useQuizSession({ pool, onResult }));
    act(() => result.current.start());
    const correct = result.current.correctId!;
    act(() => result.current.select(correct));
    expect(result.current.selectedId).toBe(correct);
    expect(result.current.streak).toBe(1);
    expect(onResult).toHaveBeenCalledWith(correct, true);
  });

  it("selecting a wrong choice breaks the streak and reports the confusion", () => {
    const onConfusion = vi.fn();
    const { result } = renderHook(() => useQuizSession({ pool, onConfusion }));
    act(() => result.current.start());
    const correct = result.current.correctId!;
    const wrong = result.current.choices.find((c) => c.id !== correct)!.id;
    act(() => result.current.select(wrong));
    expect(result.current.streak).toBe(0);
    expect(onConfusion).toHaveBeenCalledWith(correct, wrong);
  });

  it("ignores a second selection in the same round", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useQuizSession({ pool, onResult }));
    act(() => result.current.start());
    const correct = result.current.correctId!;
    const other = result.current.choices.find((c) => c.id !== correct)!.id;
    act(() => result.current.select(correct));
    act(() => result.current.select(other));
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(result.current.selectedId).toBe(correct);
  });

  it("next starts a fresh round only after a selection", () => {
    const { result } = renderHook(() => useQuizSession({ pool }));
    act(() => result.current.start());
    act(() => result.current.next());
    expect(result.current.count).toBe(1); // no-op before selecting
    act(() => result.current.select(result.current.correctId!));
    act(() => result.current.next());
    expect(result.current.count).toBe(2);
    expect(result.current.selectedId).toBeNull();
  });

  it("finish returns the accumulated results and clears the round", () => {
    const { result } = renderHook(() => useQuizSession({ pool }));
    act(() => result.current.start());
    act(() => result.current.select(result.current.correctId!));
    let out!: ReturnType<typeof result.current.finish>;
    act(() => {
      out = result.current.finish();
    });
    expect(out.results).toHaveLength(1);
    expect(out.bestStreak).toBe(1);
    expect(result.current.choices).toEqual([]);
    expect(result.current.current).toBeNull();
  });
});
