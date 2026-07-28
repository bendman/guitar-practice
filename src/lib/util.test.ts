import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyResult,
  buildActivePool,
  formatDuration,
  formatNoteLabel,
  formatSpeak,
  formatTime,
  levelToWeight,
  pickDistractors,
  pickRandom,
  pickWeightedRandom,
  shuffle,
  weightToLevel,
} from "./util";

const item = (id: string) => ({ id });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("weightToLevel", () => {
  it("maps null/undefined to level 0 (untouched)", () => {
    expect(weightToLevel(null)).toBe(0);
    expect(weightToLevel(undefined)).toBe(0);
  });

  it("maps low weights to mastered (3), mid to 2, high to 1", () => {
    expect(weightToLevel(0.1)).toBe(3);
    expect(weightToLevel(0.59)).toBe(3);
    expect(weightToLevel(0.6)).toBe(2);
    expect(weightToLevel(2.0)).toBe(2);
    expect(weightToLevel(2.01)).toBe(1);
    expect(weightToLevel(5)).toBe(1);
  });
});

describe("levelToWeight", () => {
  it("has no weight for level 0 — never assessed is the absence of a record", () => {
    expect(levelToWeight(0)).toBeNull();
  });

  it("round-trips through weightToLevel for every assessable level", () => {
    for (const level of [1, 2, 3] as const) {
      const weight = levelToWeight(level);
      expect(weight).not.toBeNull();
      expect(weightToLevel(weight)).toBe(level);
    }
  });

  it("orders weights so a harder level is picked more often", () => {
    // Weight drives pickWeightedRandom, so declaring a note hard must raise it.
    expect(levelToWeight(1)!).toBeGreaterThan(levelToWeight(2)!);
    expect(levelToWeight(2)!).toBeGreaterThan(levelToWeight(3)!);
  });

  it("stays inside the range applyResult can produce", () => {
    for (const level of [1, 2, 3] as const) {
      expect(levelToWeight(level)!).toBeGreaterThanOrEqual(0.1);
      expect(levelToWeight(level)!).toBeLessThanOrEqual(5.0);
    }
  });
});

describe("applyResult", () => {
  it("defaults a missing weight to 1 before adjusting", () => {
    expect(applyResult({}, "a", true).a).toBeCloseTo(0.85);
    expect(applyResult({}, "a", false).a).toBeCloseTo(1.3);
  });

  it("multiplies down on correct, clamped to 0.1", () => {
    expect(applyResult({ a: 0.1 }, "a", true).a).toBe(0.1);
    expect(applyResult({ a: 2 }, "a", true).a).toBeCloseTo(1.7);
  });

  it("multiplies up on incorrect, clamped to 5.0", () => {
    expect(applyResult({ a: 5 }, "a", false).a).toBe(5);
    expect(applyResult({ a: 2 }, "a", false).a).toBeCloseTo(2.6);
  });

  it("does not mutate the input and leaves other entries intact", () => {
    const weights = { a: 1, b: 3 };
    const next = applyResult(weights, "a", true);
    expect(weights.a).toBe(1);
    expect(next.b).toBe(3);
  });
});

describe("buildActivePool", () => {
  it("keeps all mastered items and only `limit` unmastered ones", () => {
    const pool = [item("m1"), item("u1"), item("u2"), item("u3")];
    const weights = { m1: 0.2, u1: 1, u2: 1, u3: 1 };
    const result = buildActivePool(pool, weights, 2);
    expect(result.map((i) => i.id)).toEqual(["m1", "u1", "u2"]);
  });

  it("treats unweighted items as unmastered", () => {
    const pool = [item("a"), item("b"), item("c")];
    expect(buildActivePool(pool, {}, 1).map((i) => i.id)).toEqual(["a"]);
  });
});

describe("pickRandom", () => {
  it("returns null on empty, the sole item on singleton", () => {
    expect(pickRandom([], null)).toBeNull();
    expect(pickRandom([item("only")], "only")).toEqual(item("only"));
  });

  it("never repeats the last id", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.5);
    const result = pickRandom([item("a"), item("b")], "a");
    expect(result?.id).toBe("b");
  });
});

describe("pickWeightedRandom", () => {
  it("returns null on empty, the sole item on singleton", () => {
    expect(pickWeightedRandom([], null, {})).toBeNull();
    expect(pickWeightedRandom([item("x")], null, {})?.id).toBe("x");
  });

  it("excludes the last id from candidates", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const result = pickWeightedRandom([item("a"), item("b")], "a", { a: 1, b: 1 });
    expect(result?.id).toBe("b");
  });

  it("biases selection by weight", () => {
    // total = 1 + 9 = 10; rand = 0.95 * 10 = 9.5 lands in the heavy item.
    vi.spyOn(Math, "random").mockReturnValue(0.95);
    const result = pickWeightedRandom([item("a"), item("b")], null, { a: 1, b: 9 });
    expect(result?.id).toBe("b");
  });
});

describe("shuffle", () => {
  it("returns a new array containing the same items", () => {
    const input = [1, 2, 3, 4];
    const out = shuffle(input);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
  });
});

describe("pickDistractors", () => {
  it("returns `count` unique items, never the target", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const target = item("t");
    const active = [target, item("a"), item("b"), item("c"), item("d")];
    const result = pickDistractors(target, active, active, {}, 3);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).not.toContain("t");
    expect(new Set(result.map((i) => i.id)).size).toBe(3);
  });

  it("tops up from the full pool when the active pool is too small", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const target = item("t");
    const result = pickDistractors(
      target,
      [target],
      [target, item("x"), item("y"), item("z")],
      {},
      3,
    );
    expect(result.map((i) => i.id).sort()).toEqual(["x", "y", "z"]);
  });
});

describe("formatNoteLabel", () => {
  it("is a no-op for solfège", () => {
    expect(formatNoteLabel("Ré# Majeur", "solfege")).toBe("Ré# Majeur");
  });

  it("translates the leading solfège syllable, preserving the rest", () => {
    expect(formatNoteLabel("Ré# Majeur", "letters")).toBe("D# Majeur");
    expect(formatNoteLabel("Sol mineur", "letters")).toBe("G mineur");
  });
});

describe("formatSpeak", () => {
  it("is a no-op for solfège", () => {
    expect(formatSpeak("« Do dièse »", "solfege")).toBe("« Do dièse »");
  });

  it("strips guillemets and renders accidentals in English", () => {
    expect(formatSpeak("« Do dièse »", "letters")).toBe("C sharp ");
    expect(formatSpeak("« Si bémol »", "letters")).toBe("B flat ");
  });
});

describe("formatTime", () => {
  it("renders m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(600)).toBe("10:00");
  });
});

describe("formatDuration", () => {
  it("omits empty leading units", () => {
    expect(formatDuration(5)).toBe("5s");
    expect(formatDuration(65)).toBe("1m 05s");
    expect(formatDuration(3661)).toBe("1h 01m 01s");
  });
});
