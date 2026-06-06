import { describe, it, expect } from "vitest";
import {
  applyCellTap, applyMarkerTap, applyDotTap, applyBarre,
} from "./chordBuilderState";
import type { BuilderState } from "./chordBuilderState";

const open6 = (): BuilderState => ({ frets: [0, 0, 0, 0, 0, 0], barres: [] });

// ─── applyBarre ────────────────────────────────────────────────────────────

describe("applyBarre", () => {
  it("raises all covered strings to the barre fret", () => {
    const s = applyBarre(open6(), 0, 5, 2);
    expect(s.frets).toEqual([2, 2, 2, 2, 2, 2]);
    expect(s.barres).toEqual([{ fret: 2, from: 0, to: 5 }]);
  });

  it("does not lower strings already above the barre fret", () => {
    const before: BuilderState = { frets: [0, 3, 0, 0, 0, 0], barres: [] };
    const s = applyBarre(before, 0, 5, 2);
    expect(s.frets[1]).toBe(3); // higher individual note preserved
    expect(s.frets[0]).toBe(2); // open raised to barre
  });

  it("replaces an existing barre at the same fret", () => {
    const before: BuilderState = {
      frets: [2, 2, 2, 2, 2, 2],
      barres: [{ fret: 2, from: 0, to: 5 }],
    };
    const s = applyBarre(before, 2, 5, 2);
    expect(s.barres).toHaveLength(1);
    expect(s.barres[0]).toEqual({ fret: 2, from: 2, to: 5 });
  });
});

// ─── applyCellTap ──────────────────────────────────────────────────────────

describe("applyCellTap", () => {
  it("places a dot on an empty cell", () => {
    const s = applyCellTap(open6(), 2, 3);
    expect(s.frets[2]).toBe(3);
  });

  it("is a no-op for a cell shadowed below a barre", () => {
    const before = applyBarre(open6(), 0, 5, 3);
    const s = applyCellTap(before, 2, 1); // rel 1 < barre 3
    expect(s).toEqual(before);
  });

  it("removes the barre when tapping exactly on the barre fret (bug: barre-covered string at fret 0)", () => {
    // Reproduce: barre at 2, string 2 drifted to fret 0 (open), tap at barre fret
    const before: BuilderState = {
      frets: [2, 2, 0, 2, 2, 2],
      barres: [{ fret: 2, from: 0, to: 5 }],
    };
    const s = applyCellTap(before, 2, 2); // tap at barre fret on drifted string
    expect(s.barres).toHaveLength(0);
  });

  it("allows placing a dot above the barre fret on a covered string", () => {
    const before = applyBarre(open6(), 0, 5, 2);
    const s = applyCellTap(before, 3, 4); // fret 4 > barre 2
    expect(s.frets[3]).toBe(4);
  });
});

// ─── applyMarkerTap ────────────────────────────────────────────────────────

describe("applyMarkerTap", () => {
  it("toggles open → muted on a free string", () => {
    const s = applyMarkerTap(open6(), 1);
    expect(s.frets[1]).toBe(-1);
  });

  it("toggles muted → open on a free string", () => {
    const before: BuilderState = { frets: [0, -1, 0, 0, 0, 0], barres: [] };
    const s = applyMarkerTap(before, 1);
    expect(s.frets[1]).toBe(0);
  });

  it("is a no-op for a barre-covered string (bug: open string behind barre)", () => {
    const before = applyBarre(open6(), 0, 5, 2);
    const s = applyMarkerTap(before, 2);
    expect(s).toEqual(before); // state unchanged
    expect(s.frets[2]).toBe(2); // still at barre fret, not open
  });
});

// ─── applyDotTap ───────────────────────────────────────────────────────────

describe("applyDotTap", () => {
  it("removes a plain dot (string returns to open)", () => {
    const before: BuilderState = { frets: [0, 3, 0, 0, 0, 0], barres: [] };
    const s = applyDotTap(before, 1);
    expect(s.frets[1]).toBe(0);
  });

  it("removes an entire barre when tapping a barre dot", () => {
    const before = applyBarre(open6(), 0, 5, 2);
    const s = applyDotTap(before, 0);
    expect(s.barres).toHaveLength(0);
    expect(s.frets[0]).toBe(0);
  });

  it("preserves individual fingers above the barre when removing barre", () => {
    const withBarre = applyBarre(open6(), 0, 5, 2);
    const withDot = applyCellTap(withBarre, 3, 4);
    const s = applyDotTap(withDot, 0); // tap the barre
    expect(s.barres).toHaveLength(0);
    expect(s.frets[3]).toBe(4); // individual finger above barre kept
    expect(s.frets[0]).toBe(0);
  });

  it("falls back to barre fret (not open) when removing a dot above a barre (bug: open string + barre)", () => {
    // Reproduce: barre at 2, add note at 3 on string 2, remove that note
    // Before fix: string 2 became 0 (open) while barre still covered it
    const withBarre = applyBarre(open6(), 0, 5, 2);
    const withDot = applyCellTap(withBarre, 2, 3);
    expect(withDot.frets[2]).toBe(3);
    const s = applyDotTap(withDot, 2);
    expect(s.frets[2]).toBe(2); // falls back to barre fret, not 0
    expect(s.barres).toHaveLength(1); // barre still present
  });
});

