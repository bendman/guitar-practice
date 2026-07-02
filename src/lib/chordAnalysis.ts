import { Chord, Interval, Note } from "tonal";
import type { ChordItem } from "./constants";

export type NoteRole = "root" | "third" | "fifth" | "other";

/** Map from app root IDs (solfège) to tonal note names. */
const ROOT_ID_TO_NOTE: Record<string, string> = {
  do: "C",
  do_s: "C#",
  re: "D",
  re_s: "D#",
  mi: "E",
  fa: "F",
  fa_s: "F#",
  sol: "G",
  sol_s: "G#",
  la: "A",
  la_s: "A#",
  si: "B",
};

/** Map from app quality IDs to tonal chord type names. */
const QUALITY_ID_TO_TYPE: Record<string, string> = {
  maj: "major",
  min: "minor",
  dim: "diminished",
  maj7: "major seventh",
  min7: "minor seventh",
  m7b5: "half-diminished",
  dom7: "dominant seventh",
};

/** Semitone intervals from root for a given quality. Cached per quality. */
const intervalCache = new Map<string, number[]>();
function getIntervals(qualityId: string): number[] {
  if (intervalCache.has(qualityId)) return intervalCache.get(qualityId)!;
  const type = QUALITY_ID_TO_TYPE[qualityId];
  const intervals = type
    ? Chord.get(`C ${type}`).intervals.map((i) => Interval.semitones(i) ?? 0)
    : [0];
  intervalCache.set(qualityId, intervals);
  return intervals;
}

/** Returns the set of semitones (mod 12) that belong to a chord. */
export function getChordSemitones(rootId: string, qualityId: string): Set<number> {
  const rootNote = ROOT_ID_TO_NOTE[rootId];
  const type = QUALITY_ID_TO_TYPE[qualityId];
  if (!rootNote || !type) return new Set([0]);
  const { notes } = Chord.get(`${rootNote} ${type}`);
  return new Set(notes.map((n) => Note.chroma(n) ?? 0));
}

/**
 * Returns the harmonic role of a note semitone within a chord.
 * "third" refers to the second note in the quality interval list (could be
 * a minor or major third depending on the quality), and "fifth" is the third.
 */
export function getNoteRole(noteSemitone: number, rootId: string, qualityId: string): NoteRole {
  const rootNote = ROOT_ID_TO_NOTE[rootId];
  if (!rootNote) return "other";
  const rootSemitone = Note.chroma(rootNote) ?? 0;
  const intervals = getIntervals(qualityId);
  const rel = (noteSemitone - rootSemitone + 12) % 12;
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
