import type { SessionResult } from "../../lib/summarizeSession";

export type ChordMode = "manual" | "auto" | "quiz";

export type SessionMode = "notes" | "chords";
export type SessionFlow = "timed" | "reveal" | "quiz";

/**
 * Single source of the mode↔flow mapping. The config route uses it to pick the
 * flow when starting a session; the session route dispatches components off the
 * same vocabulary. Adding a flow means extending this map and the dispatch in
 * session.$mode.tsx together.
 */
const CHORD_MODE_FLOW: Record<ChordMode, SessionFlow> = {
  quiz: "quiz",
  manual: "reveal",
  auto: "timed",
};

export function flowForMode(mode: SessionMode, chordMode: ChordMode): SessionFlow {
  return mode === "notes" ? "timed" : CHORD_MODE_FLOW[chordMode];
}

/**
 * The working-set bucket only governs the graded chord flows: they earn weights,
 * so mastery can rotate the bucket. Notes and the ungraded chord carousel draw
 * from the whole selection — a bucket that can never rotate is just a blindfold.
 */
export function usesWorkingSet(mode: SessionMode, flow: SessionFlow): boolean {
  return mode === "chords" && flow !== "timed";
}

export interface SessionRawResult {
  results: SessionResult[];
  bestStreak: number;
  practiceTime: number;
}
