import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useItemQueue } from "./useItemQueue";
import type { PracticeItem } from "../../lib/constants";

vi.mock("../../lib/util", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/util")>();
  return { ...actual, sayAloud: vi.fn() };
});
import { sayAloud } from "../../lib/util";

const note = (id: string): PracticeItem =>
  ({ id, label: id, speak: id, type: "note" }) as PracticeItem;

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(sayAloud).mockClear();
});

describe("useItemQueue", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useItemQueue({ pool: [note("a"), note("b")] }));
    expect(result.current.current).toBeNull();
    expect(result.current.count).toBe(0);
  });

  it("advance picks an item, bumps count, and never repeats the last id", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() =>
      useItemQueue({ pool: [note("a"), note("b")], weights: { a: 1, b: 1 } }),
    );
    act(() => {
      result.current.advance();
    });
    const first = result.current.current?.id;
    expect(first).toBe("a");
    expect(result.current.count).toBe(1);
    act(() => {
      result.current.advance();
    });
    expect(result.current.current?.id).toBe("b");
    expect(result.current.count).toBe(2);
  });

  it("advance returns null and stays empty for an empty pool", () => {
    const { result } = renderHook(() => useItemQueue({ pool: [] }));
    let returned: PracticeItem | null = note("x");
    act(() => {
      returned = result.current.advance();
    });
    expect(returned).toBeNull();
    expect(result.current.current).toBeNull();
  });

  it("setTo forces an item without bumping the count", () => {
    const { result } = renderHook(() => useItemQueue({ pool: [note("a"), note("b")] }));
    act(() => {
      result.current.setTo(note("b"));
    });
    expect(result.current.current?.id).toBe("b");
    expect(result.current.count).toBe(0);
  });

  it("reset clears current and count", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useItemQueue({ pool: [note("a"), note("b")] }));
    act(() => result.current.advance());
    act(() => result.current.reset());
    expect(result.current.current).toBeNull();
    expect(result.current.count).toBe(0);
  });

  it("speaks on set/advance only when tts is enabled", () => {
    const { result, rerender } = renderHook(
      ({ tts }) => useItemQueue({ pool: [note("a")], tts }),
      { initialProps: { tts: false } },
    );
    act(() => result.current.setTo(note("a")));
    expect(sayAloud).not.toHaveBeenCalled();
    rerender({ tts: true });
    act(() => result.current.setTo(note("a")));
    expect(sayAloud).toHaveBeenCalledTimes(1);
  });
});
