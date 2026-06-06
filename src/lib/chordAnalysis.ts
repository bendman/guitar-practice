import type { ChordItem } from "./constants";

export type NoteRole = "root" | "third" | "fifth" | "other";

/** Semitone (C=0) for each chord root id. */
const CHORD_ROOT_SEMITONES: Record<string, number> = {
  do: 0, do_s: 1, re: 2, re_s: 3, mi: 4, fa: 5,
  fa_s: 6, sol: 7, sol_s: 8, la: 9, la_s: 10, si: 11,
};

/** Intervals (in semitones from root) for each chord quality id. */
const QUALITY_INTERVALS: Record<string, number[]> = {
  maj:  [0, 4, 7],
  min:  [0, 3, 7],
  dim:  [0, 3, 6],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dom7: [0, 4, 7, 10],
};

/** Returns the set of semitones (mod 12) that belong to a chord. */
export function getChordSemitones(rootId: string, qualityId: string): Set<number> {
  const root = CHORD_ROOT_SEMITONES[rootId] ?? 0;
  const intervals = QUALITY_INTERVALS[qualityId] ?? [0];
  return new Set(intervals.map((i) => (root + i) % 12));
}

/**
 * Returns the harmonic role of a note semitone within a chord.
 * "third" refers to the second note in the quality interval list (could be
 * a minor or major third depending on the quality), and "fifth" is the third.
 */
export function getNoteRole(noteSemitone: number, rootId: string, qualityId: string): NoteRole {
  const root = CHORD_ROOT_SEMITONES[rootId] ?? 0;
  const intervals = QUALITY_INTERVALS[qualityId] ?? [0];
  const rel = (noteSemitone - root + 12) % 12;
  if (rel === intervals[0]) return "root";
  if (rel === intervals[1]) return "third";
  if (rel === intervals[2]) return "fifth";
  return "other";
}

/**
 * Filters the chord list to those whose note set contains all played
 * semitones. When no semitones are played, returns the full list.
 */
export function filterPossibleChords(
  playedSemitones: Set<number>,
  chords: ChordItem[],
): ChordItem[] {
  if (playedSemitones.size === 0) return chords;
  return chords.filter((c) => {
    const chordNotes = getChordSemitones(c.rootId, c.qualityId);
    if (chordNotes.size !== playedSemitones.size) return false;
    for (const s of playedSemitones) {
      if (!chordNotes.has(s)) return false;
    }
    return true;
  });
}
