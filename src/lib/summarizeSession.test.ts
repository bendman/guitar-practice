import { describe, it, expect } from "vitest";
import { summarizeSession } from "./summarizeSession";
import type { SessionResult } from "./summarizeSession";

const note = (id: string, label: string, correct = false): SessionResult => ({
  id,
  label,
  type: "note",
  correct,
  responseTime: null,
});

type PoolItem = { id: string; label: string; type: "note" | "chord" };

const POOL: PoolItem[] = [
  { id: "do", label: "Do", type: "note" },
  { id: "re", label: "Ré", type: "note" },
  { id: "mi", label: "Mi", type: "note" },
];

function summarize(results: SessionResult[], poolItems: PoolItem[] = POOL) {
  return summarizeSession({
    results,
    bestStreak: 0,
    practiceTime: 10,
    wasListening: false,
    wasManualChord: false,
    poolItems,
  });
}

describe("summarizeSession — noteExposure", () => {
  it("counts how often each note came up", () => {
    const summary = summarize([note("do", "Do"), note("mi", "Mi"), note("do", "Do")]);
    expect(summary.noteExposure).toEqual([
      { id: "do", label: "Do", count: 2 },
      { id: "re", label: "Ré", count: 0 },
      { id: "mi", label: "Mi", count: 1 },
    ]);
  });

  it("keeps notes that never came up, at zero", () => {
    const summary = summarize([note("do", "Do")]);
    expect(summary.noteExposure.find((n) => n.id === "re")).toEqual({
      id: "re",
      label: "Ré",
      count: 0,
    });
  });

  it("reports the whole pool even when nothing was practiced", () => {
    const summary = summarize([]);
    expect(summary.noteExposure.map((n) => n.id)).toEqual(["do", "re", "mi"]);
    expect(summary.noteExposure.every((n) => n.count === 0)).toBe(true);
  });

  it("preserves pool order rather than sorting by count", () => {
    const summary = summarize([note("mi", "Mi"), note("mi", "Mi"), note("mi", "Mi")]);
    expect(summary.noteExposure.map((n) => n.id)).toEqual(["do", "re", "mi"]);
  });

  it("ignores chords in the pool", () => {
    const summary = summarize(
      [note("do", "Do")],
      [...POOL, { id: "do_maj", label: "Do Majeur", type: "chord" }],
    );
    expect(summary.noteExposure.map((n) => n.id)).toEqual(["do", "re", "mi"]);
  });

  it("still counts a note that is absent from the pool", () => {
    const summary = summarize([note("la", "La")]);
    expect(summary.noteExposure).toContainEqual({ id: "la", label: "La", count: 1 });
  });

  it("is empty when the session drew from a chord pool", () => {
    const summary = summarize([], [{ id: "do_maj", label: "Do Majeur", type: "chord" }]);
    expect(summary.noteExposure).toEqual([]);
  });

  it("totals the same number of cards the summary reports", () => {
    const results = [note("do", "Do"), note("re", "Ré"), note("do", "Do")];
    const summary = summarize(results);
    const seen = summary.noteExposure.reduce((sum, n) => sum + n.count, 0);
    expect(seen).toBe(summary.totalCount);
  });
});