// ─── barre auto-removal when fully shadowed ────────────────────────────────

describe("barre removed when all covered strings are fretted above it", () => {
  it("removes the barre once the last covered string gets a higher note", () => {
    // Barre at 2 covering strings 0–2; place individual notes above on all three
    let s = applyBarre(open6(), 0, 2, 2);
    s = applyCellTap(s, 0, 3);
    s = applyCellTap(s, 1, 4);
    expect(s.barres).toHaveLength(1); // barre still alive — string 2 still at barre fret
    s = applyCellTap(s, 2, 3);
    expect(s.barres).toHaveLength(0); // now fully shadowed → pruned
  });

  it("keeps the barre while at least one covered string is still at the barre fret", () => {
    let s = applyBarre(open6(), 0, 5, 2);
    // Place higher notes on strings 0–4 but leave string 5 at barre fret
    for (let i = 0; i < 5; i++) s = applyCellTap(s, i, 3);
    expect(s.barres).toHaveLength(1);
    expect(s.frets[5]).toBe(2);
  });

  it("does not prune barres when a note is placed on a non-covered string", () => {
    // Barre covers 0–2; placing a note on string 3 (outside range) shouldn't prune it
    let s = applyBarre(open6(), 0, 2, 2);
    s = applyCellTap(s, 3, 4);
    expect(s.barres).toHaveLength(1);
  });
});

// ─── barre placement guard ─────────────────────────────────────────────────

describe("applyBarre placement guard", () => {
  it("rejects a barre if all strings in range are already fretted above it", () => {
    // All 6 strings at fret 3; trying to place a barre at fret 2 → no-op
    const before: BuilderState = { frets: [3, 3, 3, 3, 3, 3], barres: [] };
    const s = applyBarre(before, 0, 5, 2);
    expect(s).toEqual(before);
    expect(s.barres).toHaveLength(0);
  });

  it("rejects a partial-range barre if all strings in that range are already higher", () => {
    // Strings 0–2 at fret 4, rest open; barre at fret 3 on strings 0–2 → rejected
    const before: BuilderState = { frets: [4, 4, 4, 0, 0, 0], barres: [] };
    const s = applyBarre(before, 0, 2, 3);
    expect(s).toEqual(before);
  });

  it("accepts a barre if at least one string in range is at or below the barre fret", () => {
    // Strings 0–1 at fret 4, string 2 open → barre at fret 3 on strings 0–2 is valid
    const before: BuilderState = { frets: [4, 4, 0, 0, 0, 0], barres: [] };
    const s = applyBarre(before, 0, 2, 3);
    expect(s.barres).toHaveLength(1);
    expect(s.frets[2]).toBe(3); // open string raised to barre fret
    expect(s.frets[0]).toBe(4); // higher note preserved
  });
});

// ─── played semitones (effective fret accounting for barres) ───────────────
// These tests document the invariant: a barre-covered string should contribute
// the barre's semitone, not the open-string semitone.

describe("state invariant: no open-string marker behind a barre", () => {
  it("removing a dot above a barre never leaves frets[i] < barre.fret on a covered string", () => {
    const withBarre = applyBarre(open6(), 0, 5, 2);
    const withDot = applyCellTap(withBarre, 2, 3);
    const s = applyDotTap(withDot, 2);
    const barre = s.barres[0];
    for (let i = barre.from; i <= barre.to; i++) {
      expect(s.frets[i]).toBeGreaterThanOrEqual(barre.fret);
    }
  });

  it("marker tap never leaves frets[i] = 0 on a barre-covered string", () => {
    const s = applyBarre(open6(), 0, 5, 2);
    const after = applyMarkerTap(s, 3);
    expect(after.frets[3]).not.toBe(0);
    expect(after.frets[3]).toBe(2); // unchanged
  });
});
